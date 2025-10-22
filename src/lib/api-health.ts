/**
 * Health check endpoint for network detection
 * This is a client-side mock that always returns OK
 * In production, replace with actual backend health endpoint
 */

export async function checkApiHealth(): Promise<boolean> {
  try {
    const supabaseUrl = 'https://rcpkhtlvfvafympulywx.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';
    
    // Try to reach Supabase as health check
    const response = await fetch(
      `${supabaseUrl}/rest/v1/`,
      {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
        },
      }
    );
    
    return response.ok;
  } catch {
    return false;
  }
}
