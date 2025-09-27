/// <reference types="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

console.log("Cleanup expired holds function started");

serve(async (_req) => {
  try {
    // Create Supabase client with service role key for full access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log("Finding expired holds...");
    
    // Find bookings with expired holds
    const { data: expiredBookings, error } = await supabaseClient
      .from('bookings')
      .select('id, hold_expires_at')
      .lt('hold_expires_at', new Date().toISOString())
      .eq('status', 'pending');
    
    if (error) {
      console.error('Failed to fetch expired holds:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired holds', details: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    if (expiredBookings.length === 0) {
      console.log('No expired holds found');
      return new Response(
        JSON.stringify({ message: 'No expired holds found' }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    console.log(`Found ${expiredBookings.length} expired holds, cleaning up...`);
    
    // Update expired bookings to cancelled status
    const updatedBookings = [];
    const failedBookings = [];
    
    for (const booking of expiredBookings) {
      try {
        const { error: updateError } = await supabaseClient
          .from('bookings')
          .update({ 
            status: 'cancelled',
            payment_status: 'cancelled'
          })
          .eq('id', booking.id);
        
        if (updateError) {
          console.error(`Failed to cancel booking ${booking.id}:`, updateError);
          failedBookings.push({ id: booking.id, error: updateError.message });
        } else {
          console.log(`Cancelled expired booking ${booking.id}`);
          updatedBookings.push(booking.id);
        }
      } catch (updateError: any) {
        console.error(`Failed to cancel booking ${booking.id}:`, updateError);
        failedBookings.push({ id: booking.id, error: updateError.message });
      }
    }
    
    console.log(`Cleanup complete. Updated: ${updatedBookings.length}, Failed: ${failedBookings.length}`);
    
    return new Response(
      JSON.stringify({ 
        message: 'Expired holds cleanup completed',
        updated: updatedBookings,
        failed: failedBookings
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});