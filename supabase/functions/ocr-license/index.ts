import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OcrResult {
  text: string
  confidence: number
  expiryDate?: string
  licenseNumber?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fileData, userId } = await req.json()
    
    console.log('Processing OCR for license', { userId })

    // Mock OCR processing - replace with real OCR service later
    const mockOcrResult: OcrResult = {
      text: "DRIVER LICENSE\nJOHN DOE\nLIC# D123456789\nEXP: 12/25/2026\nCLASS: C",
      confidence: 0.95,
      expiryDate: "2026-12-25",
      licenseNumber: "D123456789"
    }

    // Store OCR result in database
    const { data, error } = await supabaseClient
      .from('licenses')
      .insert([{
        user_id: userId,
        ocr_text: mockOcrResult.text,
        ocr_confidence: mockOcrResult.confidence,
        expires_at: mockOcrResult.expiryDate,
        storage_path: `licenses/${userId}/${Date.now()}.jpg`,
        verified: mockOcrResult.confidence > 0.8
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: mockOcrResult,
        licenseId: data.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('OCR processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'OCR processing failed' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})