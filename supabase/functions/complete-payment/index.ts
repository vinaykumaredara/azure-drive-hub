import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const CompletePaymentSchema = z.object({
  payment_intent_id: z.string().min(1, "Payment intent ID is required"),
  status: z.enum(["succeeded", "failed"], { errorMap: () => ({ message: "Status must be 'succeeded' or 'failed'" }) }).default("succeeded"),
  metadata: z.record(z.any()).optional().default({})
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse and validate input
    const body = await req.json();
    const validation = CompletePaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: "Invalid input data", 
        details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { payment_intent_id, status, metadata } = validation.data;

    // Find payment by transaction ID
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*, bookings(*, cars(*))")
      .eq("provider_transaction_id", payment_intent_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    if (status === "succeeded") {
      // Update payment status
      await supabaseClient
        .from("payments")
        .update({ status: "completed", metadata })
        .eq("id", payment.id);

      // Update booking status to paid
      await supabaseClient
        .from("bookings")
        .update({ 
          status: "confirmed",
          payment_status: "paid",
          hold_until: null,
          hold_amount: null
        })
        .eq("id", payment.booking_id);

      // Mark car as booked
      await supabaseClient
        .from("cars")
        .update({ 
          booking_status: "booked",
          booked_by: payment.bookings.user_id,
          booked_at: new Date().toISOString()
        })
        .eq("id", payment.bookings.car_id);

      // Check for booking conflicts (important for race conditions)
      const { data: conflicts } = await supabaseClient
        .from("bookings")
        .select("id")
        .eq("car_id", payment.bookings.car_id)
        .eq("status", "confirmed")
        .gte("end_datetime", payment.bookings.start_datetime)
        .lte("start_datetime", payment.bookings.end_datetime)
        .neq("id", payment.booking_id);

      if (conflicts && conflicts.length > 0) {
        console.warn(`Booking conflict detected for booking ${payment.booking_id}`);
        // In a real implementation, you might want to handle this differently
      }

      console.log(`Payment confirmed for booking ${payment.booking_id}`);

      return new Response(JSON.stringify({
        success: true,
        booking_id: payment.booking_id,
        status: "confirmed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      // Payment failed
      await supabaseClient
        .from("payments")
        .update({ status: "failed", metadata })
        .eq("id", payment.id);

      await supabaseClient
        .from("bookings")
        .update({ 
          status: "failed",
          payment_status: "unpaid"
        })
        .eq("id", payment.booking_id);

      return new Response(JSON.stringify({
        success: false,
        error: "Payment failed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

  } catch (error) {
    console.error("Payment completion error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Payment completion failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});