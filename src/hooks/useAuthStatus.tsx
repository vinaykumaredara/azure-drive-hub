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
          // Check admin status using user_roles table
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .maybeSingle();
            
          if (roleError && roleError.code !== 'PGRST116') {
            // Don't throw here, we can still proceed with basic auth
          }
          
          if (mounted) {
            setStatus({
              user: session.user,
              isAdmin: !!roleData,
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
        // Keep loading true until admin status is determined
        setStatus(prev => ({
          ...prev,
          user: session.user,
          error: null
        }));
        
        // Check admin status immediately and WAIT for it
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle()
          .then(({ data: roleData, error: roleError }) => {
            if (mounted) {
              if (roleError && process.env.NODE_ENV === 'development') {
                console.error('Admin check failed:', roleError);
              }
              const newIsAdmin = !!roleData;
              
              // Set both admin status AND loading false together
              setStatus(prev => ({
                ...prev,
                isAdmin: newIsAdmin,
                isLoading: false
              }));
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
  }, []); // Empty dependency array is correct here

  return status;
};