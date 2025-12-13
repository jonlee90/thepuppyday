/**
 * Confirmation modal for destructive actions
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'error';
  isLoading?: boolean;
  additionalInfo?: React.ReactNode; // Additional details like cancellation policy
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading: externalIsLoading,
  additionalInfo,
}: ConfirmationModalProps) {
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const isLoading = externalIsLoading ?? internalIsLoading;
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus modal
      modalRef.current?.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Restore focus
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleConfirm = async () => {
    if (externalIsLoading !== undefined) {
      // Loading is managed externally
      await onConfirm();
    } else {
      // Manage loading internally
      setInternalIsLoading(true);
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        console.error('Confirmation action failed:', error);
      } finally {
        setInternalIsLoading(false);
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
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
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />

          {/* Modal */}
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                      ${variant === 'error' ? 'bg-red-100' : 'bg-[#EAE0D5]'}
                    `}
                  >
                    {variant === 'error' ? (
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-[#434E54]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2
                      id="modal-title"
                      className="text-xl font-bold text-[#434E54]"
                    >
                      {title}
                    </h2>
                    <p
                      id="modal-description"
                      className="mt-2 text-[#434E54]/70"
                    >
                      {description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional info (e.g., cancellation policy) */}
              {additionalInfo && (
                <div className="px-6 pb-4">
                  {additionalInfo}
                </div>
              )}

              {/* Actions */}
              <div className="p-6 pt-4 border-t border-[#434E54]/10 bg-[#EAE0D5]/30 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-lg font-medium text-[#434E54]
                           hover:bg-white transition-colors duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`
                    flex-1 px-4 py-3 rounded-lg font-semibold
                    transition-all duration-200 shadow-md hover:shadow-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    ${variant === 'error'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-[#434E54] text-white hover:bg-[#434E54]/90'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
