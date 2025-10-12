import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const CreateHoldSchema = z.object({
  carId: z.string().uuid("Invalid car ID"),
  pickup: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
  }),
  return: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
  }),
  addons: z.any().optional(),
  totals: z.object({
    total: z.number().positive("Total must be positive").max(10000000, "Amount too large")
  }),
  payMode: z.enum(["hold", "full"], { errorMap: () => ({ message: "Payment mode must be 'hold' or 'full'" }) })
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 20 booking attempts per minute per IP
  const clientId = getClientIdentifier(req);
  const isAllowed = checkRateLimit(clientId, {
    tokensPerInterval: 20,
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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) throw new Error("User not authenticated");

    // Parse and validate input
    const body = await req.json();
    const validation = CreateHoldSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: "Invalid input data", 
        details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { carId, pickup, return: returnDate, addons, totals, payMode } = validation.data;

    // Parse dates
    const startDateTime = new Date(pickup.date + "T" + pickup.time);
    const endDateTime = new Date(returnDate.date + "T" + returnDate.time);

    // Validate dates
    if (endDateTime <= startDateTime) {
      throw new Error("Return date/time must be after pickup date/time");
    }

    // Check for existing bookings that conflict
    const { data: conflicts } = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("car_id", carId)
      .in("payment_status", ["partial_hold", "paid"])
      .lt("start_datetime", endDateTime.toISOString())
      .gt("end_datetime", startDateTime.toISOString());

    if (conflicts && conflicts.length > 0) {
      throw new Error("This car is not available for the selected dates");
    }

    // Calculate hold amount (10% of total if hold mode)
    const holdAmount = payMode === "hold" ? Math.round(totals.total * 0.10) : 0;
    const holdUntil = payMode === "hold" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24 hours from now

    // Create booking with hold
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .insert({
        user_id: user.id,
        car_id: carId,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        total_amount: totals.total,
        hold_until: holdUntil?.toISOString(),
        hold_amount: holdAmount,
        payment_status: payMode === "hold" ? "partial_hold" : "unpaid",
        status: "pending"
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Create payment record if hold mode
    let payment = null;
    if (payMode === "hold" && holdAmount > 0) {
      const { data: paymentData, error: paymentError } = await supabaseClient
        .from("payments")
        .insert({
          booking_id: booking.id,
          user_id: user.id,
          amount: holdAmount,
          currency: "INR",
          method: "hold",
          status: "success" // Mark as successful since we're creating the hold
        })
        .select()
        .single();

      if (paymentError) throw paymentError;
      payment = paymentData;
    }

    // Booking created successfully

    return new Response(JSON.stringify({
      success: true,
      bookingId: booking.id,
      paymentId: payment?.id || null,
      holdAmount: holdAmount,
      holdUntil: holdUntil?.toISOString() || null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false, 
      error: error.message || "Failed to create booking hold" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});