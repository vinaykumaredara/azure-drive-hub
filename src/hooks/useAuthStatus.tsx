import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthStatus {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

export const useAuthStatus = (): AuthStatus => {
  const [status, setStatus] = useState<AuthStatus>({
    user: null,
    isAdmin: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;
    
    const checkAuthStatus = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session?.user && mounted) {
          // Fetch user profile to check admin status
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Profile fetch error:', profileError);
            // Don't throw here, we can still proceed with basic auth
          }
          
          if (mounted) {
            setStatus({
              user: session.user,
              isAdmin: profile?.is_admin || false,
              isLoading: false,
              error: null
            });
          }
        } else if (mounted) {
          setStatus({
            user: null,
            isAdmin: false,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        if (mounted) {
          setStatus({
            user: null,
            isAdmin: false,
            isLoading: false,
            error: error as Error
          });
        }
      }
    };

    // Initial check
    checkAuthStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        // Fetch user profile to check admin status
        supabase
          .from('users')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error('Profile fetch error:', error);
            }
            
            if (mounted) {
              setStatus({
                user: session.user,
                isAdmin: profile?.is_admin || false,
                isLoading: false,
                error: null
              });
            }
          });
      } else if (mounted) {
        setStatus({
          user: null,
          isAdmin: false,
          isLoading: false,
          error: null
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return status;
};