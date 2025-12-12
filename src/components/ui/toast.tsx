/**
 * Toast notification component with animations
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Toast as ToastType } from '@/hooks/use-toast';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const icons = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const styles = {
  success: {
    container: 'bg-white border-l-4 border-[#434E54]',
    icon: 'text-[#434E54] bg-[#434E54]/10',
  },
  error: {
    container: 'bg-white border-l-4 border-[#434E54]',
    icon: 'text-[#434E54] bg-[#434E54]/10',
  },
  warning: {
    container: 'bg-white border-l-4 border-[#434E54]/70',
    icon: 'text-[#434E54] bg-[#434E54]/10',
  },
  info: {
    container: 'bg-white border-l-4 border-[#434E54]/50',
    icon: 'text-[#434E54] bg-[#434E54]/10',
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300); // Wait for exit animation
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const style = styles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        x: isExiting ? 50 : 0,
        scale: isExiting ? 0.95 : 1
      }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        ${style.container}
        rounded-lg shadow-lg overflow-hidden
        min-w-[320px] max-w-[420px]
        pointer-events-auto
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`${style.icon} p-2 rounded-full flex-shrink-0`}>
            {icons[toast.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-[#434E54]">{toast.title}</p>
            {toast.description && (
              <p className="mt-1 text-sm text-[#434E54]/70">{toast.description}</p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium text-[#434E54] hover:text-[#434E54]/80
                         underline underline-offset-2 transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-[#EAE0D5]
                     transition-colors text-[#434E54]/60 hover:text-[#434E54]"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className="h-1 bg-[#434E54]/20 origin-left"
        />
      )}
    </motion.div>
  );
}
