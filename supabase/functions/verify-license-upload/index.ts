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

    const { licensePath } = await req.json();

    if (!licensePath) {
      throw new Error("License path is required");
    }

    // Update user's license path and set verified to false (admin needs to verify)
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({
        license_path: licensePath,
        license_verified: false
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    console.log(`License uploaded for user ${user.id}: ${licensePath}`);

    return new Response(JSON.stringify({
      success: true,
      message: "License uploaded successfully. Awaiting admin verification."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("License upload verification error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Failed to verify license upload" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});