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
  // Use the production URL or current origin for redirect
  const redirectUrl = window.location.hostname === 'localhost' 
    ? `${window.location.origin}/`
    : 'https://rpcarrental.info/';
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (error) {
    toast({
      title: "Google Sign In Failed",
      description: error.message,
      variant: "destructive",
    });
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