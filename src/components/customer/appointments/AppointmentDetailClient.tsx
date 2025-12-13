/**
 * Appointment Detail Client Component
 * Client-side actions for appointment management (cancel, rebook)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from '@/hooks/use-toast';
import type { AppointmentStatus } from '@/types/database';

interface AppointmentDetailClientProps {
  appointmentId: string;
  status: AppointmentStatus;
  scheduledAt: string;
  petId: string;
  serviceId: string;
  hasReportCard?: boolean;
}

// Check if appointment can be cancelled
function canCancel(status: AppointmentStatus, scheduledAt: string): boolean {
  const scheduled = new Date(scheduledAt);
  const now = new Date();
  const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);

  return ['pending', 'confirmed'].includes(status) && hoursUntil > 24;
}

// Check if appointment can be rebooked
function canRebook(status: AppointmentStatus): boolean {
  return status === 'completed';
}

export function AppointmentDetailClient({
  appointmentId,
  status,
  scheduledAt,
  petId,
  serviceId,
  hasReportCard = false,
}: AppointmentDetailClientProps) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const allowCancel = canCancel(status, scheduledAt);
  const allowRebook = canRebook(status);
  const allowReschedule = canCancel(status, scheduledAt); // Same logic as cancel

  // Calculate hours until appointment
  const hoursUntil = (new Date(scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const withinCancellationWindow = hoursUntil <= 24 && hoursUntil > 0;

  // Handle appointment cancellation
  const handleCancelAppointment = async () => {
    setIsCancelling(true);

    try {
      const response = await fetch(`/api/customer/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel appointment');
      }

      toast.success('Appointment Cancelled', {
        description: 'Your appointment has been successfully cancelled. A confirmation email has been sent.',
      });

      // Refresh the page to show updated status
      router.refresh();
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to cancel appointment. Please try again.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Don't show actions section if no actions available
  if (!allowCancel && !allowReschedule && !allowRebook && !hasReportCard) {
    return null;
  }

  return (
    <>
      {/* Actions Card */}
      <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
        <h2 className="font-bold text-[#434E54] mb-4">Actions</h2>
        <div className="space-y-3">
          {/* Rebook (for completed appointments) */}
          {allowRebook && (
            <Link
              href={`/book?pet=${petId}&service=${serviceId}`}
              className="block w-full text-center py-2.5 px-4 rounded-lg
                       bg-[#434E54] text-white font-semibold text-sm
                       hover:bg-[#434E54]/90 transition-all duration-200
                       shadow-sm hover:shadow-md"
            >
              Book Again
            </Link>
          )}

          {/* View Report Card (for completed appointments) */}
          {hasReportCard && (
            <Link
              href={`/report-cards/${appointmentId}`}
              className="block w-full text-center py-2.5 px-4 rounded-lg
                       bg-[#EAE0D5] text-[#434E54] font-semibold text-sm
                       hover:bg-[#EAE0D5]/70 transition-colors"
            >
              View Report Card
            </Link>
          )}

          {/* Reschedule */}
          {allowReschedule && (
            <Link
              href={`/book?reschedule=${appointmentId}`}
              className="block w-full text-center py-2.5 px-4 rounded-lg
                       bg-[#EAE0D5] text-[#434E54] font-semibold text-sm
                       hover:bg-[#EAE0D5]/70 transition-colors"
            >
              Reschedule
            </Link>
          )}

          {/* Cancel */}
          {allowCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="block w-full text-center py-2.5 px-4 rounded-lg
                       border border-red-200 text-red-600 font-semibold text-sm
                       hover:bg-red-50 transition-colors"
            >
              Cancel Appointment
            </button>
          )}

          {/* Cannot cancel message */}
          {withinCancellationWindow && !allowCancel && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                This appointment is within 24 hours and cannot be cancelled online.
                Please call us at <a href="tel:+16572522903" className="font-semibold hover:underline">(657) 252-2903</a>.
              </p>
            </div>
          )}
        </div>

        {/* Cancellation policy note */}
        {(allowCancel || allowReschedule) && (
          <p className="text-xs text-[#434E54]/50 mt-3">
            Cancellations and reschedules must be made at least 24 hours in advance.
          </p>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelAppointment}
        title="Cancel Appointment?"
        description="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        variant="error"
        isLoading={isCancelling}
        additionalInfo={
          <div className="mt-3 p-3 rounded-lg bg-[#EAE0D5]/30 text-sm text-[#434E54]/80">
            <p className="font-semibold mb-1">Cancellation Policy:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Free cancellation up to 24 hours before appointment</li>
              <li>You will receive a confirmation email</li>
              <li>You can rebook anytime</li>
            </ul>
          </div>
        }
      />
    </>
  );
}
