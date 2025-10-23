import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { AuthContext } from '@/contexts/AuthContext';
import { signIn, signUp, signInWithGoogle, signOut } from './AuthProvider.functions';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: any | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  profile: { id: string; phone: string | null; full_name: string | null } | null;
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
  const refreshProfile = async () => {
    if (!user) return;
    
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
  };

  // Update session when user changes
  useEffect(() => {
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

  // Fetch profile whenever user changes - OPTIMIZED
  useEffect(() => {
    let mounted = true;
    
    // Check if profile was just updated
    const profileJustUpdated = sessionStorage.getItem('profileJustUpdated');
    if (profileJustUpdated === '1') {
      sessionStorage.removeItem('profileJustUpdated');
      refreshProfile();
      return;
    }
    
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    // Set loading true but don't block the UI
    setProfileLoading(true);
    
    // Fast, non-blocking profile fetch with timeout
    const fetchWithTimeout = Promise.race([
      supabase
        .from('users')
        .select('id, phone, full_name')
        .eq('id', user.id)
        .maybeSingle(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
      )
    ]);
    
    fetchWithTimeout
      .then((result: any) => {
        if (mounted) {
          const { data, error } = result;
          if (!error && data) {
            setProfile(data);
          } else if (error) {
            console.warn('Could not fetch profile:', error);
            setProfile(null);
          }
          setProfileLoading(false);
        }
      })
      .catch((error) => {
        if (mounted) {
          console.warn('Profile fetch failed:', error);
          setProfile(null);
          setProfileLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [user]);

  // Show error toast if auth initialization fails
  useEffect(() => {
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
    profile,
    profileLoading,
    refreshProfile,
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