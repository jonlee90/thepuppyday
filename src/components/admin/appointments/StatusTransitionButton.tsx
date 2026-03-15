/**
 * StatusTransitionButton Component
 * Renders context-aware action buttons for appointment status transitions
 * Uses AdminButton for consistent styling and visible loading spinners
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import type { StatusTransition } from '@/lib/admin/appointment-status';
import { CANCELLATION_REASONS } from '@/lib/admin/appointment-status';

interface StatusTransitionButtonProps {
  transition: StatusTransition;
  appointmentId: string;
  disabled?: boolean;
  onSuccess?: (toStatus?: string) => void;
}

export function StatusTransitionButton({
  transition,
  appointmentId,
  disabled = false,
  onSuccess,
}: StatusTransitionButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
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
        sendNotification: sendEmail,
        sendEmail,
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

      toast.success(`Appointment ${transition.to}`);
      setShowConfirmation(false);
      if (onSuccess) {
        onSuccess(transition.to);
      }
    } catch (err) {
      console.error('[StatusTransitionButton] error:', err);
      toast.error('Failed to update status');
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminButton
        variant={transition.isDestructive ? 'danger' : 'primary'}
        onClick={handleClick}
        disabled={disabled}
        isLoading={loading}
      >
        {transition.label}
      </AdminButton>

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

            {/* Email Notification */}
            {(transition.to === 'confirmed' ||
              transition.to === 'cancelled' ||
              transition.to === 'completed') && (
              <div className="mb-4">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text text-[#434E54] font-medium">
                    <Send className="w-4 h-4 inline-block mr-2" />
                    Send Email Notification
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="alert alert-error mb-4">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="modal-action">
              <AdminButton
                variant="ghost"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant={transition.isDestructive ? 'danger' : 'primary'}
                onClick={handleStatusUpdate}
                disabled={transition.to === 'cancelled' && !cancellationReason}
                isLoading={loading}
              >
                Confirm
              </AdminButton>
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
