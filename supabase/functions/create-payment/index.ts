import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const CreatePaymentSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  gateway: z.enum(["stripe", "razorpay"], { errorMap: () => ({ message: "Gateway must be 'stripe' or 'razorpay'" }) }),
  amount: z.number().positive("Amount must be positive").max(10000000, "Amount too large")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Rate limiting: 10 payment creations per minute per IP
  const clientId = getClientIdentifier(req);
  const isAllowed = checkRateLimit(clientId, {
    tokensPerInterval: 10,
    interval: 'minute'
  });

  if (!isAllowed) {
    return new Response(JSON.stringify({ 
      error: "Rate limit exceeded. Please try again later." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 429,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse and validate input
    const body = await req.json();
    const validation = CreatePaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: "Invalid input data", 
        details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { bookingId, gateway, amount } = validation.data;

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
