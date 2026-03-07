/**
 * Admin Appointments Page
 * Toggleable calendar/list view with detail modal
 */

'use client';

import { useState } from 'react';
import { Calendar, List, Upload } from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import { AppointmentCalendar } from '@/components/admin/appointments/AppointmentCalendar';
import { AppointmentListView } from '@/components/admin/appointments/AppointmentListView';
import { AppointmentDetailModal } from '@/components/admin/appointments/AppointmentDetailModal';
import { CSVImportModal } from '@/components/admin/appointments/CSVImportModal';
import { AdminCreateButton } from '@/components/booking';

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
        {/* Desktop Header */}
        <div className="hidden lg:flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#434E54] mb-2">Appointments</h1>
          </div>
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
            Calendar View
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
            List View
          </button>
        </div>

        {/* Mobile Toolbar - Single consolidated row */}
        <div className="flex lg:hidden items-center justify-between mb-4">
          {/* Left: View Toggle - segmented control */}
          <div className="flex bg-white rounded-lg border border-[#E5E5E5] shadow-sm p-1">
            <button
              onClick={() => setAppointmentsView('calendar')}
              className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                appointmentsView === 'calendar'
                  ? 'bg-[#434E54] text-white shadow-sm'
                  : 'text-[#434E54] hover:bg-[#F8EEE5]'
              }`}
              aria-label="Calendar view"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAppointmentsView('list')}
              className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                appointmentsView === 'list'
                  ? 'bg-[#434E54] text-white shadow-sm'
                  : 'text-[#434E54] hover:bg-[#F8EEE5]'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white text-[#434E54] hover:bg-[#FFFBF7] border border-[#E5E5E5] shadow-sm transition-colors"
              aria-label="Import CSV"
            >
              <Upload className="w-4 h-4" />
            </button>
            <AdminCreateButton
              onSuccess={() => setRefreshKey((prev) => prev + 1)}
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
