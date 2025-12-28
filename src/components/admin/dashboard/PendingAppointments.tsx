/**
 * Pending Appointments Component
 * Displays all pending appointments with quick confirm action
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatTime, formatDate, formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Clock, User, Dog, Package, CheckCircle } from 'lucide-react';
import { AppointmentDetailModal } from '@/components/admin/appointments/AppointmentDetailModal';
import type { Tables } from '@/types/supabase';
import { toast } from '@/hooks/use-toast';

type Appointment = Tables<'appointments'> & {
  customer?: Tables<'users'> | null;
  pet?: (Tables<'pets'> & {
    breed?: Tables<'breeds'> | null;
  }) | null;
  service?: Tables<'services'> | null;
};

interface PendingAppointmentsProps {
  initialAppointments: Appointment[];
}

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (id: string) => void;
  onCardClick: (appointmentId: string) => void;
}

function AppointmentCard({ appointment, onStatusUpdate, onCardClick }: AppointmentCardProps) {
  const [confirming, setConfirming] = useState(false);

  const scheduledAt = new Date(appointment.scheduled_at);
  const dateStr = formatDate(scheduledAt);
  const timeStr = formatTime(scheduledAt);

  // Get customer flag color (would come from customer_flags table in production)
  const flagColor = 'green'; // green, yellow, red

  const flagColorClass = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }[flagColor];

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking button

    setConfirming(true);
    try {
      // Call API to update appointment status to confirmed
      const response = await fetch(`/api/admin/appointments/${appointment.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm appointment');
      }

      onStatusUpdate(appointment.id);

      toast.success('Appointment confirmed');
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      toast.error('Failed to confirm appointment');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-all cursor-pointer"
      style={{
        animation: 'fadeIn 0.3s ease-in',
      }}
      onClick={() => onCardClick(appointment.id)}
    >
      {/* Compact header: Date/Time + Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold text-[#434E54]">
            {timeStr}
          </span>
          <span className="text-xs text-[#434E54]/60">
            {dateStr}
          </span>
        </div>
        <StatusBadge status={appointment.status} size="sm" />
      </div>

      {/* Customer and Pet info - more compact */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#434E54]/60 flex-shrink-0" />
          <span className="text-sm font-medium text-[#434E54] truncate">
            {appointment.customer?.first_name} {appointment.customer?.last_name}
          </span>
          {/* Customer Flag Indicator */}
          <div
            className={`w-2 h-2 rounded-full ${flagColorClass} flex-shrink-0`}
            title="Customer flag"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Dog className="w-3.5 h-3.5 text-[#434E54]/60 flex-shrink-0" />
          <span className="text-sm text-[#434E54]/70 truncate">
            {appointment.pet?.name}
            {appointment.pet?.breed?.name && (
              <span className="text-[#434E54]/50">
                {' '}({appointment.pet.breed.name})
              </span>
            )}
            {appointment.pet?.size && (
              <> - {appointment.pet.size.charAt(0).toUpperCase() + appointment.pet.size.slice(1)}</>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Package className="w-3.5 h-3.5 text-[#434E54]/60 flex-shrink-0" />
            <span className="text-sm text-[#434E54]/70 truncate">
              {appointment.service?.name}
            </span>
          </div>
          {appointment.total_price && (
            <span className="text-sm font-medium text-[#434E54]/70 flex-shrink-0">
              {formatCurrency(appointment.total_price)}
            </span>
          )}
        </div>
      </div>

      {/* Confirm Button - Full Width */}
      <button
        onClick={handleConfirm}
        disabled={confirming}
        className="btn btn-sm bg-[#434E54] hover:bg-[#363F44] text-white border-none w-full"
      >
        <CheckCircle className="w-4 h-4" />
        {confirming ? 'Confirming...' : 'Confirm Appointment'}
      </button>

      {/* Notes - if present */}
      {appointment.notes && (
        <div className="mt-2 pt-2 border-t border-[#EAE0D5]">
          <p className="text-xs text-[#434E54]/60 italic line-clamp-2">
            Note: {appointment.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export function PendingAppointments({ initialAppointments }: PendingAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStatusUpdate = (id: string) => {
    // Remove the confirmed appointment from the pending list
    setAppointments(prev => prev.filter(apt => apt.id !== id));
  };

  const handleCardClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAppointmentId(null);
  };

  const handleModalUpdate = () => {
    // Refresh the appointments list by re-fetching
    // For now, we'll just close the modal
    // In a real implementation, you might want to refetch the data
  };

  const displayAppointments = appointments.slice(0, 10);
  const hasMore = appointments.length > 10;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-semibold text-[#434E54] flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Appointments
            <span className="ml-2 px-2.5 py-0.5 bg-[#EAE0D5] text-[#434E54] text-sm font-medium rounded-full">
              {appointments.length}
            </span>
          </h2>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-[#EAE0D5] mx-auto mb-4" />
            <p className="text-[#434E54]/60 mb-2">No pending appointments</p>
            <p className="text-sm text-[#434E54]/40">
              All appointments are confirmed or scheduled
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onStatusUpdate={handleStatusUpdate}
                onCardClick={handleCardClick}
              />
            ))}

            {hasMore && (
              <Link
                href="/admin/appointments?status=pending"
                className="block text-center py-3 text-[#434E54] hover:text-[#363F44] font-medium transition-colors"
              >
                View All Pending Appointments ({appointments.length})
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointmentId={selectedAppointmentId}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleModalUpdate}
      />
    </>
  );
}
