/**
 * UnsavedChangesIndicator Component
 * Task 0166: Display unsaved changes with save/discard actions
 *
 * Clean & Elegant Professional Design:
 * - Soft shadows and warm colors
 * - Smooth animations
 * - Clear visual feedback
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Save, X, RotateCcw } from 'lucide-react';

interface UnsavedChangesIndicatorProps {
  /**
   * Whether there are unsaved changes
   */
  isDirty: boolean;

  /**
   * Whether save is in progress
   */
  isSaving?: boolean;

  /**
   * Save error message
   */
  error?: string | null;

  /**
   * Last saved timestamp
   */
  lastSaved?: Date | null;

  /**
   * Save handler
   */
  onSave: () => void;

  /**
   * Discard handler
   */
  onDiscard: () => void;

  /**
   * Retry handler (for failed saves)
   */
  onRetry?: () => void;

  /**
   * Custom save button text
   */
  saveText?: string;

  /**
   * Custom discard button text
   */
  discardText?: string;
}

export function UnsavedChangesIndicator({
  isDirty,
  isSaving = false,
  error = null,
  lastSaved = null,
  onSave,
  onDiscard,
  onRetry,
  saveText = 'Save Changes',
  discardText = 'Discard',
}: UnsavedChangesIndicatorProps) {
  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Saved just now';
    if (diffMins === 1) return 'Saved 1 minute ago';
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Saved 1 hour ago';
    if (diffHours < 24) return `Saved ${diffHours} hours ago`;

    return `Saved on ${date.toLocaleDateString()}`;
  };

  return (
    <AnimatePresence mode="wait">
      {/* Unsaved Changes Indicator */}
      {isDirty && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-[#434E54]/20 rounded-lg shadow-md p-4"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Warning message */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFB347]/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-[#FFB347]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#434E54]">
                  Unsaved Changes
                </p>
                <p className="text-xs text-[#6B7280]">
                  You have unsaved changes that will be lost if you navigate away
                </p>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onDiscard}
                disabled={isSaving}
                className="btn btn-sm bg-transparent text-[#6B7280] border-[#434E54]/20
                         hover:bg-[#EAE0D5] hover:border-[#434E54]/30 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                {discardText}
              </button>

              <button
                onClick={onSave}
                disabled={isSaving}
                className="btn btn-sm bg-[#434E54] text-white border-none
                         hover:bg-[#363F44] transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {saveText}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-red-300 rounded-lg shadow-md p-4"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Error message */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Save Failed
                </p>
                <p className="text-xs text-red-600">
                  {error}
                </p>
              </div>
            </div>

            {/* Right: Retry button */}
            {onRetry && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={onDiscard}
                  className="btn btn-sm bg-transparent text-[#6B7280] border-[#434E54]/20
                           hover:bg-[#EAE0D5] hover:border-[#434E54]/30 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  {discardText}
                </button>

                <button
                  onClick={onRetry}
                  disabled={isSaving}
                  className="btn btn-sm bg-red-600 text-white border-none
                           hover:bg-red-700 transition-colors duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Success State (Last Saved) */}
      {!isDirty && !error && lastSaved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#FFFBF7] border border-[#434E54]/10 rounded-lg shadow-sm p-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-xs text-[#6B7280]">
              {formatLastSaved(lastSaved)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
