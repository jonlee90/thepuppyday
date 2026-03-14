'use client';

/**
 * Auth Callback Page (client-side)
 * Handles Supabase implicit-flow tokens delivered via hash fragment.
 * Used by: invite links, magic links, OAuth redirects.
 *
 * Hash fragment tokens (#access_token=...&type=invite) are only readable
 * in the browser, so this must be a client component.
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get('next') || '/dashboard';

    // Parse hash fragment manually (not accessible via Next.js server-side)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        if (error) {
          console.error('[AuthCallback] Failed to set session:', error.message);
          router.replace('/login?error=invalid_link');
          return;
        }

        // Invite links — send to set-password page so user can create their password
        if (type === 'invite') {
          router.replace('/reset-password');
          return;
        }

        router.replace(next);
      });
    } else {
      // No tokens in hash — check if there's already a valid session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace(next);
        } else {
          router.replace('/login?error=invalid_link');
        }
      });
    }
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
