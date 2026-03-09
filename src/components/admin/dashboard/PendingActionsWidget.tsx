/**
 * PendingActionsWidget
 * "Needs Attention" sidebar card showing up to 5 pending appointments
 * with inline confirm actions and optimistic UI.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, PawPrint } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/types/supabase';

type Appointment = Tables<'appointments'> & {
  customer?: Tables<'users'> | null;
  pet?: (Tables<'pets'> & {
    breed?: Tables<'breeds'> | null;
  }) | null;
  service?: Tables<'services'> | null;
};

interface PendingActionsWidgetProps {
  pending: Appointment[];
  loading: boolean;
  error: boolean;
  onStatusUpdate?: () => void;
}

const MAX_VISIBLE = 5;

export function PendingActionsWidget({
  pending,
  loading,
  error,
  onStatusUpdate,
}: PendingActionsWidgetProps) {
  // Local copy so we can remove entries optimistically after confirm
  const [localPending, setLocalPending] = useState<Appointment[]>(pending);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Keep local state in sync when the prop updates from outside (e.g., refetch)
  useEffect(() => {
    setLocalPending(pending);
  }, [pending]);

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/admin/appointments/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Optimistic: remove from local list
      setLocalPending((prev) => prev.filter((a) => a.id !== id));
      toast.success('Appointment confirmed');
      onStatusUpdate?.();
    } catch (err) {
      console.error('[PendingActionsWidget] confirm error:', err);
      toast.error('Failed to confirm appointment');
    } finally {
      setConfirmingId(null);
    }
  };

  const displayed = localPending.slice(0, MAX_VISIBLE);
  const hasMore = pending.length > MAX_VISIBLE; // use original count for "View All" threshold

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-[#EAE0D5] animate-pulse rounded" />
          <div className="h-5 w-6 bg-[#EAE0D5] animate-pulse rounded-full" />
        </div>
        <div className="divide-y divide-[#EAE0D5]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-32 bg-[#EAE0D5] animate-pulse rounded" />
                  <div className="h-3 w-24 bg-[#EAE0D5] animate-pulse rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-20 bg-[#EAE0D5] animate-pulse rounded" />
                  <div className="h-3 w-16 bg-[#EAE0D5] animate-pulse rounded" />
                </div>
                <div className="h-3 w-24 bg-[#EAE0D5] animate-pulse rounded mt-1" />
              </div>
              <div className="h-7 w-16 bg-[#EAE0D5] animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#434E54]">Needs Attention</h3>
        <span
          className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
          aria-live="polite"
          aria-atomic="true"
        >
          {localPending.length}
        </span>
      </div>

      {/* Error state */}
      {error && localPending.length === 0 && (
        <p className="text-sm text-[#434E54]/60 py-4 text-center">
          Failed to load pending appointments
        </p>
      )}

      {/* Empty state */}
      {!error && localPending.length === 0 && (
        <div className="flex flex-col items-center py-6 gap-2">
          <PawPrint
            className="w-10 h-10 text-[#434E54]/20"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-[#434E54]">All caught up!</p>
          <p className="text-xs text-[#434E54]/50">No appointments need attention</p>
        </div>
      )}

      {/* Entry list */}
      {displayed.length > 0 && (
        <ul className="divide-y divide-[#EAE0D5]">
          {displayed.map((appt, index) => {
            const firstName = appt.customer?.first_name ?? '';
            const lastName = appt.customer?.last_name ?? '';
            const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
            const petName = appt.pet?.name ?? '';
            const serviceName = appt.service?.name ?? '';
            const timeStr = formatTime(new Date(appt.scheduled_at));
            const isConfirming = confirmingId === appt.id;

            const scheduledDate = new Date(appt.scheduled_at);
            const apptDate = format(scheduledDate, 'EEE, MMM d');
            const createdAgo = appt.created_at
              ? formatDistanceToNow(new Date(appt.created_at), { addSuffix: true })
              : null;

            return (
              <motion.li
                key={appt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.06 }}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-0.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#434E54] truncate">{customerName}</p>
                    <p className="text-xs text-[#434E54]/60 truncate">
                      {[petName, serviceName].filter(Boolean).join(' \u00b7 ')}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#434E54]/80">{apptDate}</p>
                    <p className="text-xs text-[#434E54]/50">{timeStr}</p>
                  </div>
                  <div className="min-w-0">
                    {createdAgo ? (
                      <p className="text-xs text-[#434E54]/40">Booked {createdAgo}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={() => handleConfirm(appt.id)}
                  disabled={isConfirming}
                  className="btn btn-sm bg-[#434E54] hover:bg-[#363F44] text-white border-none flex-shrink-0 disabled:opacity-60 min-w-[88px]"
                  aria-label={`Confirm appointment for ${customerName}`}
                >
                  {isConfirming ? (
                    <span>...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" aria-hidden="true" />
                      Confirm
                    </>
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}

      {/* View All link */}
      {hasMore && (
        <Link
          href="/admin/appointments?status=pending"
          className="block text-sm text-[#434E54] hover:underline text-center pt-3 border-t border-[#EAE0D5]"
          aria-label={`View all ${pending.length} pending appointments`}
        >
          View all {pending.length} pending appointments
        </Link>
      )}
    </div>
  );
}
