/**
 * Toast container component - renders toasts in portal
 */

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Toast } from './toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check for mobile viewport
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`
        fixed z-[100] pointer-events-none
        ${isMobile
          ? 'top-4 left-4 right-4 flex flex-col items-center'
          : 'top-4 right-4 flex flex-col items-end'
        }
      `}
      aria-label="Notifications"
      role="region"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <div key={toast.id} className="mb-3 last:mb-0">
            <Toast toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
