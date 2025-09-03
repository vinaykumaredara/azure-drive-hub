import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { bookingId, gateway, amount } = await req.json()
    
    console.log('Creating payment session', { bookingId, gateway, amount })

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    let paymentUrl = ''
    let sessionId = ''

    if (gateway === 'stripe') {
      // Mock Stripe session creation
      sessionId = `cs_mock_${Date.now()}`
      paymentUrl = `https://checkout.stripe.com/pay/${sessionId}#fidkdWxOYHwnPyd1blpxYHZxWjA0VGlxPUJgS2c1R29oM2pINElVSUBxMDY8YDVxT0ZsUlxzN3dgQTBBRnVSU0hvT0phXzVrN21gYlxOdnNrXXdkNzZITEZfUXBqN2RqQ2RfR2BfRTR%2FMm5dSjNNcnAwTTNVbicpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl`
    } else if (gateway === 'razorpay') {
      // Mock Razorpay order creation
      sessionId = `order_mock_${Date.now()}`
      paymentUrl = `https://api.razorpay.com/v1/checkout/embedded?order_id=${sessionId}`
    } else {
      throw new Error('Unsupported payment gateway')
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert([{
        booking_id: bookingId,
        amount: amount,
        gateway: gateway,
        provider_transaction_id: sessionId,
        status: 'pending'
      }])
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      throw paymentError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        paymentId: payment.id,
        sessionId,
        url: paymentUrl,
        gateway
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Payment creation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment creation failed' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})