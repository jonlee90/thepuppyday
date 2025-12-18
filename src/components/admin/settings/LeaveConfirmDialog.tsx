/**
 * LeaveConfirmDialog Component
 * Task 0166: Prevent navigation with unsaved changes
 *
 * Features:
 * - Browser navigation warning (beforeunload)
 * - Next.js router navigation blocking
 * - Clean & Elegant Professional design
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Save, LogOut } from 'lucide-react';

interface LeaveConfirmDialogProps {
  /**
   * Whether there are unsaved changes
   */
  isDirty: boolean;

  /**
   * Whether save is in progress
   */
  isSaving?: boolean;

  /**
   * Save handler (called when user clicks "Save & Leave")
   */
  onSave?: () => Promise<boolean>;

  /**
   * Optional custom message
   */
  message?: string;
}

export function LeaveConfirmDialog({
  isDirty,
  isSaving = false,
  onSave,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: LeaveConfirmDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * Browser navigation warning (refresh, close tab, etc.)
   */
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers ignore custom messages, but we still need to set returnValue
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);

  /**
   * Next.js router navigation interception
   * Note: Next.js App Router doesn't have native navigation blocking,
   * so we use a custom approach with link click interception
   */
  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (e: MouseEvent) => {
      // Only intercept navigation links
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Check if it's an internal link to a different page
      const isInternal = href.startsWith('/') || href.startsWith(window.location.origin);
      const isSamePage = href === pathname || href === `${window.location.origin}${pathname}`;

      if (isInternal && !isSamePage) {
        e.preventDefault();
        setPendingNavigation(href);
        setShowDialog(true);
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isDirty, pathname]);

  /**
   * Handle "Leave without saving"
   */
  const handleLeave = useCallback(() => {
    if (!pendingNavigation) return;

    setIsNavigating(true);
    setShowDialog(false);

    // Navigate to pending URL
    if (pendingNavigation.startsWith(window.location.origin)) {
      const path = pendingNavigation.replace(window.location.origin, '');
      router.push(path);
    } else {
      router.push(pendingNavigation);
    }
  }, [pendingNavigation, router]);

  /**
   * Handle "Save & Leave"
   */
  const handleSaveAndLeave = useCallback(async () => {
    if (!onSave || !pendingNavigation) return;

    setIsNavigating(true);

    // Try to save
    const success = await onSave();

    if (success) {
      // Save successful, proceed with navigation
      setShowDialog(false);

      if (pendingNavigation.startsWith(window.location.origin)) {
        const path = pendingNavigation.replace(window.location.origin, '');
        router.push(path);
      } else {
        router.push(pendingNavigation);
      }
    } else {
      // Save failed, keep dialog open
      setIsNavigating(false);
    }
  }, [onSave, pendingNavigation, router]);

  /**
   * Handle "Cancel"
   */
  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  return (
    <AnimatePresence>
      {showDialog && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon & Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#FFB347]/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-[#FFB347]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#434E54] mb-1">
                    Unsaved Changes
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                {/* Cancel */}
                <button
                  onClick={handleCancel}
                  disabled={isNavigating}
                  className="btn bg-transparent text-[#434E54] border-[#434E54]/20
                           hover:bg-[#EAE0D5] hover:border-[#434E54]/30 transition-colors duration-200
                           flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                {/* Leave without saving */}
                <button
                  onClick={handleLeave}
                  disabled={isNavigating}
                  className="btn bg-transparent text-red-600 border-red-300
                           hover:bg-red-50 hover:border-red-400 transition-colors duration-200
                           flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4" />
                  Leave
                </button>

                {/* Save & Leave */}
                {onSave && (
                  <button
                    onClick={handleSaveAndLeave}
                    disabled={isNavigating || isSaving}
                    className="btn bg-[#434E54] text-white border-none
                             hover:bg-[#363F44] transition-colors duration-200
                             flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isNavigating ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save & Leave
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
