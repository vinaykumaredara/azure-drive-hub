import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { clearAuthCache } from './AuthProvider.utils';
import { logInfo, logError } from '@/utils/logger';

export const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    toast({
      title: "Sign In Failed",
      description: error.message,
      variant: "destructive",
    });
  }
  
  return { error };
};

export const signUp = async (email: string, password: string) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl
    }
  });
  
  if (error) {
    toast({
      title: "Sign Up Failed",
      description: error.message,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Check Your Email",
      description: "We've sent you a confirmation link.",
    });
  }
  
  return { error };
};

export const signInWithGoogle = async () => {
  logInfo('google_signin_initiated', { hostname: window.location.hostname });
  
  // CRITICAL FIX: Don't specify redirectTo - let Supabase use configured Site URL
  // Supabase flow: Google → callback URL (https://PROJECT.supabase.co/auth/v1/callback) → Site URL
  // Site URL should be configured in Supabase Dashboard → Authentication → URL Configuration
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Remove redirectTo - let Supabase handle it based on dashboard config
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (error) {
    logError('google_signin_failed', error);
    toast({
      title: "Google Sign In Failed",
      description: error.message,
      variant: "destructive",
    });
  } else {
    logInfo('google_signin_redirect_initiated');
  }
  
  return { error };
};

export const signOut = async () => {
  try {
    logInfo('sign_out_initiated');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logError('sign_out_failed', error);
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    // Clear any cached data
    clearAuthCache();
    
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    
    logInfo('sign_out_success');
  } catch (error) {
    logError('sign_out_exception', error);
    // The auth listener will handle updating the state
  }
};