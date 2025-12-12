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

  // Initialize auth state on mount
  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      setLoading(true);

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          // Fetch full user data from users table
          const { data: userData } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (userData) {
            setUser(userData as User);
          } else {
            // User exists in auth but not in users table
            // This shouldn't happen, but handle gracefully
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          clearAuth();
        } else if (event === 'SIGNED_IN' && session?.user) {
          const { data: userData } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            setUser(userData as User);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, clearAuth]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      const supabase = createClient();

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error };
        }

        if (data.user) {
          // Fetch full user data
          const { data: userData } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', data.user.id)
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
        const { error } = await supabase.auth.resetPasswordForEmail(email);
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
