import { supabase } from '@/integrations/supabase/client';
import { logError, logDebug } from './logger';

/**
 * Utility function to save/update user phone number in database
 * Consolidates phone update logic to avoid code duplication
 */
export const savePhoneNumber = async (phoneNumber: string, userId?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get user ID if not provided
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      targetUserId = user.id;
    }

    // Clean phone number (remove non-digits)
    const cleanedPhone = phoneNumber.replace(/\D/g, '');

    // Cast to any to bypass TypeScript issues with Supabase generated types
    const { error } = await (supabase
      .from('users') as any)
      .update({ phone: cleanedPhone } as any)
      .eq('id', targetUserId)
      .select();
      
    if (error) {
      logError('phone_update_failed', error);
      return { success: false, error: error.message };
    }

    logDebug('phone_update_success');
    return { success: true };
  } catch (error: any) {
    logError('phone_update_exception', error);
    return { success: false, error: error?.message || 'Failed to update phone number' };
  }
};

/**
 * Validates Indian phone number format
 */
export const validateIndianPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanedPhone = phone.replace(/\D/g, '');
  return phoneRegex.test(cleanedPhone);
};

/**
 * Cleans phone number by removing all non-digit characters
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};
