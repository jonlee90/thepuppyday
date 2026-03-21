'use client';

import { useEffect } from 'react';

/**
 * One-time purge of bad service worker cache entries (e.g. cached 502 pages).
 * Sends PURGE_BAD_CACHES message to the active service worker on mount.
 */
export function SwCachePurge() {
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PURGE_BAD_CACHES' });
    }
  }, []);

  return null;
}
