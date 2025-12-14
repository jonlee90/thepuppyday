'use client';

import { useState } from 'react';
import { Send, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from '@/hooks/use-toast';

interface ReportCardActionsProps {
  reportCardId: string;
  reportCard: {
    id: string;
    sent_at: string | null;
    is_draft: boolean;
    dont_send: boolean;
  };
  onSendSuccess?: () => void;
}

/**
 * ReportCardActions - Admin controls for manually sending/resending report cards
 * Provides send and resend buttons with confirmation modals
 */
export function ReportCardActions({
  reportCardId,
  reportCard,
  onSendSuccess,
}: ReportCardActionsProps) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    try {
      setIsSending(true);

      const response = await fetch(
        `/api/admin/report-cards/${reportCardId}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send' }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send report card');
      }

      toast.success('Report card sent successfully!', {
        description: 'The customer will receive SMS and email notifications.',
      });

      setShowSendModal(false);
      onSendSuccess?.();
    } catch (error) {
      toast.error('Failed to send report card', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsSending(true);

      const response = await fetch(
        `/api/admin/report-cards/${reportCardId}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resend' }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend report card');
      }

      toast.success('Report card resent successfully!', {
        description: 'The customer will receive new notifications.',
      });

      setShowResendModal(false);
      onSendSuccess?.();
    } catch (error) {
      toast.error('Failed to resend report card', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Show draft warning
  if (reportCard.is_draft) {
    return (
      <div className="alert alert-warning">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span>
          Report card is still a draft. Finish editing before sending.
        </span>
      </div>
    );
  }

  // Show don't send info
  if (reportCard.dont_send) {
    return (
      <div className="space-y-4">
        <div className="alert alert-info">
          <Info className="h-5 w-5 flex-shrink-0" />
          <span>
            Sending disabled for this report card. Update preferences to
            enable.
          </span>
        </div>
        <button disabled className="btn btn-primary gap-2" aria-disabled="true">
          <Send className="h-5 w-5" />
          Send Report Card
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3">
        {!reportCard.sent_at ? (
          // Send Now Button
          <button
            onClick={() => setShowSendModal(true)}
            className="btn btn-primary gap-2"
            aria-label="Send report card to customer"
          >
            <Send className="h-5 w-5" />
            Send Report Card
          </button>
        ) : (
          // Resend Button
          <button
            onClick={() => setShowResendModal(true)}
            className="btn btn-outline btn-primary gap-2"
            aria-label="Resend report card to customer"
          >
            <RefreshCw className="h-5 w-5" />
            Resend Report Card
          </button>
        )}
      </div>

      {/* Send Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onConfirm={handleSend}
        title="Send Report Card?"
        description="This will send SMS and email notifications to the customer with a link to view the report card."
        confirmText="Send Now"
        cancelText="Cancel"
        variant="default"
        isLoading={isSending}
      />

      {/* Resend Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResendModal}
        onClose={() => setShowResendModal(false)}
        onConfirm={handleResend}
        title="Resend Report Card?"
        description="This will send the report card again. The customer will receive new SMS and email notifications."
        confirmText="Resend Now"
        cancelText="Cancel"
        variant="default"
        isLoading={isSending}
      />
    </>
  );
}
