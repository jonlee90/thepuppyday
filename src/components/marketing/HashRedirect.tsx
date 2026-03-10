'use client';

import { useEffect } from 'react';

const HASH_MAP: Record<string, string> = {
  '#services': '/services',
  '#gallery': '/gallery',
  '#testimonials': '/reviews',
  '#about': '/about',
  '#contact': '/contact',
};

/**
 * Redirects legacy hash-based URLs to their proper page routes.
 * e.g. thepuppyday.com/#services → thepuppyday.com/services
 */
export function HashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && HASH_MAP[hash]) {
      window.location.replace(HASH_MAP[hash]);
    }
  }, []);

  return null;
}
