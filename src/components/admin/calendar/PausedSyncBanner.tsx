'use client';

import { useState } from 'react';
import { AlertOctagon, Play, ExternalLink, Loader2 } from 'lucide-react';

interface PausedSyncBannerProps {
  pausedAt: string;
  pauseReason: string;
  errorCount: number;
  onResume: () => Promise<void>;
  onViewErrors: () => void;
}

export function PausedSyncBanner({
  pausedAt,
  pauseReason,
  errorCount,
  onResume,
  onViewErrors
}: PausedSyncBannerProps) {
  const [isResuming, setIsResuming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  // Format pause timestamp
  const formatPauseTime = () => {
    const date = new Date(pausedAt);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Parse error summary from pauseReason
  const getErrorSummary = () => {
    // If pauseReason includes specific error counts, display them
    // Otherwise, show generic error count
    if (pauseReason.toLowerCase().includes('rate limit')) {
      return `${errorCount} rate limit failures`;
    } else if (pauseReason.toLowerCase().includes('auth')) {
      return `${errorCount} authentication errors`;
    } else {
      return `${errorCount} sync errors`;
    }
  };

  // Handle resume with confirmation
  const handleResumeClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmResume = async () => {
    setShowConfirmModal(false);
    setIsResuming(true);

    try {
      await onResume();

      // Show success flash
      setShowSuccessFlash(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    } catch (error) {
      console.error('Failed to resume sync:', error);
      // Show shake animation on error
      const banner = document.getElementById('paused-sync-banner');
      if (banner) {
        banner.classList.add('animate-shake');
        setTimeout(() => {
          banner.classList.remove('animate-shake');
        }, 300);
      }
    } finally {
      setIsResuming(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div
        id="paused-sync-banner"
        role="alert"
        aria-live="assertive"
        aria-label="Critical: Calendar auto-sync paused due to errors"
        className={`
          max-w-6xl w-full rounded-xl shadow-lg p-6 mb-6
          transition-all duration-600
          ${showSuccessFlash
            ? 'bg-gradient-to-r from-green-500 to-green-600'
            : 'bg-gradient-to-r from-red-500 to-red-600'
          }
          text-white
          animate-slideDownShake
        `}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-grow">
            <h2 className="text-xl font-bold text-white mb-2">
              🚨 Calendar Auto-Sync Paused
            </h2>
            <p className="text-base text-white/90 leading-relaxed">
              Automatic syncing was paused at {formatPauseTime()} due to consecutive failures. New
              appointments will not sync to Google Calendar until resolved.
            </p>
          </div>
        </div>

        {/* Error summary */}
        <p className="text-sm font-medium text-white mb-4 pl-9">
          Recent errors: {getErrorSummary()}
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pl-9">
          <button
            onClick={onViewErrors}
            className="btn btn-md text-white border border-white/30 hover:bg-white/10 bg-transparent"
            aria-label="View sync error details"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Error Details
          </button>

          <button
            onClick={handleResumeClick}
            disabled={isResuming}
            className="btn btn-md bg-white text-red-600 hover:bg-red-50 border-none"
            aria-label="Resume automatic calendar synchronization"
          >
            {isResuming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume Auto-Sync
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white max-w-md">
            <h3 className="text-lg font-semibold text-[#434E54] mb-3">Resume Automatic Sync?</h3>
            <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
              This will re-enable automatic calendar syncing. Ensure errors have been resolved to
              prevent repeated failures.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-lg mb-6">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Warning:</span> If errors persist, sync will pause
                again after 5 consecutive failures.
              </p>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-ghost"
                disabled={isResuming}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResume}
                className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] border-none"
                disabled={isResuming}
              >
                {isResuming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resuming...
                  </>
                ) : (
                  'Resume Sync'
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => !isResuming && setShowConfirmModal(false)}
          />
        </dialog>
      )}
    </>
  );
}
