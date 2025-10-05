import React, { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { AuthContext } from '@/contexts/AuthContext';
import { signIn, signUp, signInWithGoogle, signOut } from './AuthProvider.functions';
import { toast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading, error } = useAuthStatus();
  const [session, setSession] = useState<Session | null>(null);

  // Update session when user changes
  React.useEffect(() => {
    if (user) {
      // Create a minimal session object
      setSession({
        user,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      } as Session);
    } else {
      setSession(null);
    }
  }, [user]);

  // Show error toast if auth initialization fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: "There was a problem with authentication. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error]);

  const value = {
    user,
    session,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}