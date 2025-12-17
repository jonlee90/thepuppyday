/**
 * Resend Notification Modal Component
 * Task 0148: Resend failed notifications with confirmation
 */

'use client';

import { useState } from 'react';
import { X, RotateCcw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { NotificationLogListItem } from '@/types/notification-log';
import { getNotificationTypeLabel } from '@/types/notifications';
import { getChannelIcon, formatFullTimestamp } from '../utils';

interface ResendModalProps {
  log: NotificationLogListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResend: (logId: string) => Promise<{ success: boolean; message: string }>;
  onSuccess?: () => void;
}

export function ResendModal({ log, isOpen, onClose, onResend, onSuccess }: ResendModalProps) {
  const [resending, setResending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !log) {
    return null;
  }

  const handleResend = async () => {
    try {
      setResending(true);
      setResult(null);

      const response = await onResend(log.id);
      setResult(response);

      if (response.success && onSuccess) {
        // Wait a bit to show success message
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to resend notification:', error);
      setResult({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setResending(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-white max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#434E54]">Resend Notification</h3>
          <button
            onClick={handleClose}
            disabled={resending}
            className="btn btn-sm btn-ghost btn-circle text-[#434E54]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`alert mb-6 ${
              result.success ? 'alert-success' : 'alert-error'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{result.message}</span>
          </div>
        )}

        {/* Notification Details */}
        {!result && (
          <div className="bg-[#F8EEE5] rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-[#9CA3AF]">Type</span>
              <span className="text-sm font-medium text-[#434E54]">
                {getNotificationTypeLabel(log.type)}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-[#9CA3AF]">Channel</span>
              <span className="text-sm font-medium text-[#434E54]">
                {getChannelIcon(log.channel)} {log.channel.toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-[#9CA3AF]">Recipient</span>
              <span className="text-sm font-medium text-[#434E54]">{log.recipient}</span>
            </div>

            {log.customer_name && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-[#9CA3AF]">Customer</span>
                <span className="text-sm font-medium text-[#434E54]">{log.customer_name}</span>
              </div>
            )}

            {log.subject && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-[#9CA3AF]">Subject</span>
                <span className="text-sm font-medium text-[#434E54]">{log.subject}</span>
              </div>
            )}

            <div className="flex justify-between items-start">
              <span className="text-sm text-[#9CA3AF]">Original Sent</span>
              <span className="text-sm font-medium text-[#434E54]">
                {formatFullTimestamp(log.created_at)}
              </span>
            </div>

            {log.error_message && (
              <div className="pt-3 border-t border-gray-200">
                <span className="text-sm text-[#9CA3AF] block mb-1">Error Message</span>
                <p className="text-sm text-red-600">{log.error_message}</p>
              </div>
            )}
          </div>
        )}

        {/* Warning Message */}
        {!result && (
          <div className="alert alert-warning mb-6">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              This will create a new notification log entry and attempt to resend this
              notification to the recipient.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={resending}
            className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5]"
          >
            {result ? 'Close' : 'Cancel'}
          </button>

          {!result && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Resend Notification
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modal Backdrop */}
      <div className="modal-backdrop" onClick={handleClose}>
        <button>close</button>
      </div>
    </div>
  );
}
