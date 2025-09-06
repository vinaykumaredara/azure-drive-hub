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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) throw new Error("User not authenticated");

    const { bookingId, gateway = "stripe" } = await req.json();

    // Get booking details  
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select("*, cars(*)")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found or access denied");
    }

    if (booking.status !== "pending") {
      throw new Error("Booking is not in pending status");
    }

    // Calculate amount (basic calculation - you can enhance this)
    const amount = Math.round(booking.total_amount * 100); // Convert to cents

    // For now, create a mock payment intent
    const paymentIntentId = `pi_mock_${crypto.randomUUID().slice(0, 8)}`;
    const clientSecret = `${paymentIntentId}_secret_mock`;

    // Insert payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        booking_id: bookingId,
        gateway: gateway,
        provider_transaction_id: paymentIntentId,
        amount: booking.total_amount,
        status: "pending"
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update booking with payment_id
    await supabaseClient
      .from("bookings")
      .update({ payment_id: payment.id })
      .eq("id", bookingId);

    console.log(`Created payment intent for booking ${bookingId}, amount: ${amount}`);

    return new Response(JSON.stringify({
      success: true,
      client_secret: clientSecret,
      payment_intent_id: paymentIntentId,
      amount: amount,
      currency: "usd"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment intent creation error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Payment intent creation failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});