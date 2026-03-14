'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { WaitlistFilters, type FilterValues } from './WaitlistFilters';
import { WaitlistStats } from './WaitlistStats';
import { WaitlistTable } from './WaitlistTable';
import { BookFromWaitlistModal } from './BookFromWaitlistModal';
import { EditWaitlistModal } from './EditWaitlistModal';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { WaitlistSkeleton } from '@/components/admin/skeletons/WaitlistSkeleton';
import { toast } from '@/hooks/use-toast';
import type { WaitlistEntry } from '@/types/database';

type WaitlistEntryWithJoins = WaitlistEntry & {
  customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
  pet?: { id: string; name: string };
  service?: { id: string; name: string };
};

interface WaitlistDashboardProps {
  services: Array<{ id: string; name: string }>;
}

/**
 * WaitlistDashboard - Main waitlist management dashboard
 * Integrates filters, stats, and table for admin waitlist management
 */
export function WaitlistDashboard({ services }: WaitlistDashboardProps) {
  const [entries, setEntries] = useState<WaitlistEntryWithJoins[]>([]);
  const [stats, setStats] = useState<{
    activeCount: number | string;
    filledTodayCount: number | string;
    responseRate: number | string;
    averageWaitTime: number | string;
  }>({
    activeCount: '--',
    filledTodayCount: '--',
    responseRate: '--',
    averageWaitTime: '--',
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Book modal
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntryWithJoins | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Edit modal
  const [editEntry, setEditEntry] = useState<WaitlistEntryWithJoins | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Cancel confirmation modal
  const [cancelTarget, setCancelTarget] = useState<WaitlistEntryWithJoins | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const hasFetchedRef = useRef(false);

  // Fetch waitlist entries
  const fetchEntries = useCallback(async () => {
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
    return data;
  }, [page, filters]);

  // Fetch stats from analytics API
  const fetchStats = useCallback(async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });

    const response = await fetch(`/api/admin/analytics/waitlist?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const { data } = await response.json();
    return data;
  }, []);

  // Combined initial fetch with Promise.all
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadInitial = async () => {
      setIsLoading(true);
      try {
        const [entriesData, statsData] = await Promise.all([
          fetchEntries(),
          fetchStats(),
        ]);

        setEntries(entriesData.entries || []);
        setTotal(entriesData.total || 0);

        if (statsData) {
          setStats({
            activeCount: statsData.activeCount ?? 0,
            filledTodayCount: statsData.fillRate?.filled ?? 0,
            responseRate: statsData.responseRate?.percentage ?? 0,
            averageWaitTime: statsData.avgWaitTime ?? 0,
          });
        }
      } catch (error) {
        console.error('Error loading waitlist:', error);
        toast.error('Failed to load waitlist', {
          description: 'Please try refreshing the page.',
        });
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadInitial();
  }, [fetchEntries, fetchStats]);

  // Fetch entries when filters or page change (after initial load)
  useEffect(() => {
    if (isInitialLoad) return;

    const loadEntries = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEntries();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Error fetching waitlist:', error);
        toast.error('Failed to load waitlist');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [fetchEntries, isInitialLoad]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Refresh entries after mutations
  const refreshEntries = async () => {
    try {
      const data = await fetchEntries();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch {
      // Silent fail — user already got success toast
    }
  };

  // Statuses that should block mutating actions
  const isInactiveStatus = (status: string) =>
    status === 'cancelled' || status === 'booked' || status === 'expired' || status === 'expired_offer';

  // Action handlers
  const handleBookNow = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) { toast.error('Waitlist entry not found'); return; }
    if (isInactiveStatus(entry.status)) { toast.error(`Cannot book a ${entry.status} entry`); return; }
    setSelectedEntry(entry);
    setIsBookModalOpen(true);
  };

  const handleBookingSuccess = () => {
    toast.success('Appointment booked successfully', {
      description: 'The waitlist entry has been marked as booked.',
    });
    refreshEntries();
  };

  const handleEdit = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) { toast.error('Waitlist entry not found'); return; }
    if (entry.status === 'expired' || entry.status === 'expired_offer') { toast.error('Cannot edit an expired entry'); return; }
    setEditEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    refreshEntries();
  };

  const handleContact = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry?.customer?.phone) {
      window.location.href = `tel:${entry.customer.phone}`;
    } else {
      toast.error('No phone number available');
    }
  };

  const handleCancel = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) { toast.error('Waitlist entry not found'); return; }
    if (isInactiveStatus(entry.status)) { toast.error(`Entry is already ${entry.status}`); return; }
    setCancelTarget(entry);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);

    try {
      const res = await fetch(`/api/admin/waitlist/${cancelTarget.id}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success('Waitlist entry cancelled');
      setCancelTarget(null);
      refreshEntries();
    } catch (err) {
      console.error('[WaitlistDashboard] Cancel error:', err);
      toast.error('Failed to cancel waitlist entry');
    } finally {
      setIsCancelling(false);
    }
  };

  // Show skeleton on initial load
  if (isInitialLoad && isLoading) {
    return <WaitlistSkeleton />;
  }

  const cancelCustomerName = cancelTarget?.customer
    ? `${cancelTarget.customer.first_name} ${cancelTarget.customer.last_name}`
    : 'this customer';

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

      {/* Table with loading overlay for subsequent loads */}
      <div className={`relative ${isLoading && !isInitialLoad ? 'opacity-50 pointer-events-none' : ''}`}>
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
      </div>

      {/* Book from Waitlist Modal */}
      {selectedEntry ? (
        <BookFromWaitlistModal
          entry={selectedEntry}
          isOpen={isBookModalOpen}
          onClose={() => {
            setIsBookModalOpen(false);
            setSelectedEntry(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      ) : null}

      {/* Edit Waitlist Modal */}
      {editEntry ? (
        <EditWaitlistModal
          entry={editEntry}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditEntry(null);
          }}
          onSuccess={handleEditSuccess}
          onCancelEntry={() => {
            const target = editEntry;
            setIsEditModalOpen(false);
            setEditEntry(null);
            setCancelTarget(target);
          }}
        />
      ) : null}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelTarget ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              aria-hidden="true"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                role="dialog"
                aria-modal="true"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#434E54] mb-1">Cancel Waitlist Entry</h3>
                      <p className="text-sm text-[#434E54]/60">
                        Are you sure you want to cancel the waitlist entry for{' '}
                        <strong className="text-[#434E54]">{cancelCustomerName}</strong>
                        {cancelTarget.service ? ` (${cancelTarget.service.name})` : ''}?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3 justify-end">
                  <AdminButton
                    type="button"
                    variant="ghost"
                    onClick={() => setCancelTarget(null)}
                    disabled={isCancelling}
                  >
                    Keep Entry
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="danger"
                    isLoading={isCancelling}
                    loadingText="Cancelling..."
                    onClick={confirmCancel}
                  >
                    Cancel Entry
                  </AdminButton>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
