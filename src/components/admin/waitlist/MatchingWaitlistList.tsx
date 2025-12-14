'use client';

import { User, Dog, Calendar, Clock, Inbox } from 'lucide-react';
import type { WaitlistEntry, TimePreference } from '@/types/database';

interface MatchingWaitlistListProps {
  matches: Array<
    WaitlistEntry & {
      customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
      pet?: { id: string; name: string };
      service?: { id: string; name: string };
    }
  >;
  onSelect: (entryId: string) => void;
}

const TIME_PREFERENCE_LABELS: Record<TimePreference, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  any: 'Any Time',
};

/**
 * MatchingWaitlistList - Display matching waitlist entries for a slot
 * Shows entries sorted by priority and created date
 */
export function MatchingWaitlistList({
  matches,
  onSelect,
}: MatchingWaitlistListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Empty state
  if (matches.length === 0) {
    return (
      <div className="py-12 text-center">
        <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-gray-700">No matching entries</h4>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          No waitlist entries match this slot&apos;s service and date range (±3 days).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-700">
        Matching Waitlist Entries ({matches.length})
      </h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {matches.map((entry, index) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry.id)}
            className="w-full card bg-base-100 border border-base-300 hover:border-primary hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="card-body p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Priority Badge */}
                  {index === 0 && (
                    <span className="badge badge-primary badge-sm">
                      Highest Priority
                    </span>
                  )}

                  {/* Customer Info */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {entry.customer
                          ? `${entry.customer.first_name} ${entry.customer.last_name}`
                          : 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.customer?.phone || 'No phone'}
                      </div>
                    </div>
                  </div>

                  {/* Pet Info */}
                  <div className="flex items-center gap-2">
                    <Dog className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {entry.pet?.name || 'Unknown'}
                    </span>
                  </div>

                  {/* Requested Date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Requested: {formatDate(entry.requested_date)}
                    </span>
                  </div>

                  {/* Time Preference */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {TIME_PREFERENCE_LABELS[entry.time_preference]}
                    </span>
                  </div>

                  {/* Notes (if any) */}
                  {entry.notes && (
                    <div className="text-sm text-gray-600 italic mt-2 pl-6">
                      &quot;{entry.notes}&quot;
                    </div>
                  )}
                </div>

                {/* Select Button Arrow */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
