import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { clearAuthCache } from './AuthProvider.utils';

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
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
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
    console.log('Starting sign out process...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
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
    
    console.log('Sign out successful, redirecting to auth page');
  } catch (error) {
    console.error('Error during sign out:', error);
    // The auth listener will handle updating the state
  }
};