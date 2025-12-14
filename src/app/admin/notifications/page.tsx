'use client';

/**
 * Admin Notification Center Page
 * Displays history of all SMS and Email notifications sent through the system
 * Tasks 0063-0067: Modular components for filters, stats, table, detail modal, and bulk actions
 */

import { useState, useEffect } from 'react';
import { NotificationStats } from '@/components/admin/notifications/NotificationStats';
import { NotificationFilters } from '@/components/admin/notifications/NotificationFilters';
import { NotificationTable } from '@/components/admin/notifications/NotificationTable';
import { NotificationDetailModal } from '@/components/admin/notifications/NotificationDetailModal';
import { BulkActions } from '@/components/admin/notifications/BulkActions';
import type {
  NotificationWithCustomer,
  NotificationFilters as FilterValues,
  NotificationStats as StatsData,
  NotificationListResponse,
} from '@/types/notifications';

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<NotificationWithCustomer[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<FilterValues>({});

  // Detail modal
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationWithCustomer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch notifications whenever page or filters change
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (filters.channel) params.append('channel', filters.channel);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      if (filters.campaignId) params.append('campaignId', filters.campaignId);

      const response = await fetch(`/api/admin/notifications?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data: NotificationListResponse = await response.json();

      setNotifications(data.data);
      setStats(data.stats || null);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('[Notification Center] Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(newFilters: FilterValues) {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }

  function handleRowClick(notification: NotificationWithCustomer) {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  }

  function handleCloseDetailModal() {
    setSelectedNotification(null);
    setShowDetailModal(false);
  }

  async function handleResendNotification(id: string) {
    try {
      const response = await fetch(`/api/admin/notifications/${id}/resend`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resend notification');
      }

      // Refresh the notifications list
      await fetchNotifications();
      handleCloseDetailModal();
    } catch (err) {
      console.error('[Notification Center] Error resending:', err);
      throw err; // Let the modal handle the error display
    }
  }

  async function handleBulkResendFailed(): Promise<{
    totalResent: number;
    totalFailed: number;
  }> {
    try {
      const response = await fetch('/api/admin/notifications/bulk-resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: { status: 'failed' },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk resend notifications');
      }

      const data = await response.json();

      // Refresh the notifications list
      await fetchNotifications();

      return {
        totalResent: data.totalResent,
        totalFailed: data.totalFailed,
      };
    } catch (err) {
      console.error('[Notification Center] Error bulk resending:', err);
      throw err;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#434E54] mb-2">Notification Center</h1>
        <p className="text-gray-600">
          View and manage all SMS and Email notifications sent through the system
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <NotificationStats stats={stats} loading={loading} />
      </div>

      {/* Bulk Actions */}
      {stats && stats.totalFailed > 0 && (
        <div className="mb-6">
          <BulkActions failedCount={stats.totalFailed} onResendFailed={handleBulkResendFailed} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <NotificationFilters onFilterChange={handleFilterChange} initialFilters={filters} />
      </div>

      {/* Table */}
      <div className="mb-6">
        <NotificationTable
          notifications={notifications}
          loading={loading}
          error={error}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onResend={handleResendNotification}
      />
    </div>
  );
}
