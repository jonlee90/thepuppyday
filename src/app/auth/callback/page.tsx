'use client';

/**
 * Auth Callback Page (client-side)
 * Handles Supabase implicit-flow tokens delivered via hash fragment.
 * Used by: invite links, magic links, OAuth redirects.
 *
 * The Supabase client auto-processes hash tokens and clears the hash,
 * so we capture the type immediately before it's gone, then listen for
 * the auth state change to confirm session is established.
 */

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Capture hash params immediately — Supabase clears the hash on init
const initialHashParams = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.hash.substring(1))
  : new URLSearchParams();

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const supabase = createClient();
    const next = searchParams.get('next') || '/dashboard';
    const type = initialHashParams.get('type');

    // Supabase auto-sets session from hash — listen for it
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled.current) return;
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        handled.current = true;
        subscription.unsubscribe();

        if (type === 'invite') {
          router.replace('/reset-password');
        } else {
          router.replace(next);
        }
      }
    });

    // Fallback: if already signed in (session exists before event fires)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (handled.current || !session) return;
      handled.current = true;
      subscription.unsubscribe();

      if (type === 'invite') {
        router.replace('/reset-password');
      } else {
        router.replace(next);
      }
    });

    // Timeout fallback — if nothing happens after 5s, redirect to login
    const timeout = setTimeout(() => {
      if (handled.current) return;
      handled.current = true;
      subscription.unsubscribe();
      router.replace('/login?error=invalid_link');
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
