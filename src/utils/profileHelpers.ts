// Profile creation and retry helpers for handling async trigger execution
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError } from '@/utils/logger';

export interface UserProfile {
  id: string;
  phone: string | null;
  full_name: string | null;
}

/**
 * Waits for a user profile to be created by the database trigger
 * Uses exponential backoff to retry fetching the profile
 * 
 * This is necessary because:
 * 1. The trigger executes asynchronously after user creation
 * 2. There may be network latency
 * 3. RLS policies need time to propagate
 * 
 * @param userId - The auth user ID
 * @param maxAttempts - Maximum number of retry attempts (default: 10)
 * @param initialDelay - Initial delay in ms (default: 200)
 * @returns Profile data or null if not found after all retries
 */
export async function waitForProfileCreation(
  userId: string,
  maxAttempts: number = 10,
  initialDelay: number = 200
): Promise<UserProfile | null> {
  logInfo('profile_fetch_start', { userId, maxAttempts });
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, phone, full_name')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

      if (error) {
        // Log the error but continue retrying
        logError('profile_fetch_error', { attempt, error: error.message, code: error.code });
        
        // If it's a "not found" error, continue retrying
        if (error.code === 'PGRST116') {
          logInfo('profile_not_found_yet', { attempt, userId });
        } else {
          // For other errors, log and continue
          logError('profile_fetch_unexpected_error', { attempt, error });
        }
      } else if (data) {
        // Profile found!
        logInfo('profile_found', { attempt, userId, hasPhone: !!data.phone });
        return data;
      }

      // Profile not found yet, wait before retrying
      if (attempt < maxAttempts) {
        // Exponential backoff: 200ms, 400ms, 800ms, 1600ms, ...
        const delay = initialDelay * Math.pow(2, attempt - 1);
        logInfo('profile_retry_waiting', { attempt, delay, nextAttempt: attempt + 1 });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (err) {
      logError('profile_fetch_exception', { attempt, error: err });
      
      // Continue retrying even on exceptions
      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  logError('profile_creation_timeout', { userId, attempts: maxAttempts });
  return null;
}

/**
 * Checks if a profile exists and is complete
 * @param profile - The profile to check
 * @returns true if profile exists and has required fields
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(profile.id && profile.full_name);
}

/**
 * Checks if a profile needs phone collection
 * @param profile - The profile to check
 * @returns true if profile exists but lacks phone number
 */
export function needsPhoneCollection(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !profile.phone;
}

/**
 * Force refresh profile from database
 * @param userId - The user ID
 * @returns Fresh profile data or null
 */
export async function refreshProfile(userId: string): Promise<UserProfile | null> {
  logInfo('profile_refresh_start', { userId });
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, phone, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logError('profile_refresh_error', { userId, error });
      return null;
    }

    logInfo('profile_refresh_success', { userId, hasPhone: !!data?.phone });
    return data;
  } catch (err) {
    logError('profile_refresh_exception', { userId, error: err });
    return null;
  }
}
