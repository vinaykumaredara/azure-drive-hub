// Test script for delete endpoint
async function testDeleteEndpoint() {
  try {
    // Get the Supabase URL from environment or use default
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rcpkhtlvfvafympulywx.supabase.co";
    
    // Construct the Edge Function URL
    const functionUrl = `${supabaseUrl.replace('.co', '-functions.supabase.co')}/delete-car`;
    
    console.log('Testing delete endpoint at:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ carId: 'test-nonexistent-car' }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const result = JSON.parse(text);
      console.log('Response JSON:', result);
    } catch (parseError) {
      console.log('Could not parse response as JSON');
    }
  } catch (error) {
    console.error('Error testing delete endpoint:', error);
  }
}

testDeleteEndpoint();