import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization")!;
    
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No authorization header" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid token" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;

    // Get draft ID from query parameters
    const url = new URL(req.url);
    const draftId = url.searchParams.get("draftId");

    if (!draftId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No draft ID provided" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get the draft booking from storage
    // In a real implementation, you might store this in a database table
    // For now, we'll just return a success response
    console.log(`User ${user.id} requested redirect for draft ${draftId}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Redirect handled successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Booking redirect error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Booking redirect failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});