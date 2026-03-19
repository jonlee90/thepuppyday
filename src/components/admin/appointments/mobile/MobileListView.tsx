'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { Search, X } from 'lucide-react';
import { MobileChipRow } from '@/components/admin/mobile/MobileChipRow';
import { MobileEmptyState } from '@/components/admin/mobile/MobileEmptyState';
import { MobileAppointmentCard } from './MobileAppointmentCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { toast } from '@/hooks/use-toast';
import type { CalendarAppointment } from '../calendar/types';

export interface MobileListViewProps {
  onAppointmentClick: (appointmentId: string) => void;
  refreshKey?: number;
}

const STATUS_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

const DATE_CHIPS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
];

function getDateRange(range: string): { dateFrom: string; dateTo: string } {
  const now = new Date();
  switch (range) {
    case 'today':
      return {
        dateFrom: format(now, 'yyyy-MM-dd'),
        dateTo: format(now, 'yyyy-MM-dd'),
      };
    case 'tomorrow': {
      const tomorrow = addDays(now, 1);
      return {
        dateFrom: format(tomorrow, 'yyyy-MM-dd'),
        dateTo: format(tomorrow, 'yyyy-MM-dd'),
      };
    }
    case 'this_week':
      return {
        dateFrom: format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        dateTo: format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      };
    case 'this_month':
      return {
        dateFrom: format(startOfMonth(now), 'yyyy-MM-dd'),
        dateTo: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    default:
      return { dateFrom: '', dateTo: '' };
  }
}

const PAGE_SIZE = 20;

export function MobileListView({ onAppointmentClick, refreshKey }: MobileListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('this_week');
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateRange]);

  const fetchAppointments = useCallback(async (pageNum: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(false);

    try {
      const { dateFrom, dateTo } = getDateRange(dateRange);
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', `${dateFrom}T00:00:00.000Z`);
      if (dateTo) params.set('dateTo', `${dateTo}T23:59:59.999Z`);

      const res = await fetch(`/api/admin/appointments?${params}`);
      const data = await res.json();

      if (res.ok && data.data) {
        setTotal(data.pagination?.total ?? data.data.length);
        if (append) {
          setAppointments((prev) => [...prev, ...data.data]);
        } else {
          setAppointments(data.data);
        }
      } else {
        throw new Error('Failed');
      }
    } catch {
      setError(true);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, statusFilter, dateRange]);

  // Initial + filter change fetch
  useEffect(() => {
    fetchAppointments(1, false);
  }, [fetchAppointments, refreshKey]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAppointments(nextPage, true);
  };

  const remaining = total - appointments.length;
  const hasMore = remaining > 0;

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#434E54]/30 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers or pets..."
          aria-label="Search appointments"
          className="w-full h-11 bg-white rounded-xl border border-[#E5E5E5] pl-10 pr-10 text-sm text-[#434E54] placeholder:text-[#434E54]/40 focus:outline-none focus:ring-2 focus:ring-[#434E54]/30"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#434E54]/40 hover:text-[#434E54] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status chips */}
      <MobileChipRow
        options={STATUS_CHIPS}
        value={statusFilter}
        onChange={(v) => { setStatusFilter(v); setPage(1); }}
      />

      {/* Date range chips */}
      <MobileChipRow
        options={DATE_CHIPS}
        value={dateRange}
        onChange={(v) => { setDateRange(v); setPage(1); }}
      />

      {/* Content */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="animate-pulse bg-[#EAE0D5]/30 rounded-xl h-20 w-full"
            />
          ))}
        </div>
      ) : error ? (
        <MobileEmptyState
          title="Failed to load appointments"
          description="Something went wrong."
          action={{ label: 'Retry', onClick: () => fetchAppointments(1, false) }}
        />
      ) : appointments.length === 0 ? (
        <MobileEmptyState
          title="No appointments found"
          description={searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters.'}
          action={searchQuery ? { label: 'Clear search', onClick: () => setSearchQuery('') } : undefined}
        />
      ) : (
        <>
          <div className="space-y-2">
            {appointments.map((apt, i) => (
              <MobileAppointmentCard
                key={apt.id}
                appointment={apt}
                onClick={onAppointmentClick}
                index={i}
              />
            ))}
          </div>

          {hasMore && (
            <AdminButton
              variant="secondary"
              className="w-full mt-2"
              isLoading={loadingMore}
              loadingText="Loading..."
              onClick={handleLoadMore}
            >
              {`Load More (${remaining} more)`}
            </AdminButton>
          )}
        </>
      )}
    </div>
  );
}
