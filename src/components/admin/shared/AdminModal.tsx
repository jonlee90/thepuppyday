'use client';

import { useEffect, useCallback, useRef, type ReactNode, type ComponentType } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createFocusTrap } from '@/lib/accessibility/focus';

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  disabled?: boolean;
  ariaLabelledBy?: string;
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = 'max-w-lg',
  disabled = false,
  ariaLabelledBy,
}: AdminModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = ariaLabelledBy || 'admin-modal-title';

  // Focus trap + body scroll lock
  useEffect(() => {
    if (isOpen && modalRef.current) {
      document.body.style.overflow = 'hidden';
      const focusTrap = createFocusTrap(modalRef.current);
      focusTrap.activate();

      return () => {
        focusTrap.deactivate();
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !disabled) onClose();
  }, [disabled, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disabled) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />

          {/* Modal container */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`bg-white rounded-2xl shadow-2xl ${maxWidth} w-full max-sm:max-w-[calc(100vw-2rem)] overflow-hidden max-h-[90vh] flex flex-col`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-4 sm:p-6 pb-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className="w-9 h-9 rounded-xl bg-[#EAE0D5] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#434E54]" />
                    </div>
                  )}
                  <div>
                    <h3 id={titleId} className="text-lg font-bold text-[#434E54] leading-tight">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-xs text-[#434E54]/50 mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={disabled}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#434E54]/60 hover:bg-[#EAE0D5] transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-4 sm:p-6 pt-4 flex justify-end shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
