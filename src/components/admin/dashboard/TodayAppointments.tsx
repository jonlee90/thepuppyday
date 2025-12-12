/**
 * Today's Appointments Component
 * Displays today's appointments with quick action buttons
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Calendar, User, Dog, Package, CheckCircle, PlayCircle, UserCheck, AlertCircle } from 'lucide-react';
import type { Appointment, AppointmentStatus } from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface TodayAppointmentsProps {
  initialAppointments: Appointment[];
}

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (id: string, newStatus: AppointmentStatus) => void;
}

function getNextAction(status: AppointmentStatus): {
  label: string;
  action: AppointmentStatus;
  icon: React.ElementType;
} | null {
  switch (status) {
    case 'pending':
      return { label: 'Confirm', action: 'confirmed', icon: CheckCircle };
    case 'confirmed':
      return { label: 'Check In', action: 'checked_in', icon: UserCheck };
    case 'checked_in':
      return { label: 'Start', action: 'in_progress', icon: PlayCircle };
    case 'in_progress':
      return { label: 'Complete', action: 'completed', icon: CheckCircle };
    default:
      return null;
  }
}

function AppointmentCard({ appointment, onStatusUpdate }: AppointmentCardProps) {
  const [updating, setUpdating] = useState(false);

  const scheduledAt = new Date(appointment.scheduled_at);
  const timeStr = formatTime(scheduledAt);

  // Get customer flag color (mock - would come from customer_flags table)
  const flagColor = 'green'; // green, yellow, red

  const flagColorClass = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }[flagColor];

  const nextAction = getNextAction(appointment.status);

  const handleStatusUpdate = async () => {
    if (!nextAction) return;

    setUpdating(true);
    try {
      // In mock mode, just update locally
      // In real implementation, would call API to update appointment
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      onStatusUpdate(appointment.id, nextAction.action);

      toast.success(`Appointment ${nextAction.action.replace('_', ' ')}`);
    } catch (error) {
      console.error('Failed to update appointment:', error);
      toast.error('Failed to update appointment');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all"
      style={{
        animation: 'fadeIn 0.3s ease-in',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Time and Status */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#434E54]">
              {scheduledAt.getHours() > 12
                ? scheduledAt.getHours() - 12
                : scheduledAt.getHours() || 12}
            </div>
            <div className="text-xs text-[#434E54]/60">
              {scheduledAt.getHours() >= 12 ? 'PM' : 'AM'}
            </div>
          </div>

          <div className="h-10 w-px bg-[#EAE0D5]" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-[#434E54]/60 flex-shrink-0" />
              <span className="font-medium text-[#434E54] truncate">
                {appointment.customer?.first_name} {appointment.customer?.last_name}
              </span>
              {/* Customer Flag Indicator */}
              <div
                className={`w-2 h-2 rounded-full ${flagColorClass} flex-shrink-0`}
                title="Customer flag"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-[#434E54]/60 mb-1">
              <Dog className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {appointment.pet?.name} ({appointment.pet?.breed?.name})
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#434E54]/60">
              <Package className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{appointment.service?.name}</span>
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={appointment.status} size="sm" />

          {nextAction && (
            <button
              onClick={handleStatusUpdate}
              disabled={updating}
              className="btn btn-sm bg-[#434E54] hover:bg-[#363F44] text-white border-none"
            >
              <nextAction.icon className="w-4 h-4" />
              {updating ? 'Updating...' : nextAction.label}
            </button>
          )}
        </div>
      </div>

      {appointment.notes && (
        <div className="mt-3 pt-3 border-t border-[#EAE0D5]">
          <p className="text-xs text-[#434E54]/60 italic">
            Note: {appointment.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export function TodayAppointments({ initialAppointments }: TodayAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

  const handleStatusUpdate = (id: string, newStatus: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === id ? { ...apt, status: newStatus, updated_at: new Date().toISOString() } : apt
      )
    );
  };

  const displayAppointments = appointments.slice(0, 10);
  const hasMore = appointments.length > 10;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#434E54] flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Appointments
        </h2>
        <span className="text-sm text-[#434E54]/60">
          {appointments.length} total
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-[#EAE0D5] mx-auto mb-4" />
          <p className="text-[#434E54]/60 mb-2">No appointments scheduled for today</p>
          <p className="text-sm text-[#434E54]/40">
            Appointments will appear here when customers book
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayAppointments.map(appointment => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}

          {hasMore && (
            <Link
              href="/admin/appointments"
              className="block text-center py-3 text-[#434E54] hover:text-[#363F44] font-medium transition-colors"
            >
              View All Appointments ({appointments.length})
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
