'use client';

/**
 * NotificationDetailModal Component
 * Task 0066: Modal showing full notification details with resend capability
 */

import { useState } from 'react';
import { X, Mail, MessageSquare, RefreshCw, User } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import type { NotificationWithCustomer } from '@/types/notifications';
import { getNotificationTypeLabel } from '@/types/notifications';

interface NotificationDetailModalProps {
  notification: NotificationWithCustomer | null;
  isOpen: boolean;
  onClose: () => void;
  onResend?: (id: string) => Promise<void>;
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onResend,
}: NotificationDetailModalProps) {
  const [resending, setResending] = useState(false);

  async function handleResend(id: string) {
    if (!onResend) return;

    try {
      setResending(true);
      await onResend(id);
      onClose();
    } catch (error) {
      console.error('Failed to resend notification:', error);
      alert('Failed to resend notification');
    } finally {
      setResending(false);
    }
  }

  if (!isOpen || !notification) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#434E54]">Notification Details</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Type & Channel Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Type</label>
              <p className="text-[#434E54] font-medium mt-1">
                {getNotificationTypeLabel(notification.type)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Channel</label>
              <div className="flex items-center gap-2 mt-1">
                {notification.channel === 'email' ? (
                  <Mail className="w-4 h-4 text-blue-500" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-green-500" />
                )}
                <span className="capitalize text-[#434E54] font-medium">
                  {notification.channel}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info (if available) */}
          {notification.customer_name && (
            <div>
              <label className="text-sm font-medium text-gray-600">Customer</label>
              <p className="text-[#434E54] font-medium mt-1">{notification.customer_name}</p>
            </div>
          )}

          {/* Recipient */}
          <div>
            <label className="text-sm font-medium text-gray-600">Recipient</label>
            <p className="text-[#434E54] font-medium mt-1">{notification.recipient}</p>
          </div>

          {/* Subject (for email) */}
          {notification.subject && (
            <div>
              <label className="text-sm font-medium text-gray-600">Subject</label>
              <p className="text-[#434E54] font-medium mt-1">{notification.subject}</p>
            </div>
          )}

          {/* Message Content */}
          <div>
            <label className="text-sm font-medium text-gray-600">Content</label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{notification.content}</p>
            </div>
          </div>

          {/* Status & Error */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1">
                {notification.status === 'sent' ? (
                  <span className="badge badge-success">Sent</span>
                ) : notification.status === 'failed' ? (
                  <span className="badge badge-error">Failed</span>
                ) : (
                  <span className="badge badge-warning">Pending</span>
                )}
              </div>
            </div>
            {notification.error_message && (
              <div>
                <label className="text-sm font-medium text-gray-600">Error</label>
                <p className="text-sm text-red-600 mt-1">{notification.error_message}</p>
              </div>
            )}
          </div>

          {/* Delivery Timeline */}
          <div className="pt-4 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-600 mb-3 block">
              Delivery Timeline
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Sent</label>
                <p className="text-sm text-gray-700 mt-1">
                  {notification.sent_at
                    ? format(new Date(notification.sent_at), 'MMM d, h:mm a')
                    : '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Delivered</label>
                <p className="text-sm text-gray-700 mt-1">
                  {notification.delivered_at
                    ? format(new Date(notification.delivered_at), 'MMM d, h:mm a')
                    : '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Clicked</label>
                <p className="text-sm text-gray-700 mt-1">
                  {notification.clicked_at
                    ? format(new Date(notification.clicked_at), 'MMM d, h:mm a')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">
            Close
          </button>
          {notification.customer_id && (
            <Link
              href={`/admin/customers/${notification.customer_id}`}
              className="btn btn-outline gap-2"
            >
              <User className="w-4 h-4" />
              View Customer
            </Link>
          )}
          {notification.status === 'failed' && onResend && (
            <button
              onClick={() => handleResend(notification.id)}
              disabled={resending}
              className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] text-white gap-2"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
