'use client';

import { WaitlistRow } from './WaitlistRow';
import { ChevronLeft, ChevronRight, Calendar, Phone } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { formatTime12h } from '@/lib/utils/time';
import type { WaitlistEntry, WaitlistStatus } from '@/types/database';

interface WaitlistTableProps {
  entries: Array<
    WaitlistEntry & {
      customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
      pet?: { id: string; name: string };
      service?: { id: string; name: string };
    }
  >;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onBookNow: (entryId: string) => void;
  onEdit: (entryId: string) => void;
  onContact: (entryId: string) => void;
}

const STATUS_STYLES: Record<WaitlistStatus, string> = {
  active: 'bg-blue-50 text-blue-700 border border-blue-100',
  notified: 'bg-amber-50 text-amber-700 border border-amber-100',
  booked: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  expired: 'bg-gray-100 text-gray-500 border border-gray-200',
  expired_offer: 'bg-gray-100 text-gray-500 border border-gray-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-100',
};

const STATUS_LABELS: Record<WaitlistStatus, string> = {
  active: 'Active',
  notified: 'Notified',
  booked: 'Booked',
  expired: 'Expired',
  expired_offer: 'Expired Offer',
  cancelled: 'Cancelled',
};

const TIME_PREFERENCE_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  any: 'Any Time',
};


function formatTimePreference(pref: string, preferredTime?: string | null): string {
  if (preferredTime) return formatTime12h(preferredTime);
  return TIME_PREFERENCE_LABELS[pref] || pref;
}

/**
 * WaitlistTable - Sortable, paginated table of waitlist entries
 * Desktop: full table | Mobile: card layout
 */
export function WaitlistTable({
  entries,
  total,
  page,
  limit,
  onPageChange,
  onBookNow,
  onEdit,
  onContact,
}: WaitlistTableProps) {
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  const formatDate = (dateString: string) => {
    const d = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const d = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12">
        <EmptyState
          icon="calendar"
          title="No waitlist entries"
          description="Waitlist entries will appear here when customers request dates that are fully booked."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-hidden bg-white rounded-xl shadow-sm">
        <table className="table w-full">
          <thead className="bg-[#EAE0D5]">
            <tr>
              <th className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/70 px-4 py-3">Customer</th>
              <th className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/70 px-4 py-3">Pet</th>
              <th className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/70 px-4 py-3">Service</th>
              <th className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/70 px-4 py-3">Requested Date</th>
              <th className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/70 px-4 py-3">Time Preference</th>
              <th className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/70 px-4 py-3">Status</th>
              <th className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/70 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <WaitlistRow
                key={entry.id}
                entry={entry}
                onBookNow={onBookNow}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-3">
        {entries.map((entry) => {
          const customerName = entry.customer
            ? `${entry.customer.first_name} ${entry.customer.last_name}`
            : 'Unknown';

          return (
            <div key={entry.id} className="rounded-xl bg-white shadow-sm p-4 border border-[#434E54]/5">
              {/* Header: Customer + Status */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-[#434E54]">{customerName}</p>
                  <p className="text-sm text-[#434E54]/60">{entry.pet?.name || 'Unknown pet'}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[entry.status]}`}>
                  {STATUS_LABELS[entry.status]}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <p className="text-[#434E54]/40 text-xs">Service</p>
                  <p className="text-[#434E54]">{entry.service?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[#434E54]/40 text-xs">Requested Date</p>
                  <p className={isToday(entry.requested_date) ? 'font-semibold text-emerald-600' : 'text-[#434E54]'}>
                    {isToday(entry.requested_date) ? 'Today' : formatDate(entry.requested_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[#434E54]/40 text-xs">Time Preference</p>
                  <p className="text-[#434E54]">{formatTimePreference(entry.time_preference, (entry as { preferred_time?: string | null }).preferred_time)}</p>
                </div>
                {entry.notes ? (
                  <div>
                    <p className="text-[#434E54]/40 text-xs">Notes</p>
                    <p className="text-[#434E54] truncate">{entry.notes}</p>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={() => onBookNow(entry.id)}
                  className="flex-1"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Book Now
                </AdminButton>
                {entry.customer?.phone ? (
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onContact(entry.id)}
                    className="flex-1"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Contact
                  </AdminButton>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#434E54]/50">
            Showing {startIndex} to {endIndex} of {total} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-[#434E54]/20 hover:bg-[#EAE0D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4 text-[#434E54]" />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-[#434E54] text-white'
                      : 'border border-[#434E54]/20 text-[#434E54]/70 hover:bg-[#EAE0D5]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-[#434E54]/20 hover:bg-[#EAE0D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4 text-[#434E54]" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
