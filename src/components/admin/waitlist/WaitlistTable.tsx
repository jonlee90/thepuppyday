'use client';

import { WaitlistRow } from './WaitlistRow';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import type { WaitlistEntry } from '@/types/database';

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
  onCancel: (entryId: string) => void;
}

/**
 * WaitlistTable - Sortable, paginated table of waitlist entries
 * Displays customer, pet, service, date, status, and actions
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
  onCancel,
}: WaitlistTableProps) {
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12">
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
      {/* Table */}
      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-lg">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Pet</th>
              <th>Service</th>
              <th>Requested Date</th>
              <th>Time Preference</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <WaitlistRow
                key={entry.id}
                entry={entry}
                onBookNow={onBookNow}
                onEdit={onEdit}
                onContact={onContact}
                onCancel={onCancel}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex} to {endIndex} of {total} entries
          </div>

          <div className="join">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="join-item btn btn-sm"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
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
                  className={`join-item btn btn-sm ${
                    page === pageNum ? 'btn-active' : ''
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="join-item btn btn-sm"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
