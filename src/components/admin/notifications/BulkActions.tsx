'use client';

/**
 * BulkActions Component
 * Task 0067: Bulk operations bar for resending failed notifications
 */

import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { toast } from '@/hooks/use-toast';

interface BulkActionsProps {
  failedCount: number;
  onResendFailed: () => Promise<{ totalResent: number; totalFailed: number }>;
}

export function BulkActions({ failedCount, onResendFailed }: BulkActionsProps) {
  const [resending, setResending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    totalResent: number;
    totalFailed: number;
  } | null>(null);

  async function handleResendFailed() {
    setShowConfirmation(true);
  }

  async function confirmResend() {
    setShowConfirmation(false);
    setResending(true);

    try {
      const result = await onResendFailed();
      setResults(result);
      setShowResults(true);
    } catch (error) {
      console.error('Bulk resend failed:', error);
      toast.error('Failed to resend notifications');
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      {/* Main Bulk Actions Bar */}
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Bulk Actions</span>
          {failedCount > 0 && (
            <span className="badge badge-error badge-sm">{failedCount} failed</span>
          )}
        </div>

        <AdminButton
          variant="secondary"
          onClick={handleResendFailed}
          disabled={resending || failedCount === 0}
          isLoading={resending}
          loadingText="Resending..."
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Resend Failed
        </AdminButton>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-[#434E54] mb-4">Confirm Bulk Resend</h3>
            <div className="flex items-start gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700">
                  Are you sure you want to resend all {failedCount} failed notifications?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action will attempt to resend all notifications that previously failed.
                </p>
              </div>
            </div>
            <div className="modal-action">
              <AdminButton variant="ghost" onClick={() => setShowConfirmation(false)}>
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={confirmResend}>
                Confirm Resend
              </AdminButton>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowConfirmation(false)}
          ></div>
        </div>
      )}

      {/* Progress Indicator */}
      {resending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <div className="flex flex-col items-center gap-4">
              <div className="loading loading-spinner loading-lg text-[#434E54]"></div>
              <p className="text-gray-700 font-medium">Resending notifications...</p>
              <p className="text-sm text-gray-500">This may take a few moments.</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && results && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-[#434E54] mb-4">Resend Results</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success" />
                <div>
                  <p className="font-medium text-gray-700">
                    {results.totalResent} notifications resent successfully
                  </p>
                </div>
              </div>
              {results.totalFailed > 0 && (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-error" />
                  <div>
                    <p className="font-medium text-gray-700">
                      {results.totalFailed} notifications failed to resend
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-action">
              <AdminButton
                variant="primary"
                onClick={() => {
                  setShowResults(false);
                  setResults(null);
                }}
              >
                Close
              </AdminButton>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowResults(false)}></div>
        </div>
      )}
    </>
  );
}
