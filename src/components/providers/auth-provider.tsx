'use client';

/**
 * Auth provider component that initializes authentication state
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import type { User } from '@/types/database';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  const pathname = usePathname();

  // Show loading spinner only on protected CUSTOMER routes during initial auth check
  // Note: /admin routes are handled server-side via layout.tsx, so don't block here
  const isProtectedRoute =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/appointments') ||
    pathname?.startsWith('/pets') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/loyalty') ||
    pathname?.startsWith('/membership') ||
    pathname?.startsWith('/report-cards');


    console.log(auth.isLoading, 'auth.isLoading', isProtectedRoute, 'isProtectedRoute');
  // Show loading UI only on protected routes
  if (auth.isLoading && isProtectedRoute) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EAE0D5] border-t-[#434E54] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B7280] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
