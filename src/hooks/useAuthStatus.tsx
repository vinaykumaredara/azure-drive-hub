import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthStatus {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

export const useAuthStatus = (): AuthStatus => {
  const [status, setStatus] = React.useState<AuthStatus>({
    user: null,
    isAdmin: false,
    isLoading: true,
    error: null,
  });

  React.useEffect(() => {
    let mounted = true;

    const checkAuthStatus = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

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
              isAdmin: (profile as any)?.is_admin || false,
              isLoading: false,
              error: null,
            });
          }
        } else if (mounted) {
          setStatus({
            user: null,
            isAdmin: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        if (mounted) {
          setStatus({
            user: null,
            isAdmin: false,
            isLoading: false,
            error: error as Error,
          });
        }
      }
    };

    // Initial check
    checkAuthStatus();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      // Only update state if there's a meaningful change
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
              // Only update if there's a real change
              setStatus(prev => {
                const newIsAdmin = (profile as any)?.is_admin || false;
                if (
                  prev.user?.id === session.user.id &&
                  prev.isAdmin === newIsAdmin &&
                  !prev.error
                ) {
                  // No meaningful change, don't trigger re-render
                  return prev;
                }
                return {
                  user: session.user,
                  isAdmin: newIsAdmin,
                  isLoading: false,
                  error: null,
                };
              });
            }
          });
      } else if (mounted) {
        // Only update if there's a real change
        setStatus(prev => {
          if (!prev.user && !prev.error) {
            // Already in the correct state
            return prev;
          }
          return {
            user: null,
            isAdmin: false,
            isLoading: false,
            error: null,
          };
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array is correct here

  return status;
};
