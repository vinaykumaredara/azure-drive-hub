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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { bucket, path } = await req.json()
    
    console.log('Generating signed URL', { bucket, path, userId: user.id })

    // Verify user has access to the file
    if (bucket === 'license-uploads') {
      // Check if user owns this license file
      const { data: license, error: licenseError } = await supabaseClient
        .from('licenses')
        .select('id')
        .eq('user_id', user.id)
        .eq('storage_path', path)
        .single()

      if (licenseError || !license) {
        throw new Error('Access denied: File not found or not owned by user')
      }
    } else if (bucket === 'chat-attachments') {
      // Check if user has access to this chat attachment
      // This would involve checking message ownership or admin status
      const { data: userData } = await supabaseClient
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!userData?.is_admin && !path.includes(user.id)) {
        throw new Error('Access denied: Insufficient permissions')
      }
    } else {
      throw new Error('Access denied: Invalid bucket')
    }

    // Generate signed URL
    const { data: signedUrl, error: urlError } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (urlError) {
      console.error('Signed URL generation error:', urlError)
      throw new Error('Failed to generate signed URL')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        signedUrl: signedUrl.signedUrl,
        expiresIn: 3600
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Signed URL error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to generate signed URL' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})