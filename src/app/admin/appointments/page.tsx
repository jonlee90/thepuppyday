/**
 * Admin Appointments Page
 * Toggleable calendar/list view with detail modal
 * Mobile (< 768px): Agenda/List with cards + FAB
 * Desktop (>= 768px): Calendar swimlane / Table list
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Calendar, CalendarDays, List, Plus } from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import { useIsMobile } from '@/lib/utils/breakpoints';
import { AppointmentCalendar } from '@/components/admin/appointments/AppointmentCalendar';
import { AppointmentListView } from '@/components/admin/appointments/AppointmentListView';
import { AdminCreateButton } from '@/components/booking';

// Dynamic imports for heavy modal components
const AppointmentDetailModal = dynamic(
  () => import('@/components/admin/appointments/AppointmentDetailModal').then((mod) => ({ default: mod.AppointmentDetailModal })),
  { ssr: false }
);

// Mobile-only dynamic imports (ssr: false — desktop users never download these)
const MobileAgendaView = dynamic(
  () => import('@/components/admin/appointments/mobile/MobileAgendaView').then((mod) => ({ default: mod.MobileAgendaView })),
  { ssr: false }
);
const MobileListView = dynamic(
  () => import('@/components/admin/appointments/mobile/MobileListView').then((mod) => ({ default: mod.MobileListView })),
  { ssr: false }
);
const MobileFAB = dynamic(
  () => import('@/components/admin/mobile/MobileFAB').then((mod) => ({ default: mod.MobileFAB })),
  { ssr: false }
);
const MobileSegmentedControl = dynamic(
  () => import('@/components/admin/mobile/MobileSegmentedControl').then((mod) => ({ default: mod.MobileSegmentedControl })),
  { ssr: false }
);
const BookingModal = dynamic(
  () => import('@/components/booking/BookingModal').then((mod) => ({ default: mod.BookingModal })),
  { ssr: false }
);

export default function AppointmentsPage() {
  const { appointmentsView, setAppointmentsView } = useAdminStore();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Handle appointment click from either view
  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAppointmentId(null);
  };

  // Handle appointment update (refresh views)
  const handleAppointmentUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        {/* Desktop Header: title + actions */}
        <div className="hidden lg:flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#434E54]">Appointments</h1>
          <div className="flex gap-3">
            <AdminCreateButton
              onSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
          </div>
        </div>

        {/* Desktop View Toggle */}
        <div className="hidden lg:flex gap-2 mb-6">
          <button
            onClick={() => setAppointmentsView('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              appointmentsView === 'calendar'
                ? 'bg-[#434E54] text-white shadow-md'
                : 'bg-white text-[#434E54] hover:bg-[#FFFBF7] border border-[#E5E5E5]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Calendar
          </button>
          <button
            onClick={() => setAppointmentsView('list')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              appointmentsView === 'list'
                ? 'bg-[#434E54] text-white shadow-md'
                : 'bg-white text-[#434E54] hover:bg-[#FFFBF7] border border-[#E5E5E5]'
            }`}
          >
            <List className="w-5 h-5" />
            List
          </button>
        </div>

        {/* Mobile/Tablet Toolbar (768px–1023px): keep existing pattern for tablets */}
        <div className="hidden md:flex lg:hidden items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setAppointmentsView('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                appointmentsView === 'calendar'
                  ? 'bg-[#434E54] text-white shadow-md'
                  : 'bg-white text-[#434E54] hover:bg-[#FFFBF7] border border-[#E5E5E5]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setAppointmentsView('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                appointmentsView === 'list'
                  ? 'bg-[#434E54] text-white shadow-md'
                  : 'bg-white text-[#434E54] hover:bg-[#FFFBF7] border border-[#E5E5E5]'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
          <div className="flex items-center gap-2">
            <AdminCreateButton
              onSuccess={() => setRefreshKey((prev) => prev + 1)}
              className="px-3 py-2 text-sm rounded-lg"
            />
          </div>
        </div>

        {/* Mobile View (< 768px) — separate components, dynamically imported */}
        {isMobile && (
          <div className="space-y-3 -mx-6 -mt-4">
            {/* Segmented control */}
            <div className="px-4">
              <MobileSegmentedControl
                options={[
                  { value: 'calendar', label: 'Agenda', icon: <CalendarDays className="w-4 h-4" /> },
                  { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
                ]}
                value={appointmentsView}
                onChange={(v) => setAppointmentsView(v as 'calendar' | 'list')}
              />
            </div>

            {/* Agenda or List */}
            {appointmentsView === 'calendar' ? (
              <MobileAgendaView
                onAppointmentClick={handleAppointmentClick}
                refreshKey={refreshKey}
              />
            ) : (
              <MobileListView
                onAppointmentClick={handleAppointmentClick}
                refreshKey={refreshKey}
              />
            )}
          </div>
        )}

        {/* Desktop / Tablet Main Content — unchanged */}
        {!isMobile && (
          <div key={refreshKey}>
            {appointmentsView === 'calendar' ? (
              <AppointmentCalendar onEventClick={handleAppointmentClick} />
            ) : (
              <AppointmentListView onRowClick={handleAppointmentClick} />
            )}
          </div>
        )}

        {/* FAB — mobile only */}
        {isMobile && (
          <MobileFAB
            icon={<Plus className="w-6 h-6" />}
            label="Create appointment"
            onClick={() => setIsBookingModalOpen(true)}
          />
        )}

        {/* Appointment Detail Modal */}
        <AppointmentDetailModal
          appointmentId={selectedAppointmentId}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onUpdate={handleAppointmentUpdate}
        />

        {/* Booking Modal (FAB) */}
        {isBookingModalOpen && (
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            mode="admin"
            onSuccess={() => {
              setIsBookingModalOpen(false);
              setRefreshKey((prev) => prev + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
