/**
 * AppointmentHistoryList Component
 * Displays customer appointment history with filters.
 * Data-driven: receives appointments, loading, error, and onRefresh as props.
 * Task 0062: Convert to data-driven props and remove internal fetch + metrics cards
 */

'use client';

import { useState, useMemo } from 'react';
import { format, subDays, isAfter } from 'date-fns';
import {
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Image as ImageIcon,
} from 'lucide-react';
import { AppointmentDetailModal } from '@/components/admin/appointments/AppointmentDetailModal';
import type { AppointmentStatus } from '@/types/database';

type DateRangeFilter = 'last_30' | 'last_90' | 'last_year' | 'all';
type StatusFilter = 'all' | 'completed' | 'cancelled' | 'no_show';

/** Appointment with joined pet, service, addons, and report_card */
export interface AppointmentWithDetails {
  // Base appointment fields (from Supabase 'appointments' table)
  id: string;
  customer_id: string;
  pet_id: string;
  service_id: string;
  groomer_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus | null;
  total_price: number;
  payment_status: string | null;
  notes: string | null;
  booking_reference: string | null;
  created_at: string | null;
  updated_at: string | null;

  // Joined relations (populated by API)
  pet?: {
    id: string;
    name: string;
    size: string;
    breed_id: string | null;
    breed_custom: string | null;
    [key: string]: unknown;
  };
  service?: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
  addons?: Array<{
    id: string;
    appointment_id: string;
    addon_id: string;
    price: number;
    addon?: { id: string; name: string; price: number };
  }>;
  report_card?: {
    id: string;
    appointment_id: string;
    [key: string]: unknown;
  } | null;
}

/** Metrics computed from appointment history, displayed in CustomerHero */
export interface CustomerMetrics {
  /** Total number of appointments (all statuses) */
  total_appointments: number;
  /** Sum of total_price for completed appointments */
  total_spent: number;
  /** Name of the most frequently booked service, or null */
  favorite_service: string | null;
  /** Average days between completed visits, or null if < 2 visits */
  avg_visit_frequency_days: number | null;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculate customer metrics from appointments in a single pass.
 * Combines what was previously filter + reduce + forEach into one loop.
 */
export function calculateCustomerMetrics(
  appointments: AppointmentWithDetails[]
): CustomerMetrics {
  let totalSpent = 0;
  const serviceCounts: Record<string, number> = {};
  const completedDates: number[] = [];

  for (const apt of appointments) {
    if (apt.status === 'completed') {
      totalSpent += apt.total_price || 0;
      if (apt.service) {
        serviceCounts[apt.service.name] =
          (serviceCounts[apt.service.name] || 0) + 1;
      }
      completedDates.push(new Date(apt.scheduled_at).getTime());
    }
  }

  // Favorite service
  let favoriteService: string | null = null;
  let maxCount = 0;
  for (const [name, count] of Object.entries(serviceCounts)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteService = name;
    }
  }

  // Average visit frequency
  let avgFrequency: number | null = null;
  if (completedDates.length >= 2) {
    completedDates.sort((a, b) => a - b);
    let totalGap = 0;
    for (let i = 1; i < completedDates.length; i++) {
      totalGap += completedDates[i] - completedDates[i - 1];
    }
    avgFrequency = Math.round(totalGap / (completedDates.length - 1) / MS_PER_DAY);
  }

  return {
    total_appointments: appointments.length,
    total_spent: totalSpent,
    favorite_service: favoriteService,
    avg_visit_frequency_days: avgFrequency,
  };
}

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  confirmed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  checked_in: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  in_progress: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  no_show: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

interface AppointmentHistoryListProps {
  appointments: AppointmentWithDetails[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

export function AppointmentHistoryList({
  appointments,
  loading,
  error,
  onRefresh,
}: AppointmentHistoryListProps) {
  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');

  // Modal state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (dateRangeFilter) {
        case 'last_30':
          cutoffDate = subDays(now, 30);
          break;
        case 'last_90':
          cutoffDate = subDays(now, 90);
          break;
        case 'last_year':
          cutoffDate = subDays(now, 365);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter((apt) => isAfter(new Date(apt.scheduled_at), cutoffDate));
    }

    // Sort by date descending (most recent first)
    filtered.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    return filtered;
  }, [appointments, statusFilter, dateRangeFilter]);

  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAppointmentId(null);
  };

  const handleModalUpdate = () => {
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     transition-colors"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>

        {/* Date Range Filter */}
        <select
          value={dateRangeFilter}
          onChange={(e) => setDateRangeFilter(e.target.value as DateRangeFilter)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     transition-colors"
        >
          <option value="all">All Time</option>
          <option value="last_30">Last 30 Days</option>
          <option value="last_90">Last 3 Months</option>
          <option value="last_year">Last Year</option>
        </select>

        <span className="text-sm text-gray-500">
          {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#434E54] rounded-full animate-spin" />
            <span>Loading appointments...</span>
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-900">No appointments found</p>
          <p className="text-sm text-gray-500 mt-1">
            {statusFilter !== 'all' || dateRangeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'This customer has no appointments yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => {
            const statusConfig = STATUS_COLORS[appointment.status];

            return (
              <div
                key={appointment.id}
                onClick={() => handleAppointmentClick(appointment.id)}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200
                           hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 text-[#434E54]">
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold">
                          {format(new Date(appointment.scheduled_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {format(new Date(appointment.scheduled_at), 'h:mm a')}
                        </span>
                      </div>
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                          ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border
                        `}
                      >
                        {appointment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-sm">
                      <div>
                        <span className="text-gray-600">Pet: </span>
                        <span className="font-medium text-[#434E54]">
                          {appointment.pet?.name || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Service: </span>
                        <span className="font-medium text-[#434E54]">
                          {appointment.service?.name || 'Unknown'}
                        </span>
                      </div>
                      {appointment.addons && appointment.addons.length > 0 && (
                        <div>
                          <span className="text-gray-600">Add-ons: </span>
                          <span className="font-medium text-[#434E54]">
                            {appointment.addons.map((a) => a.addon?.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Price and Report Card */}
                  <div className="flex items-center gap-4">
                    {appointment.report_card && (
                      <div className="flex items-center gap-1 text-green-600">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Report Card</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[#434E54]">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-bold">{appointment.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointmentId={selectedAppointmentId}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleModalUpdate}
      />
    </div>
  );
}
