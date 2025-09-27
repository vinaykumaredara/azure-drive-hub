// @ts-nocheck
// NOTE: These imports are resolved at runtime by Deno in Supabase Edge Functions
// TypeScript errors in IDE are expected but won't prevent the function from working

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Check if user is admin
    const { data: userRecord } = await supabaseClient
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userRecord?.is_admin) {
      throw new Error("Access denied - admin only");
    }

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "7d";

    let dateFilter = "";
    const now = new Date();
    
    switch (period) {
      case "24h":
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case "7d":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "30d":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Get overview stats
    const [
      { count: totalBookings },
      { count: confirmedBookings },
      { count: totalCars },
      { count: totalUsers },
      { data: revenueData }
    ] = await Promise.all([
      supabaseClient.from("bookings").select("*", { count: "planned", head: true }),
      supabaseClient.from("bookings").select("*", { count: "planned", head: true }).eq("status", "confirmed"),
      supabaseClient.from("cars").select("*", { count: "planned", head: true }),
      supabaseClient.from("users").select("*", { count: "planned", head: true }),
      supabaseClient.from("payments").select("amount").eq("status", "completed").gte("created_at", dateFilter)
    ]);

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    // Get bookings by day for chart
    const { data: dailyBookings } = await supabaseClient
      .from("bookings")
      .select("created_at, status, total_amount")
      .gte("created_at", dateFilter)
      .order("created_at");

    // Process daily data
    const dailyStats: Record<string, { bookings: number; revenue: number; confirmed: number }> = {};
    dailyBookings?.forEach(booking => {
      const date = new Date(booking.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { bookings: 0, revenue: 0, confirmed: 0 };
      }
      dailyStats[date].bookings++;
      if (booking.status === 'confirmed') {
        dailyStats[date].confirmed++;
        dailyStats[date].revenue += booking.total_amount || 0;
      }
    });

    // Convert to chart format
    const chartData = Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
      date,
      bookings: stats.bookings,
      revenue: stats.revenue,
      confirmed: stats.confirmed
    }));

    // Get popular cars
    const { data: popularCars } = await supabaseClient
      .from("bookings")
      .select("car_id, cars(title, make, model), count(*)")
      .eq("status", "confirmed")
      .gte("created_at", dateFilter)
      .order("count", { ascending: false })
      .limit(5);

    console.log(`Analytics data requested for period: ${period}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        overview: {
          totalBookings: totalBookings || 0,
          confirmedBookings: confirmedBookings || 0,
          totalRevenue,
          totalCars: totalCars || 0,
          totalUsers: totalUsers || 0,
          conversionRate: totalBookings ? ((confirmedBookings || 0) / totalBookings * 100).toFixed(1) : "0"
        },
        chartData,
        popularCars: popularCars || []
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Analytics data error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Failed to fetch analytics data" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});