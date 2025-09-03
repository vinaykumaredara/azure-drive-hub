import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const gateway = url.searchParams.get('gateway') || 'stripe'
    
    console.log(`Processing ${gateway} webhook`)

    let eventData: any
    let paymentId: string
    let status: string

    if (gateway === 'stripe') {
      const body = await req.text()
      // Mock Stripe webhook processing
      eventData = JSON.parse(body || '{}')
      
      // Extract payment info from mock event
      paymentId = eventData.data?.object?.metadata?.payment_id || `payment_mock_${Date.now()}`
      status = eventData.type === 'checkout.session.completed' ? 'completed' : 'failed'
      
      console.log('Stripe webhook event:', eventData.type)
    } else if (gateway === 'razorpay') {
      const body = await req.json()
      // Mock Razorpay webhook processing
      eventData = body
      
      paymentId = eventData.payload?.payment?.entity?.notes?.payment_id || `payment_mock_${Date.now()}`
      status = eventData.event === 'payment.captured' ? 'completed' : 'failed'
      
      console.log('Razorpay webhook event:', eventData.event)
    }

    // Update payment status
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .update({ status })
      .eq('provider_transaction_id', paymentId)
      .select('booking_id')
      .single()

    if (paymentError) {
      console.error('Payment update error:', paymentError)
      return new Response('Payment update failed', { status: 500 })
    }

    // Update booking status if payment completed
    if (status === 'completed' && payment?.booking_id) {
      const { error: bookingError } = await supabaseClient
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_id: paymentId
        })
        .eq('id', payment.booking_id)

      if (bookingError) {
        console.error('Booking update error:', bookingError)
        return new Response('Booking update failed', { status: 500 })
      }
    }

    console.log(`${gateway} webhook processed successfully`, { paymentId, status })
    
    return new Response('Webhook processed', { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
})