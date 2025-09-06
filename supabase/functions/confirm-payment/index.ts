import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { payment_intent_id, status = "succeeded" } = await req.json();

    if (!payment_intent_id) {
      throw new Error("Payment intent ID is required");
    }

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
        .update({ status: "completed" })
        .eq("id", payment.id);

      // Update booking status and mark car as unavailable
      await supabaseClient
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", payment.booking_id);

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
        // Handle conflict - for now just log
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
        .update({ status: "failed" })
        .eq("id", payment.id);

      await supabaseClient
        .from("bookings")
        .update({ status: "failed" })
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
    console.error("Payment confirmation error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Payment confirmation failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});