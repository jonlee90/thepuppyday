/**
 * StatusTransitionButton Component
 * Renders context-aware action buttons for appointment status transitions
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import type { AppointmentStatus } from '@/types/database';
import type { StatusTransition } from '@/lib/admin/appointment-status';
import { CANCELLATION_REASONS } from '@/lib/admin/appointment-status';

interface StatusTransitionButtonProps {
  transition: StatusTransition;
  appointmentId: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function StatusTransitionButton({
  transition,
  appointmentId,
  disabled = false,
  onSuccess,
}: StatusTransitionButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = () => {
    if (transition.requiresConfirmation || transition.to === 'cancelled') {
      setShowConfirmation(true);
    } else {
      handleStatusUpdate();
    }
  };

  const handleStatusUpdate = async () => {
    setLoading(true);
    setError('');

    try {
      const body: any = {
        status: transition.to,
        sendNotification,
        sendEmail,
        sendSms,
      };

      if (transition.to === 'cancelled' && cancellationReason) {
        body.cancellationReason = cancellationReason;
      }

      const response = await fetch(`/api/admin/appointments/${appointmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      setShowConfirmation(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = () => {
    if (transition.isDestructive) {
      return 'btn btn-error text-white hover:bg-red-600';
    }
    return 'btn bg-[#434E54] text-white hover:bg-[#363F44]';
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={getButtonClass()}
      >
        {loading && <span className="loading loading-spinner loading-sm" />}
        {transition.label}
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white max-w-md">
            <h3 className="font-bold text-lg text-[#434E54] mb-4">
              {transition.isDestructive && (
                <AlertTriangle className="w-5 h-5 inline-block mr-2 text-error" />
              )}
              Confirm {transition.label}
            </h3>

            <p className="text-[#6B7280] mb-4">{transition.description}</p>

            {/* Cancellation Reason (for cancelled status) */}
            {transition.to === 'cancelled' && (
              <div className="mb-4">
                <label className="label">
                  <span className="label-text text-[#434E54] font-medium">
                    Cancellation Reason
                  </span>
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="select select-bordered w-full bg-white border-gray-200 focus:border-[#434E54]"
                >
                  <option value="">Select a reason...</option>
                  {CANCELLATION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Options */}
            {(transition.to === 'confirmed' ||
              transition.to === 'cancelled' ||
              transition.to === 'completed') && (
              <div className="mb-4">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={sendNotification}
                    onChange={(e) => setSendNotification(e.target.checked)}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text text-[#434E54] font-medium">
                    <Send className="w-4 h-4 inline-block mr-2" />
                    Send Notification
                  </span>
                </label>

                {sendNotification && (
                  <div className="ml-8 space-y-2">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="checkbox checkbox-sm"
                      />
                      <span className="label-text text-[#6B7280]">Email</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        checked={sendSms}
                        onChange={(e) => setSendSms(e.target.checked)}
                        className="checkbox checkbox-sm"
                      />
                      <span className="label-text text-[#6B7280]">SMS</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="alert alert-error mb-4">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="btn btn-ghost text-[#434E54]"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={loading || (transition.to === 'cancelled' && !cancellationReason)}
                className={getButtonClass()}
              >
                {loading && <span className="loading loading-spinner loading-sm" />}
                Confirm
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowConfirmation(false)}>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}
