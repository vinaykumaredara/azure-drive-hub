/**
 * Health check endpoint for network detection
 * This is a client-side mock that always returns OK
 * In production, replace with actual backend health endpoint
 */

export async function checkApiHealth(): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables for health check');
      return false;
    }
    
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
