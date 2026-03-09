/**
 * Dashboard Client Component
 * Orchestrates all dashboard widgets using the centralized useDashboardData hook.
 * No server-passed props — all data is fetched client-side.
 */

'use client';

import { useState } from 'react';
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
      {/* Header */}
      <DashboardHeader
        onNewBooking={() => setAdminBookingOpen(true)}
        onWalkIn={() => setWalkInOpen(true)}
        isConnected={isConnected}
        isPolling={isPolling}
      />

      {/* Revenue Overview */}
      <RevenueOverview
        revenueData={revenue}
        loading={loading.revenue}
        error={errors.revenue}
        onRetry={refetch}
      />

      {/* Needs Attention — full width, below revenue */}
      <PendingActionsWidget
        pending={pendingAppointments}
        loading={loading.pending}
        error={errors.pending}
        onStatusUpdate={handleStatusUpdate}
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
