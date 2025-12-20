'use client';

import { useEffect } from 'react';

/**
 * Filter known development-only errors from console
 * These errors don't affect functionality and only appear in dev mode
 */
export function ErrorFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const originalError = console.error;
    console.error = (...args: any[]) => {
      // Filter Next.js performance measurement errors
      const errorMessage = args[0]?.toString() || '';
      if (
        errorMessage.includes('Failed to execute \'measure\' on \'Performance\'') ||
        errorMessage.includes('cannot have a negative time stamp')
      ) {
        // Suppress these errors in development
        return;
      }

      // Call original console.error for all other errors
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
