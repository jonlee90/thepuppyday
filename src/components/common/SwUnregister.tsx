'use client';

import { useEffect } from 'react';

/**
 * One-time cleanup: unregisters any existing service worker and clears its caches.
 * Safe to remove after ~2 weeks once all users have visited.
 */
export function SwUnregister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  }, []);

  return null;
}
