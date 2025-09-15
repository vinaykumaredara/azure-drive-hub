/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { bookingId, reason } = await req.json()
    
    console.log('Cancelling booking', { bookingId, reason })

    // Get booking and payment details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        payments!inner(*)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // Check if booking can be cancelled
    const now = new Date()
    const startDate = new Date(booking.start_datetime)
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilStart < 24) {
      throw new Error('Cannot cancel booking less than 24 hours before start time')
    }

    // Calculate refund amount based on cancellation policy
    let refundAmount = 0
    const totalAmount = parseFloat(booking.total_amount)

    if (hoursUntilStart >= 168) { // 7 days
      refundAmount = totalAmount // 100% refund
    } else if (hoursUntilStart >= 72) { // 3 days
      refundAmount = totalAmount * 0.75 // 75% refund
    } else if (hoursUntilStart >= 24) { // 1 day
      refundAmount = totalAmount * 0.5 // 50% refund
    }

    // Mock refund processing
    const refundId = `refund_mock_${Date.now()}`
    
    if (booking.payments?.[0]?.gateway === 'stripe') {
      // Mock Stripe refund
      console.log('Processing Stripe refund:', refundAmount)
    } else if (booking.payments?.[0]?.gateway === 'razorpay') {
      // Mock Razorpay refund
      console.log('Processing Razorpay refund:', refundAmount)
    }

    // Update booking status
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        status: 'cancelled'
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Booking update error:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        refundAmount,
        refundId,
        message: `Booking cancelled successfully. Refund of $${refundAmount.toFixed(2)} will be processed within 5-7 business days.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Booking cancellation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Booking cancellation failed' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})