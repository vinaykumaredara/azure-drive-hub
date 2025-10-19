/**
 * Health check endpoint for network detection
 * This is a client-side mock that always returns OK
 * In production, replace with actual backend health endpoint
 */

export async function checkApiHealth(): Promise<boolean> {
  try {
    // Try to reach Supabase as health check
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co'}/rest/v1/`,
      {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
      }
    );
    
    return response.ok;
  } catch {
    return false;
  }
}
