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

    const { carId, pickup, return: returnDate, addons, totals, payMode, licensePath } = await req.json();

    if (!carId || !pickup || !returnDate) {
      throw new Error("Missing required booking data");
    }

    // Parse dates
    const startDateTime = new Date(pickup.date + "T" + pickup.time);
    const endDateTime = new Date(returnDate.date + "T" + returnDate.time);

    // Validate dates
    if (endDateTime <= startDateTime) {
      throw new Error("Return date/time must be after pickup date/time");
    }

    // Use transaction to ensure atomicity
    const { data, error } = await supabaseClient.rpc('create_booking_transaction', {
      p_car_id: carId,
      p_user_id: user.id,
      p_start_datetime: startDateTime.toISOString(),
      p_end_datetime: endDateTime.toISOString(),
      p_total_amount: totals.total,
      p_pay_mode: payMode,
      p_license_path: licensePath
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Failed to create booking");

    console.log(`Created ${payMode} booking ${data.bookingId} for user ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      bookingId: data.bookingId,
      paymentId: data.paymentId || null,
      holdAmount: data.holdAmount || 0,
      holdUntil: data.holdUntil || null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Create booking error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Failed to create booking" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});