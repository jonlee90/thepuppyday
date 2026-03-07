/**
 * Dashboard Client Component
 * Orchestrates all dashboard widgets using the centralized useDashboardData hook.
 * No server-passed props — all data is fetched client-side.
 */

'use client';

import { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useDashboardData } from '@/hooks/admin/use-dashboard-data';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { RevenueOverview } from '@/components/admin/dashboard/RevenueOverview';
import { DashboardTimeline } from '@/components/admin/dashboard/DashboardTimeline';
import { ProductivityWidget } from '@/components/admin/dashboard/ProductivityWidget';
import { WaitlistWidget } from '@/components/admin/dashboard/WaitlistWidget';
import { PendingActionsWidget } from '@/components/admin/dashboard/PendingActionsWidget';
import { QuickAccess } from '@/components/admin/dashboard/QuickAccess';
import { BookingModal } from '@/components/booking/BookingModal';

export function DashboardClient() {
  const {
    revenue,
    appointments,
    pendingAppointments,
    loading,
    errors,
    isConnected,
    isPolling,
    refetch,
  } = useDashboardData();

  // BookingModal state — admin booking
  const [adminBookingOpen, setAdminBookingOpen] = useState(false);
  // BookingModal state — walk-in
  const [walkInOpen, setWalkInOpen] = useState(false);

  const handleStatusUpdate = () => {
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Connection Status Banners */}
      {!isConnected && isPolling && (
        <div
          role="status"
          aria-live="polite"
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3"
        >
          <WifiOff className="w-5 h-5 text-yellow-600 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Connection lost — using fallback polling
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Data will refresh every 30 seconds
            </p>
          </div>
        </div>
      )}

      {isConnected && process.env.NEXT_PUBLIC_USE_MOCKS !== 'true' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-600" aria-hidden="true" />
          <p className="text-sm text-green-800" aria-live="polite">Real-time updates active</p>
        </div>
      )}

      {/* Header */}
      <DashboardHeader
        onNewBooking={() => setAdminBookingOpen(true)}
        onWalkIn={() => setWalkInOpen(true)}
      />

      {/* Revenue Overview */}
      <RevenueOverview
        revenueData={revenue}
        loading={loading.revenue}
        error={errors.revenue}
        onRetry={refetch}
      />

      {/* Main Content Grid: Timeline (3 cols) + Sidebar (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-3">
          <DashboardTimeline
            appointments={appointments}
            loading={loading.appointments}
            error={errors.appointments}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>

        {/* Sidebar widgets */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ProductivityWidget
            appointments={appointments}
            revenueData={revenue}
            loading={loading.appointments}
          />
          <WaitlistWidget />
          <PendingActionsWidget
            pending={pendingAppointments}
            loading={loading.pending}
            error={errors.pending}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      </div>

      {/* Quick Access pills */}
      <QuickAccess />

      {/* Booking Modals */}
      <BookingModal
        mode="admin"
        isOpen={adminBookingOpen}
        onClose={() => setAdminBookingOpen(false)}
        onSuccess={() => {
          setAdminBookingOpen(false);
          refetch();
        }}
      />
      <BookingModal
        mode="walkin"
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onSuccess={() => {
          setWalkInOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
