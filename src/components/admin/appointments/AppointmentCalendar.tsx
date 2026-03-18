/**
 * AppointmentCalendar Component
 * Custom-built calendar with swimlane day/week views and month grid
 * Replaces FullCalendar with iPad-optimized touch interactions
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { config } from '@/lib/config';
import { useCalendarState } from './calendar/hooks/useCalendarState';
import { useCalendarAppointments } from './calendar/hooks/useCalendarAppointments';
import { useCalendarTouch } from './calendar/hooks/useCalendarTouch';
import { useCalendarDragDrop } from './calendar/hooks/useCalendarDragDrop';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarLegend } from './calendar/CalendarLegend';
import { DayView } from './calendar/views/DayView';
import { WeekView } from './calendar/views/WeekView';
import { MonthView } from './calendar/views/MonthView';
import { DragOverlay } from './calendar/interactions/DragOverlay';
import { AppointmentPreview } from './calendar/cards/AppointmentPreview';
import type { CalendarAppointment } from './calendar/types';

interface AppointmentCalendarProps {
  onEventClick: (appointmentId: string) => void;
  onDateRangeChange?: (start: Date, end: Date) => void;
  onFillFromWaitlist?: (slotTime: Date) => void;
}

export function AppointmentCalendar({
  onEventClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDateRangeChange,
  onFillFromWaitlist,
}: AppointmentCalendarProps) {
  // Calendar state (view, navigation)
  const {
    view,
    setView,
    currentDate,
    dateRange,
    title,
    navigateNext,
    navigatePrev,
    navigateToday,
    goToDate,
  } = useCalendarState();

  // Data fetching
  const {
    appointments,
    loading,
    groomers,
    selectedGroomerId,
    setSelectedGroomerId,
    groomerColorMap,
    hasUnassigned,
    refetch,
  } = useCalendarAppointments(dateRange);

  // Waitlist slot modal
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [slotWaitlistCount, setSlotWaitlistCount] = useState(0);

  // Preview popover
  const [previewAppointment, setPreviewAppointment] = useState<CalendarAppointment | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch gestures (long-press only — swipe-to-navigate disabled intentionally)
  const { touchHandlers } = useCalendarTouch({
    onLongPress: () => {}, // Handled per-card
    onSwipeLeft: () => {},
    onSwipeRight: () => {},
  });

  // Drag & drop
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { dragState, startDrag } = useCalendarDragDrop({
    onReschedule: async (appointmentId, newTime, newGroomerId) => {
      try {
        await fetch(`/api/admin/appointments/${appointmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduled_at: newTime.toISOString(),
            ...(newGroomerId !== undefined && { groomer_id: newGroomerId }),
          }),
        });
        refetch();
      } catch (error) {
        console.error('[Calendar] Failed to reschedule:', error);
        refetch(); // Rollback by refetching
      }
    },
    onResize: async (appointmentId, newDuration) => {
      try {
        await fetch(`/api/admin/appointments/${appointmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration_minutes: newDuration }),
        });
        refetch();
      } catch (error) {
        console.error('[Calendar] Failed to resize:', error);
        refetch();
      }
    },
  });

  // Handle empty slot click
  const handleSlotClick = useCallback(
    async (time: Date, _groomerId: string | null) => {
      if (time < new Date()) return;

      setSelectedSlot(time);

      if (!config.features.waitlistEnabled) {
        setSlotWaitlistCount(0);
        return;
      }

      try {
        const response = await fetch(
          `/api/admin/waitlist/count?date=${time.toISOString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setSlotWaitlistCount(data.count || 0);
        } else {
          setSlotWaitlistCount(0);
        }
      } catch {
        setSlotWaitlistCount(0);
      }
    },
    []
  );

  // Handle fill from waitlist
  const handleFillSlot = useCallback(() => {
    if (selectedSlot && onFillFromWaitlist) {
      onFillFromWaitlist(selectedSlot);
      setSelectedSlot(null);
      setSlotWaitlistCount(0);
    }
  }, [selectedSlot, onFillFromWaitlist]);

  // Preview handlers
  const handlePreviewShow = useCallback(
    (e: React.MouseEvent, appointment: CalendarAppointment) => {
      previewTimer.current = setTimeout(() => {
        setPreviewAppointment(appointment);
        setPreviewPosition({ x: e.clientX, y: e.clientY });
      }, 200);
    },
    []
  );

  const handlePreviewHide = useCallback(() => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    setPreviewAppointment(null);
    setPreviewPosition(null);
  }, []);

  // Month view: click day → switch to day view
  const handleMonthDayClick = useCallback(
    (date: Date) => {
      goToDate(date);
      setView('day');
    },
    [goToDate, setView]
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6" {...touchHandlers}>
      {/* Header: nav, view toggle, groomer filter */}
      <CalendarHeader
        title={title}
        view={view}
        onViewChange={setView}
        onPrev={navigatePrev}
        onNext={navigateNext}
        onToday={navigateToday}
        groomers={groomers}
        selectedGroomerId={selectedGroomerId}
        onGroomerChange={setSelectedGroomerId}
        groomerColorMap={groomerColorMap}
      />

      {/* Legend 
      <CalendarLegend groomers={groomers} groomerColorMap={groomerColorMap} />
*/}
      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-lg text-[#434E54]" />
        </div>
      )}

      {/* Calendar views */}
      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${view}-${currentDate.toISOString()}`}
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className=""
          >
            {view === 'day' && (
              <DayView
                date={currentDate}
                appointments={appointments}
                groomers={groomers}
                groomerColorMap={groomerColorMap}
                hasUnassigned={hasUnassigned}
                onEventClick={onEventClick}
                onSlotClick={handleSlotClick}
                onPreviewShow={handlePreviewShow}
                onPreviewHide={handlePreviewHide}
              />
            )}

            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                appointments={appointments}
                groomers={groomers}
                groomerColorMap={groomerColorMap}
                hasUnassigned={hasUnassigned}
                onEventClick={onEventClick}
                onSlotClick={handleSlotClick}
                onPreviewShow={handlePreviewShow}
                onPreviewHide={handlePreviewHide}
              />
            )}

            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                appointments={appointments}
                groomerColorMap={groomerColorMap}
                onEventClick={onEventClick}
                onDayClick={handleMonthDayClick}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Drag overlay */}
      <DragOverlay dragState={dragState} groomerColorMap={groomerColorMap} />

      {/* Preview popover */}
      <AppointmentPreview
        appointment={previewAppointment}
        position={previewPosition}
        groomerColorMap={groomerColorMap}
      />

      {/* Fill from Waitlist Modal */}
      <AnimatePresence>
        {selectedSlot && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedSlot(null); setSlotWaitlistCount(0); }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="p-6">
                  <h3 className="font-semibold text-xl text-[#434E54] mb-4">Fill Time Slot</h3>
                  <p className="text-[#6B7280] mb-2">
                    Selected time:{' '}
                    <span className="font-semibold text-[#434E54]">
                      {selectedSlot.toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>

                  {slotWaitlistCount > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-[#EAE0D5] rounded-lg mb-4">
                      <Clock className="w-5 h-5 text-[#434E54] flex-shrink-0" />
                      <span className="text-[#434E54]">
                        <strong>{slotWaitlistCount}</strong> customer
                        {slotWaitlistCount !== 1 ? 's' : ''} on waitlist for this time
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 pt-2 border-t border-[#E5E5E5] bg-[#EAE0D5]/30 flex justify-end gap-3">
                  <AdminButton
                    variant="ghost"
                    onClick={() => {
                      setSelectedSlot(null);
                      setSlotWaitlistCount(0);
                    }}
                  >
                    Cancel
                  </AdminButton>
                  {slotWaitlistCount > 0 && (
                    <AdminButton onClick={handleFillSlot}>
                      Fill from Waitlist
                    </AdminButton>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
