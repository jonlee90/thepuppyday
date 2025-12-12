'use client';

/**
 * Authentication hook for managing user sessions
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, setUser, setLoading, clearAuth } = useAuthStore();

  // Initialize auth state on mount - run only once
  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    const supabase = createClient();

    const initAuth = async () => {
      console.log('[Auth] Initializing auth state...');

      try {
        console.log('[Auth] Calling supabase.auth.getSession()...');

        // Use getSession for client-side initialization - reads from local storage
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) {
          console.log('[Auth] Component unmounted, skipping state update');
          return;
        }

        if (sessionError) {
          console.error('[Auth] Error getting session:', sessionError);
          setUser(null);
          return;
        }

        console.log('[Auth] getSession() completed, user:', session?.user?.id || 'none');

        if (session?.user) {
          console.log('[Auth] Fetching user data from users table...');
          // Fetch full user data from users table
          const { data: userData, error: userError } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error('[Auth] Error fetching user data:', userError);
            // If we can't fetch user data, still set loading to false
            setUser(null);
            return;
          }

          console.log('[Auth] User data fetch completed, success:', !!userData);

          if (!mounted) {
            console.log('[Auth] Component unmounted after user fetch');
            return;
          }

          if (userData) {
            console.log('[Auth] Setting user in store:', userData.email);
            setUser(userData as User);
          } else {
            // User exists in auth but not in users table
            // This shouldn't happen, but handle gracefully
            console.warn('[Auth] User exists in auth but not in users table');
            setUser(null);
          }
        } else {
          console.log('[Auth] No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('[Auth] Auth initialization error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('[Auth] Auth initialization complete, setting loading to false');
          setLoading(false);
        }
      }
    };

    const setupAuthListener = () => {
      // Listen for auth state changes
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          console.log('[Auth] Auth state change event:', event);

          if (event === 'SIGNED_OUT') {
            clearAuth();
          } else if (event === 'SIGNED_IN' && session?.user) {
            const { data: userData } = await (supabase as any)
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (mounted && userData) {
              setUser(userData as User);
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Update user data on token refresh
            const { data: userData } = await (supabase as any)
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (mounted && userData) {
              setUser(userData as User);
            }
          }
        }
      );

      subscription = data.subscription;
    };

    initAuth();
    setupAuthListener();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      const supabase = createClient();

      try {
        console.log('[Auth] Attempting sign in for:', email);

        // Add timeout to prevent infinite hangs
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Sign in timeout after 30 seconds')), 30000);
        });

        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('[Auth] signInWithPassword called, waiting for response...');

        const { data, error } = await Promise.race([
          signInPromise,
          timeoutPromise,
        ]) as Awaited<typeof signInPromise>;

        console.log('[Auth] signInWithPassword resolved');

        if (error) {
          console.error('[Auth] Sign in error:', error);
          return { error };
        }

        console.log('[Auth] Sign in successful, user:', data.user?.id);

        if (data.user) {
          // Fetch full user data
          console.log('[Auth] Fetching user data from public.users...');
          const { data: userData, error: userError } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          console.log('[Auth] User data result:', userData, 'Error:', userError);

          if (userData) {
            setUser(userData as User);
            console.log('[Auth] User set in store');
          } else if (userError) {
            console.error('[Auth] Failed to fetch user data:', userError);
            // Sign out if we can't get user data
            await supabase.auth.signOut();
            return { error: new Error('Failed to fetch user profile') };
          }
        }

        return { error: null };
      } catch (error) {
        console.error('[Auth] Unexpected error:', error);
        return { error: error as Error };
      }
    },
    [setUser]
  );

  const signUp = useCallback(
    async (data: SignUpData): Promise<{ error: Error | null }> => {
      const supabase = createClient();

      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              phone: data.phone || undefined,
            },
          },
        });

        if (error) {
          return { error };
        }

        if (authData.user) {
          // Fetch the created user data
          const { data: userData } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (userData) {
            setUser(userData as User);
          }
        }

        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    [setUser]
  );

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  const resetPassword = useCallback(
    async (email: string): Promise<{ error: Error | null }> => {
      const supabase = createClient();

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error || null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    []
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
