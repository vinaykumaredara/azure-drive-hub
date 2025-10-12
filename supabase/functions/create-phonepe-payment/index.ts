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

    const { carId, amount, currency = 'INR', userId, phone } = await req.json()
    
    console.log('Creating PhonePe payment', { carId, amount, currency, userId, phone })

    // Get car details
    const { data: car, error: carError } = await supabaseClient
      .from('cars')
      .select('id, title, make, model')
      .eq('id', carId)
      .single()

    if (carError || !car) {
      throw new Error('Car not found')
    }

    // For development, we'll create a mock payment
    const orderId = `order_dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const paymentUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/mock-pay-success?orderId=${orderId}`

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert([{
        booking_id: null, // Will be updated after successful payment
        amount: amount,
        currency: currency,
        gateway: 'phonepe',
        provider_transaction_id: orderId,
        status: 'pending',
        metadata: {
          carId: carId,
          userId: userId,
          phone: phone
        }
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
        paymentUrl,
        orderId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('PhonePe payment creation error:', error)
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