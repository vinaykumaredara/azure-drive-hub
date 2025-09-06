import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mock OCR function - in production, integrate with Tesseract.js or external OCR service
function mockOCR(fileName: string): { text: string; confidence: number; expiryDate?: string; licenseNumber?: string } {
  // Simulate OCR processing
  const mockResults = [
    {
      text: "DRIVER LICENSE\nJOHN DOE\nLIC# D123456789\nEXP: 12/25/2026\nCLASS: C",
      confidence: 0.95,
      expiryDate: "2026-12-25",
      licenseNumber: "D123456789"
    },
    {
      text: "DRIVING LICENSE\nJANE SMITH\nLIC# DL987654321\nEXP: 08/15/2025\nCLASS: B",
      confidence: 0.88,
      expiryDate: "2025-08-15", 
      licenseNumber: "DL987654321"
    }
  ];
  
  return mockResults[Math.floor(Math.random() * mockResults.length)];
}

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

    const { fileName, fileData } = await req.json();

    if (!fileName || !fileData) {
      throw new Error("File name and data are required");
    }

    console.log(`Processing license upload for user ${user.id}, file: ${fileName}`);

    // Simulate file upload to storage (in real implementation, you'd save the file)
    const storagePath = `licenses/${user.id}/${Date.now()}_${fileName}`;

    // Perform OCR processing
    const ocrResult = mockOCR(fileName);

    // Store license record in database
    const { data: license, error: licenseError } = await supabaseClient
      .from("licenses")
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        ocr_text: ocrResult.text,
        ocr_confidence: ocrResult.confidence,
        expires_at: ocrResult.expiryDate,
        verified: ocrResult.confidence > 0.8 // Auto-verify if confidence is high
      })
      .select()
      .single();

    if (licenseError) throw licenseError;

    console.log(`License uploaded and processed: ${license.id}, confidence: ${ocrResult.confidence}`);

    return new Response(JSON.stringify({
      success: true,
      license_id: license.id,
      ocr_result: {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        expiry_date: ocrResult.expiryDate,
        license_number: ocrResult.licenseNumber,
        auto_verified: ocrResult.confidence > 0.8
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("License upload error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "License upload failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});