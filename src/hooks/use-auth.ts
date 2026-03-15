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
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null; requiresEmailConfirmation: boolean }>;
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
      try {
        // Use getUser() - authenticates against Supabase Auth server (secure)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (userError) {
          // AuthSessionMissingError is expected when no session exists (e.g. on /login page)
          if (userError.name !== 'AuthSessionMissingError') {
            console.error('[Auth] Error getting user:', userError);
          }
          setUser(null);
          return;
        }

        if (user) {
          // Fetch full user data from users table
          const { data: userData, error: dbError } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (dbError) {
            console.error('[Auth] Error fetching user data:', dbError);
            // If we can't fetch user data, still set loading to false
            setUser(null);
            return;
          }

          if (!mounted) {
            return;
          }

          if (userData) {
            setUser(userData as User);
          } else {
            // User exists in auth but not in users table
            // This shouldn't happen, but handle gracefully
            console.warn('[Auth] User exists in auth but not in users table');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('[Auth] Auth initialization error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const setupAuthListener = () => {
      // Listen for auth state changes
      const { data } = supabase.auth.onAuthStateChange(
        async (event) => {
          if (!mounted) return;

          if (event === 'SIGNED_OUT') {
            clearAuth();
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Use getUser() instead of session.user — validates JWT with server
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !mounted) return;

            const { data: userData } = await (supabase as any)
              .from('users')
              .select('*')
              .eq('id', user.id)
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
    async (email: string, password: string): Promise<{ error: Error | null; user: User | null }> => {
      const supabase = createClient();

      try {
        // Add timeout to prevent infinite hangs
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Sign in timeout after 30 seconds')), 30000);
        });

        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });

        const { data, error } = await Promise.race([
          signInPromise,
          timeoutPromise,
        ]) as Awaited<typeof signInPromise>;

        if (error) {
          console.error('[Auth] Sign in error:', error);
          return { error, user: null };
        }

        if (data.user) {
          // Fetch full user data
          const { data: userData, error: userError } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (userData) {
            setUser(userData as User);
            return { error: null, user: userData as User };
          } else if (userError) {
            console.error('[Auth] Failed to fetch user data:', userError);
            // Sign out if we can't get user data
            await supabase.auth.signOut();
            return {
              error: new Error(`Failed to fetch user profile: ${userError.message || 'Unknown error'}`),
              user: null
            };
          }
        }

        return { error: null, user: null };
      } catch (error) {
        console.error('[Auth] Unexpected error:', error);
        return { error: error as Error, user: null };
      }
    },
    [setUser]
  );

  const signUp = useCallback(
    async (data: SignUpData): Promise<{ error: Error | null; requiresEmailConfirmation: boolean }> => {
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
          return { error, requiresEmailConfirmation: false };
        }

        // If no session, email confirmation is required
        const requiresEmailConfirmation = !authData.session;

        if (authData.user && !requiresEmailConfirmation) {
          // Only fetch and set user if we have an active session
          const { data: userData } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (userData) {
            setUser(userData as User);
          }
        }

        return { error: null, requiresEmailConfirmation };
      } catch (error) {
        return { error: error as Error, requiresEmailConfirmation: false };
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
          redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
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
