/**
 * DashboardTimeline Component
 * Vertical timeline view of today's schedule with time markers, appointment cards,
 * a "Now" indicator, inline status actions, and available slot gap rendering.
 *
 * Tasks 0005, 0006, 0007 from admin-dashboard-redesign spec.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Dog, Calendar, CheckCircle, PlayCircle, User, Package } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppointmentDetailModal } from '@/components/admin/appointments/AppointmentDetailModal';
import { formatTime, formatCurrency } from '@/lib/utils';
import { BUSINESS_HOURS, STATUS_COLORS, GROOMER_COLORS, UNASSIGNED_COLOR } from '@/components/admin/appointments/calendar/constants';
import { toast } from '@/hooks/use-toast';
import type { AppointmentStatus } from '@/lib/validations/common';
import type { Tables } from '@/types/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Appointment = Tables<'appointments'> & {
  customer?: Tables<'users'> | null;
  pet?: (Tables<'pets'> & {
    breed?: Tables<'breeds'> | null;
  }) | null;
  service?: Tables<'services'> | null;
};

export interface DashboardTimelineProps {
  appointments: Appointment[];
  loading: boolean;
  error: boolean;
  onStatusUpdate?: (id: string, newStatus: AppointmentStatus) => void;
  onAppointmentClick?: (appointmentId: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOUR_HEIGHT_PX = 120; // px per hour in the timeline (enough for card height ~100px)
const BUSINESS_START = BUSINESS_HOURS.start; // e.g. 9
const BUSINESS_END = BUSINESS_HOURS.end;     // e.g. 17
const TOTAL_HOURS = BUSINESS_END - BUSINESS_START;
const TOTAL_MINUTES = TOTAL_HOURS * 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNextAction(status: AppointmentStatus): {
  label: string;
  action: AppointmentStatus;
  icon: React.ElementType;
} | null {
  switch (status) {
    case 'pending':
      return { label: 'Confirm', action: 'confirmed', icon: CheckCircle };
    case 'confirmed':
      return { label: 'Start', action: 'in_progress', icon: PlayCircle };
    case 'in_progress':
      return { label: 'Complete', action: 'completed', icon: CheckCircle };
    default:
      return null;
  }
}

/**
 * Returns the top offset in px for a given time (as hours + minutes)
 * relative to BUSINESS_START.
 */
function getTimeOffsetPx(hours: number, minutes: number): number {
  const totalMinutesFromStart = (hours - BUSINESS_START) * 60 + minutes;
  return (totalMinutesFromStart / TOTAL_MINUTES) * (TOTAL_HOURS * HOUR_HEIGHT_PX);
}

// ---------------------------------------------------------------------------
// Sub-component: TimeMarker
// ---------------------------------------------------------------------------

function TimeMarkers() {
  const hours: number[] = [];
  for (let h = BUSINESS_START; h <= BUSINESS_END; h++) {
    hours.push(h);
  }

  return (
    <div
      className="absolute left-0 top-0 w-14 pointer-events-none"
      style={{ height: TOTAL_HOURS * HOUR_HEIGHT_PX }}
    >
      {hours.map((hour) => {
        const top = (hour - BUSINESS_START) * HOUR_HEIGHT_PX;
        const label = hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
        return (
          <div
            key={hour}
            className="absolute flex items-center"
            style={{ top, transform: 'translateY(-50%)' }}
          >
            <span className="text-xs font-medium text-[#434E54]/40 whitespace-nowrap pr-2">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: NowIndicator (Task 0007)
// ---------------------------------------------------------------------------

interface NowIndicatorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function NowIndicator({ containerRef }: NowIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [positionPercent, setPositionPercent] = useState<number | null>(null);

  const calculatePosition = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const startMinutes = BUSINESS_START * 60;
    const endMinutes = BUSINESS_END * 60;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      setPositionPercent(null);
      return;
    }

    const offsetMinutes = currentMinutes - startMinutes;
    const percent = (offsetMinutes / TOTAL_MINUTES) * 100;
    setPositionPercent(percent);
  }, []);

  // Calculate on mount + set up 60s interval
  useEffect(() => {
    calculatePosition();
    const interval = setInterval(calculatePosition, 60_000);
    return () => clearInterval(interval);
  }, [calculatePosition]);

  // Auto-scroll into view on mount
  useEffect(() => {
    if (indicatorRef.current && positionPercent !== null) {
      indicatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (positionPercent === null) return null;

  const topPx = (positionPercent / 100) * (TOTAL_HOURS * HOUR_HEIGHT_PX);

  return (
    <div
      ref={indicatorRef}
      className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
      style={{ top: topPx, transform: 'translateY(-50%)' }}
      aria-label="Current time indicator"
      role="presentation"
    >
      {/* Pulsing dot */}
      <div className="flex-shrink-0 ml-14 mr-2 flex items-center gap-1">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <span className="text-[10px] font-bold text-red-500 tracking-wider">NOW</span>
      </div>
      {/* Horizontal line */}
      <div className="flex-1 h-px bg-red-500" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: TimelineAppointmentCard (Task 0006)
// ---------------------------------------------------------------------------

interface TimelineAppointmentCardProps {
  appointment: Appointment;
  index: number;
  groomerColorMap: Record<string, string>;
  onStatusUpdate: (id: string, newStatus: AppointmentStatus) => void;
  onCardClick: (appointmentId: string) => void;
}

function TimelineAppointmentCard({
  appointment,
  index,
  groomerColorMap,
  onStatusUpdate,
  onCardClick,
}: TimelineAppointmentCardProps) {
  const [updating, setUpdating] = useState(false);

  const scheduledAt = new Date(appointment.scheduled_at);
  const timeStr = formatTime(scheduledAt);
  const status = (appointment.status ?? 'pending') as AppointmentStatus;
  const groomerId = (appointment as any).groomer_id || 'unassigned';
  const stripeColor = groomerColorMap[groomerId] || STATUS_COLORS[status] || STATUS_COLORS.pending;
  const nextAction = getNextAction(status);

  const handleStatusUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextAction) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextAction.action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      onStatusUpdate(appointment.id, nextAction.action);
      toast.success(`Appointment ${nextAction.action.replace('_', ' ')}`);
    } catch (err) {
      console.error('Failed to update appointment:', err);
      toast.error('Failed to update appointment');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.06 }}
      className="flex rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden bg-white"
      onClick={() => onCardClick(appointment.id)}
      role="button"
      tabIndex={0}
      aria-label={`Appointment: ${appointment.customer?.first_name ?? ''} ${appointment.customer?.last_name ?? ''} at ${timeStr}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(appointment.id);
        }
      }}
    >
      {/* Left color stripe */}
      <div
        className="w-1 flex-shrink-0 rounded-l-lg"
        style={{ backgroundColor: stripeColor }}
        aria-hidden="true"
      />

      {/* Card content */}
      <div className="flex-1 p-2.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {/* Left: time + info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#434E54]">{timeStr}</span>
              <StatusBadge status={status} size="sm" />
            </div>

            <div className="flex items-center gap-1 mb-0.5">
              <User className="w-3 h-3 text-[#434E54]/50 flex-shrink-0" />
              <span className="text-xs font-medium text-[#434E54] truncate">
                {appointment.customer?.first_name} {appointment.customer?.last_name}
              </span>
            </div>

            <div className="flex items-center gap-1 mb-0.5">
              <Dog className="w-3 h-3 text-[#434E54]/50 flex-shrink-0" />
              <span className="text-xs text-[#434E54]/70 truncate">
                {appointment.pet?.name}
                {appointment.pet?.breed?.name && (
                  <span className="text-[#434E54]/50"> ({appointment.pet.breed.name})</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <Package className="w-3 h-3 text-[#434E54]/50 flex-shrink-0" />
                <span className="text-xs text-[#434E54]/70 truncate">
                  {appointment.service?.name}
                </span>
              </div>
              {appointment.total_price != null && (
                <span className="text-xs font-medium text-[#434E54]/70 flex-shrink-0">
                  {formatCurrency(appointment.total_price)}
                </span>
              )}
            </div>
          </div>

          {/* Right: action button */}
          {nextAction && (
            <button
              onClick={handleStatusUpdate}
              disabled={updating}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-[#434E54] hover:bg-[#363F44] text-white rounded-lg transition-colors disabled:opacity-60"
              aria-label={`${nextAction.label} appointment for ${appointment.customer?.first_name ?? ''}`}
            >
              <nextAction.icon className="w-3 h-3" />
              {updating ? '...' : nextAction.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: AvailableSlotGap
// ---------------------------------------------------------------------------

interface AvailableSlotGapProps {
  topPx: number;
  heightPx: number;
  label: string;
}

function AvailableSlotGap({ topPx, heightPx, label }: AvailableSlotGapProps) {
  if (heightPx < 20) return null;
  return (
    <div
      className="absolute left-14 right-0 border border-dashed border-[#EAE0D5] rounded-lg flex items-center justify-center"
      style={{ top: topPx + 2, height: heightPx - 4 }}
      aria-label={label}
    >
      {heightPx >= 36 && (
        <span className="text-[10px] text-[#434E54]/30 select-none">Available</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main: DashboardTimeline (Task 0005 + 0006 + 0007)
// ---------------------------------------------------------------------------

export function DashboardTimeline({
  appointments,
  loading,
  error,
  onStatusUpdate,
  onAppointmentClick,
}: DashboardTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nowIndicatorContainerRef = useRef<HTMLDivElement>(null);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [localAppointments, setLocalAppointments] = useState<Appointment[]>(appointments);
  const [groomerColorMap, setGroomerColorMap] = useState<Record<string, string>>({});

  // Keep local state in sync with prop updates from the hook
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  // Fetch groomers for color mapping
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/admin/settings/staff?role=all&status=active');
        const result = await response.json();
        if (response.ok) {
          const list = result.data || [];
          const colorMap: Record<string, string> = {};
          list.forEach((g: { id: string }, i: number) => {
            colorMap[g.id] = GROOMER_COLORS[i % GROOMER_COLORS.length];
          });
          colorMap['unassigned'] = UNASSIGNED_COLOR;
          setGroomerColorMap(colorMap);
        }
      } catch {
        // Silently fail — will fall back to status colors
      }
    })();
  }, []);

  const handleStatusUpdate = useCallback(
    (id: string, newStatus: AppointmentStatus) => {
      setLocalAppointments((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, status: newStatus, updated_at: new Date().toISOString() } : apt
        )
      );
      onStatusUpdate?.(id, newStatus);
    },
    [onStatusUpdate]
  );

  const handleCardClick = useCallback(
    (appointmentId: string) => {
      if (onAppointmentClick) {
        onAppointmentClick(appointmentId);
      } else {
        setSelectedAppointmentId(appointmentId);
        setIsModalOpen(true);
      }
    },
    [onAppointmentClick]
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAppointmentId(null);
  };

  // When the modal reports an update (status change, edit, groomer assignment),
  // propagate to the parent so the dashboard refetches fresh data.
  const handleModalUpdate = useCallback(() => {
    onStatusUpdate?.(selectedAppointmentId ?? '', 'confirmed' as AppointmentStatus);
  }, [onStatusUpdate, selectedAppointmentId]);

  // -------------------------------------------------------------------------
  // Layout computation: position each appointment in the timeline
  // -------------------------------------------------------------------------

  // Sort appointments by scheduled_at ascending
  const sortedAppointments = [...localAppointments].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  // For each appointment, compute its top offset in px
  type PositionedAppointment = Appointment & { topPx: number };

  const positionedAppointments: PositionedAppointment[] = sortedAppointments
    .filter((apt) => {
      const d = new Date(apt.scheduled_at);
      const h = d.getHours();
      const m = d.getMinutes();
      const totalMin = (h - BUSINESS_START) * 60 + m;
      return totalMin >= 0 && totalMin <= TOTAL_MINUTES;
    })
    .map((apt) => {
      const d = new Date(apt.scheduled_at);
      return {
        ...apt,
        topPx: getTimeOffsetPx(d.getHours(), d.getMinutes()),
      };
    });

  // Compute available slot gaps (hour slots without an appointment)
  const hourSlots: number[] = [];
  for (let h = BUSINESS_START; h < BUSINESS_END; h++) {
    hourSlots.push(h);
  }

  const occupiedHours = new Set(
    positionedAppointments.map((apt) => new Date(apt.scheduled_at).getHours())
  );

  const availableGaps = hourSlots
    .filter((h) => !occupiedHours.has(h))
    .map((h) => ({
      topPx: (h - BUSINESS_START) * HOUR_HEIGHT_PX,
      heightPx: HOUR_HEIGHT_PX,
      label: `Available slot at ${h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}`,
    }));

  const totalTimelineHeight = TOTAL_HOURS * HOUR_HEIGHT_PX;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-semibold text-[#434E54] flex items-center gap-2">
            <Calendar className="w-5 h-5" aria-hidden="true" />
            Today&apos;s Schedule
            <span
              className="ml-1 px-2.5 py-0.5 bg-[#EAE0D5] text-[#434E54] text-sm font-medium rounded-full"
              aria-label={`${localAppointments.length} appointments`}
            >
              {localAppointments.length}
            </span>
          </h2>
          <Link
            href="/admin/appointments"
            className="text-sm text-[#434E54] hover:text-[#363F44] font-medium transition-colors"
          >
            View Calendar
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="animate-pulse space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="text-center py-10">
            <p className="text-sm text-[#434E54]/60">Failed to load today&apos;s schedule.</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && localAppointments.length === 0 && (
          <div className="text-center py-12">
            <Dog className="w-16 h-16 text-[#EAE0D5] mx-auto mb-4" aria-hidden="true" />
            <p className="text-[#434E54]/60 mb-1">No appointments scheduled</p>
            <p className="text-sm text-[#434E54]/40">Today&apos;s schedule is clear</p>
          </div>
        )}

        {/* Timeline body */}
        {!loading && !error && localAppointments.length > 0 && (
          <div
            ref={scrollContainerRef}
            className="max-h-[calc(100vh-300px)] overflow-y-auto pr-1"
            aria-label="Today's appointment timeline"
            role="region"
          >
            {/* Relative container holding the full timeline */}
            <div
              ref={nowIndicatorContainerRef}
              className="relative"
              style={{ height: totalTimelineHeight }}
            >
              {/* Time markers (left column) */}
              <TimeMarkers />

              {/* Horizontal hour divider lines */}
              {hourSlots.map((h) => (
                <div
                  key={h}
                  className="absolute left-14 right-0 border-t border-[#F3F4F6]"
                  style={{ top: (h - BUSINESS_START) * HOUR_HEIGHT_PX }}
                  aria-hidden="true"
                />
              ))}

              {/* Available slot gaps */}
              {availableGaps.map((gap) => (
                <AvailableSlotGap
                  key={gap.topPx}
                  topPx={gap.topPx}
                  heightPx={gap.heightPx}
                  label={gap.label}
                />
              ))}

              {/* Now indicator */}
              <NowIndicator containerRef={nowIndicatorContainerRef} />

              {/* Appointment cards */}
              {positionedAppointments.map((apt, index) => (
                <div
                  key={apt.id}
                  className="absolute left-14 right-0 px-1"
                  style={{ top: apt.topPx + 2 }}
                >
                  <TimelineAppointmentCard
                    appointment={apt}
                    index={index}
                    groomerColorMap={groomerColorMap}
                    onStatusUpdate={handleStatusUpdate}
                    onCardClick={handleCardClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Appointment Detail Modal (only used when no external onAppointmentClick prop) */}
      {!onAppointmentClick && (
        <AppointmentDetailModal
          appointmentId={selectedAppointmentId}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onUpdate={handleModalUpdate}
        />
      )}
    </>
  );
}
