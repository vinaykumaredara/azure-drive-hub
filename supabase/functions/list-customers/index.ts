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

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role using secure function
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch users from users table
    const { data: usersData, error: usersError } = await supabaseClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      throw usersError;
    }

    // Fetch auth users to get emails (safe in edge function with service role key)
    const { data: { users: authUsers }, error: authUsersError } = 
      await supabaseClient.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      throw authUsersError;
    }

    // Fetch user roles
    const { data: userRolesData, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    // Create role map
    const roleMap = new Map<string, string[]>();
    userRolesData?.forEach(ur => {
      const roles = roleMap.get(ur.user_id) || [];
      roles.push(ur.role);
      roleMap.set(ur.user_id, roles);
    });

    // Create email map
    const emailMap = new Map(
      authUsers?.map(authUser => [authUser.id, authUser.email]) || []
    );

    // Combine data
    const customers = usersData?.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: emailMap.get(user.id) || null,
      phone: user.phone,
      is_admin: roleMap.get(user.id)?.includes('admin') || false,
      created_at: user.created_at,
      is_suspended: user.is_suspended || false,
      suspension_reason: user.suspension_reason,
      suspended_at: user.suspended_at,
      suspended_by: user.suspended_by
    })) || [];

    return new Response(
      JSON.stringify({ customers }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Error listing customers:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to list customers" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
