import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { AuthContext } from '@/contexts/AuthContext';
import {
  signIn,
  signUp,
  signInWithGoogle,
  signOut,
} from './AuthProvider.functions';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: any | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  profile: { id?: string; phone?: string; full_name?: string } | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: typeof signIn;
  signUp: typeof signUp;
  signOut: typeof signOut;
  signInWithGoogle: typeof signInWithGoogle;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading, error } = useAuthStatus();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Function to refresh profile
  const refreshProfile = useCallback(async () => {
    if (!user) {
      return;
    }

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, phone, full_name')
        .eq('id', user.id)
        .single();

      if (!error) {
        setProfile(data);
      } else {
        console.warn('Could not fetch profile:', error);
        setProfile(null);
      }
    } catch (err) {
      console.error('profile fetch err', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

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

  // Fetch profile whenever user changes or when profileJustUpdated flag is set
  useEffect(() => {
    let mounted = true;

    // Check if profile was just updated
    const profileJustUpdated = sessionStorage.getItem('profileJustUpdated');
    if (profileJustUpdated === '1') {
      // Clear the flag
      sessionStorage.removeItem('profileJustUpdated');

      // Refresh profile immediately
      refreshProfile();
      return;
    }

    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, phone, full_name')
          .eq('id', user.id)
          .single();

        if (mounted) {
          if (!error) {
            setProfile(data);
          } else {
            console.warn('Could not fetch profile:', error);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('profile fetch err', err);
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, refreshProfile]);

  // Show error toast if auth initialization fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Authentication Error',
        description:
          'There was a problem with authentication. Please refresh the page.',
        variant: 'destructive',
      });
    }
  }, [error]);

  const value = {
    user,
    session,
    isLoading,
    isAdmin,
    profile,
    profileLoading,
    refreshProfile,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
