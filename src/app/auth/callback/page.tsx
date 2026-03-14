'use client';

/**
 * Auth Callback Page (client-side)
 * Handles Supabase implicit-flow tokens delivered via hash fragment.
 * Used by: invite links, magic links, OAuth redirects.
 *
 * Flow:
 * 1. Capture hash params before Supabase clears them
 * 2. Sign out any stale session (prevents old JWT conflicts)
 * 3. Explicitly set the new session from hash tokens
 * 4. Redirect based on type (invite → reset-password, else → next)
 */

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Capture hash params immediately — Supabase may clear the hash on init
const initialHash = typeof window !== 'undefined' ? window.location.hash.substring(1) : '';
const initialHashParams = new URLSearchParams(initialHash);

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const supabase = createClient();
    const next = searchParams.get('next') || '/dashboard';
    const type = initialHashParams.get('type');
    const accessToken = initialHashParams.get('access_token');
    const refreshToken = initialHashParams.get('refresh_token');

    const redirect = (destination: string) => {
      router.replace(destination);
    };

    async function handleCallback() {
      // If we have tokens in the hash, explicitly set the session
      // Sign out first to clear any stale session from localStorage
      if (accessToken && refreshToken) {
        await supabase.auth.signOut({ scope: 'local' });

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('[AuthCallback] Failed to set session:', error.message);
          redirect('/login?error=invalid_link');
          return;
        }

        if (type === 'invite') {
          redirect('/reset-password');
        } else {
          redirect(next);
        }
        return;
      }

      // No hash tokens — check for existing session (e.g. PKCE flow)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirect(next);
      } else {
        redirect('/login?error=invalid_link');
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
