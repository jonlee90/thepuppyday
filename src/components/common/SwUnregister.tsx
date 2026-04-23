'use client';

import { useEffect } from 'react';

/**
 * Defense-in-depth cleanup for legacy Serwist service workers. Unregisters any
 * existing SW, purges caches, and hard-reloads so the new session runs without
 * a zombie SW controlling it. sessionStorage flag prevents reload loops.
 */
export function SwUnregister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (sessionStorage.getItem('sw-cleanup-done') === '1') return;

    (async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length === 0) {
        sessionStorage.setItem('sw-cleanup-done', '1');
        return;
      }
      await Promise.all(regs.map((r) => r.unregister()));
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}
      sessionStorage.setItem('sw-cleanup-done', '1');
      location.reload();
    })();
  }, []);

  return null;
}
