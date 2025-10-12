import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (_req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find all bookings with expired holds
    const { data: expiredBookings, error } = await supabaseClient
      .from('bookings')
      .select('id, car_id')
      .eq('status', 'held')
      .lt('hold_expires_at', new Date().toISOString());

    if (error) throw error;

    // Update expired bookings
    if (expiredBookings && expiredBookings.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('bookings')
        .update({ 
          status: 'expired',
          payment_status: 'cancelled'
        })
        .in('id', expiredBookings.map(b => b.id));

      if (updateError) throw updateError;

      // Update car statuses back to available
      const { error: carUpdateError } = await supabaseClient
        .from('cars')
        .update({ booking_status: 'available' })
        .in('id', expiredBookings.map(b => b.car_id));

      if (carUpdateError) throw carUpdateError;

      console.log(`Expired ${expiredBookings.length} bookings`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      expiredBookings: expiredBookings?.length || 0 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Expire holds error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Failed to expire holds" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});