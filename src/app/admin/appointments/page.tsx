/**
 * Admin Appointments Page
 * Toggleable calendar/list view with detail modal
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Calendar, List, Upload } from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import { AppointmentCalendar } from '@/components/admin/appointments/AppointmentCalendar';
import { AppointmentListView } from '@/components/admin/appointments/AppointmentListView';
import { AdminCreateButton } from '@/components/booking';

// Dynamic imports for heavy modal components
const AppointmentDetailModal = dynamic(
  () => import('@/components/admin/appointments/AppointmentDetailModal').then((mod) => ({ default: mod.AppointmentDetailModal })),
  { ssr: false }
);
const CSVImportModal = dynamic(
  () => import('@/components/admin/appointments/CSVImportModal').then((mod) => ({ default: mod.CSVImportModal })),
  { ssr: false }
);

export default function AppointmentsPage() {
  const { appointmentsView, setAppointmentsView } = useAdminStore();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Handle successful CSV import
  const handleImportSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <div>
        {/* Desktop Header: title + actions */}
        <div className="hidden lg:flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#434E54]">Appointments</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn bg-white text-[#434E54] hover:bg-[#FFFBF7] border border-[#E5E5E5] shadow-sm"
            >
              <Upload className="w-5 h-5 mr-2" />
              Import CSV
            </button>
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

        {/* Mobile/Tablet Toolbar: view toggle + actions in one row */}
        <div className="flex lg:hidden items-center justify-between mb-4">
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

        {/* Main Content */}
        <div key={refreshKey}>
          {appointmentsView === 'calendar' ? (
            <AppointmentCalendar onEventClick={handleAppointmentClick} />
          ) : (
            <AppointmentListView onRowClick={handleAppointmentClick} />
          )}
        </div>

        {/* Appointment Detail Modal */}
        <AppointmentDetailModal
          appointmentId={selectedAppointmentId}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onUpdate={handleAppointmentUpdate}
        />

        {/* CSV Import Modal */}
        <CSVImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={handleImportSuccess}
        />
      </div>
    </div>
  );
}
