'use client';

import { useState, useEffect, useCallback } from 'react';
import { WaitlistFilters, type FilterValues } from './WaitlistFilters';
import { WaitlistStats } from './WaitlistStats';
import { WaitlistTable } from './WaitlistTable';
import { toast } from '@/hooks/use-toast';
import type { WaitlistEntry } from '@/types/database';

interface WaitlistDashboardProps {
  services: Array<{ id: string; name: string }>;
}

/**
 * WaitlistDashboard - Main waitlist management dashboard
 * Integrates filters, stats, and table for admin waitlist management
 */
export function WaitlistDashboard({ services }: WaitlistDashboardProps) {
  const [entries, setEntries] = useState<
    Array<
      WaitlistEntry & {
        customer?: { id: string; full_name: string; email: string; phone: string };
        pet?: { id: string; name: string };
        service?: { id: string; name: string };
      }
    >
  >([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    filledTodayCount: 0,
    responseRate: 0,
    averageWaitTime: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({
    status: [],
    service_id: '',
    start_date: '',
    end_date: '',
    search: '',
    sort_by: 'requested_date',
    sort_order: 'asc',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch waitlist entries
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      });

      if (filters.status.length > 0) {
        params.set('status', filters.status.join(','));
      }
      if (filters.service_id) {
        params.set('service_id', filters.service_id);
      }
      if (filters.start_date) {
        params.set('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.set('end_date', filters.end_date);
      }
      if (filters.search) {
        params.set('search', filters.search);
      }

      const response = await fetch(`/api/admin/waitlist?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch waitlist');
      }

      const data = await response.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast.error('Failed to load waitlist', {
        description: 'Please try refreshing the page.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  // Fetch stats (placeholder - would need separate API endpoint in production)
  const fetchStats = useCallback(async () => {
    try {
      // For now, calculate basic stats from current entries
      // In production, this should be a separate API endpoint
      const activeCount = entries.filter((e) => e.status === 'active').length;
      const bookedToday = entries.filter(
        (e) =>
          e.status === 'booked' &&
          e.created_at &&
          new Date(e.created_at).toDateString() === new Date().toDateString()
      ).length;

      setStats({
        activeCount,
        filledTodayCount: bookedToday,
        responseRate: 75, // Placeholder - would need separate API calculation
        averageWaitTime: 3, // Placeholder - would need separate API calculation
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  }, [entries]);

  // Fetch data when filters or page change
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Update stats when entries change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Action handlers
  const handleBookNow = (entryId: string) => {
    toast.info('Book Now feature', {
      description: 'This feature will be implemented in a future update.',
    });
  };

  const handleEdit = (entryId: string) => {
    toast.info('Edit feature', {
      description: 'This feature will be implemented in a future update.',
    });
  };

  const handleContact = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry?.customer?.phone) {
      window.location.href = `tel:${entry.customer.phone}`;
    } else {
      toast.error('No phone number available');
    }
  };

  const handleCancel = async (entryId: string) => {
    if (!confirm('Are you sure you want to cancel this waitlist entry?')) {
      return;
    }

    toast.info('Cancel feature', {
      description: 'This feature will be implemented in a future update.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <WaitlistStats
        activeCount={stats.activeCount}
        filledTodayCount={stats.filledTodayCount}
        responseRate={stats.responseRate}
        averageWaitTime={stats.averageWaitTime}
      />

      {/* Filters */}
      <WaitlistFilters onFilterChange={handleFilterChange} services={services} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <WaitlistTable
          entries={entries}
          total={total}
          page={page}
          limit={25}
          onPageChange={handlePageChange}
          onBookNow={handleBookNow}
          onEdit={handleEdit}
          onContact={handleContact}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
