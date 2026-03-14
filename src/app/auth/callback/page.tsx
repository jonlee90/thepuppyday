'use client';

/**
 * Auth Callback Page (client-side)
 * Handles Supabase implicit-flow tokens delivered via hash fragment.
 * Used by: invite links, magic links, OAuth redirects.
 */

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);
  // Capture hash on first render (before Supabase clears it)
  const hashRef = useRef(typeof window !== 'undefined' ? window.location.hash.substring(1) : '');

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const supabase = createClient();
    const next = searchParams.get('next') || '/dashboard';
    const hashParams = new URLSearchParams(hashRef.current);
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    async function handleCallback() {
      if (accessToken && refreshToken) {
        // Clear any stale session first
        await supabase.auth.signOut({ scope: 'local' });

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('[AuthCallback] Failed to set session:', error.message);
          router.replace('/login?error=invalid_link');
          return;
        }

        if (type === 'invite') {
          router.replace('/reset-password');
        } else {
          router.replace(next);
        }
        return;
      }

      // No hash tokens — check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(next);
      } else {
        router.replace('/login?error=invalid_link');
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8EEE5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
        <p style={{ color: '#434E54', fontFamily: 'sans-serif', fontSize: 16 }}>Setting up your account…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
