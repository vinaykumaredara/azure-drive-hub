/**
 * Idempotency middleware for Supabase Edge Functions
 * Prevents duplicate operations by caching responses for idempotency keys
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface IdempotencyRecord {
  key: string;
  user_id?: string;
  request_body: any;
  response_body: any;
  status_code: number;
  created_at: string;
}

/**
 * Check if request has already been processed
 */
export async function checkIdempotency(
  supabaseClient: any,
  idempotencyKey: string,
  userId?: string
): Promise<{ exists: boolean; response?: { body: any; status: number } }> {
  try {
    const { data, error } = await supabaseClient
      .from('idempotency_keys')
      .select('*')
      .eq('key', idempotencyKey)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Verify user matches if provided
      if (userId && data.user_id !== userId) {
        return { exists: false };
      }

      console.log('✓ Idempotency key found, returning cached response:', idempotencyKey);
      
      return {
        exists: true,
        response: {
          body: data.response_body,
          status: data.status_code,
        },
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking idempotency:', error);
    return { exists: false };
  }
}

/**
 * Store idempotency record
 */
export async function storeIdempotency(
  supabaseClient: any,
  idempotencyKey: string,
  requestBody: any,
  responseBody: any,
  statusCode: number,
  userId?: string
): Promise<void> {
  try {
    const record: Partial<IdempotencyRecord> = {
      key: idempotencyKey,
      user_id: userId,
      request_body: requestBody,
      response_body: responseBody,
      status_code: statusCode,
    };

    const { error } = await supabaseClient
      .from('idempotency_keys')
      .insert(record);

    if (error) throw error;

    console.log('✓ Stored idempotency key:', idempotencyKey);
  } catch (error) {
    console.error('Error storing idempotency:', error);
  }
}

/**
 * Middleware wrapper for edge functions with idempotency support
 */
export function withIdempotency(
  handler: (req: Request, context: any) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const idempotencyKey = req.headers.get('Idempotency-Key');

    // If no idempotency key, proceed normally
    if (!idempotencyKey) {
      return handler(req, {});
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;

    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        userId = user?.id;
      } catch (error) {
        console.error('Error getting user:', error);
      }
    }

    // Check if request already processed
    const { exists, response } = await checkIdempotency(
      supabaseClient,
      idempotencyKey,
      userId
    );

    if (exists && response) {
      console.log('↩ Returning cached response for idempotency key:', idempotencyKey);
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotent-Replay': 'true',
        },
      });
    }

    // Process request
    let requestBody: any = null;
    try {
      const contentType = req.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        requestBody = await req.json();
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
    }

    // Call original handler
    const response = await handler(req, { userId });

    // Store idempotency record for successful responses
    if (response.ok) {
      try {
        const responseBody = await response.clone().json();
        await storeIdempotency(
          supabaseClient,
          idempotencyKey,
          requestBody,
          responseBody,
          response.status,
          userId
        );
      } catch (error) {
        console.error('Error storing idempotency:', error);
      }
    }

    return response;
  };
}

/**
 * Standard error response format
 */
export function errorResponse(
  code: string,
  message: string,
  retryable: boolean = false,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        retryable,
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
