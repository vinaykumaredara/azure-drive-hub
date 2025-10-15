import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/rate-limiter.ts";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const ConfirmPaymentSchema = z.object({
  payment_intent_id: z.string().min(1, "Payment intent ID is required"),
  status: z.enum(["succeeded", "failed"], { errorMap: () => ({ message: "Status must be 'succeeded' or 'failed'" }) }).default("succeeded")
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 15 confirmation attempts per minute per IP
  const clientId = getClientIdentifier(req);
  const isAllowed = checkRateLimit(clientId, {
    tokensPerInterval: 15,
    interval: 'minute'
  });

  if (!isAllowed) {
    return new Response(JSON.stringify({ 
      error: "Rate limit exceeded. Please try again later." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 429,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // SECURITY: Verify authentication or webhook signature
    const stripeSignature = req.headers.get('stripe-signature');
    const razorpaySignature = req.headers.get('x-razorpay-signature');
    const authHeader = req.headers.get('Authorization');

    if (!stripeSignature && !razorpaySignature && !authHeader) {
      console.error('Unauthorized payment confirmation attempt - no credentials provided');
      return new Response(JSON.stringify({ 
        error: "Unauthorized - Authentication required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Get request body as text for signature verification
    const bodyText = await req.text();
    let body;
    let authenticatedUser = null;

    // Verify Stripe webhook signature
    if (stripeSignature) {
      const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
      if (!stripeWebhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return new Response(
          JSON.stringify({ error: 'Webhook verification not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
          apiVersion: '2023-10-16',
          httpClient: Stripe.createFetchHttpClient(),
        });

        const event = stripe.webhooks.constructEvent(
          bodyText,
          stripeSignature,
          stripeWebhookSecret
        );
        
        console.log('Stripe webhook verified:', event.type);
        body = event.data.object;
      } catch (err) {
        console.error('Stripe signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify Razorpay webhook signature
    if (razorpaySignature) {
      const razorpayWebhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
      if (!razorpayWebhookSecret) {
        console.error('RAZORPAY_WEBHOOK_SECRET not configured');
        return new Response(
          JSON.stringify({ error: 'Webhook verification not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const expectedSignature = createHmac('sha256', razorpayWebhookSecret)
          .update(bodyText)
          .digest('hex');

        if (razorpaySignature !== expectedSignature) {
          console.error('Razorpay signature mismatch');
          return new Response(
            JSON.stringify({ error: 'Invalid webhook signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('Razorpay webhook signature verified');
        body = JSON.parse(bodyText);
      } catch (err) {
        console.error('Razorpay signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If auth header provided (non-webhook call), verify the user
    if (authHeader && !stripeSignature && !razorpaySignature) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Invalid authentication token provided');
        return new Response(JSON.stringify({ 
          error: "Invalid authentication" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
      authenticatedUser = user;
      console.log(`Payment confirmation attempt by authenticated user: ${user.id}`);
      
      try {
        body = JSON.parse(bodyText);
      } catch (e) {
        console.error('Invalid JSON in request body');
        return new Response(JSON.stringify({ 
          error: "Invalid request body" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    const validation = ConfirmPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: "Invalid input data", 
        details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { payment_intent_id, status } = validation.data;

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

      // Add security audit log
      await supabaseClient
        .from('audit_logs')
        .insert({
          action: 'payment_confirmed',
          description: `Payment confirmed for booking ${payment.booking_id}`,
          user_id: payment.bookings.user_id,
          metadata: {
            payment_id: payment.id,
            booking_id: payment.booking_id,
            amount: payment.amount,
            gateway: payment.gateway,
            authenticated_via: stripeSignature ? 'stripe_webhook' : razorpaySignature ? 'razorpay_webhook' : 'user_auth',
            payment_intent_id: payment_intent_id
          }
        });

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

      // Add security audit log for failed payment
      await supabaseClient
        .from('audit_logs')
        .insert({
          action: 'payment_failed',
          description: `Payment failed for booking ${payment.booking_id}`,
          user_id: payment.bookings.user_id,
          metadata: {
            payment_id: payment.id,
            booking_id: payment.booking_id,
            amount: payment.amount,
            gateway: payment.gateway,
            payment_intent_id: payment_intent_id
          }
        });

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