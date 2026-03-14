'use client';

import { User, Dog, Calendar, Clock, Inbox } from 'lucide-react';
import type { WaitlistEntry } from '@/types/database';

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

const TIME_PREFERENCE_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  any: 'Any Time',
};

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatTimePreference(pref: string, preferredTime?: string | null): string {
  if (preferredTime) return formatTime12h(preferredTime);
  return TIME_PREFERENCE_LABELS[pref] || pref;
}

/**
 * MatchingWaitlistList - Display matching waitlist entries for a slot
 * Shows entries sorted by priority and created date
 */
export function MatchingWaitlistList({
  matches,
  onSelect,
}: MatchingWaitlistListProps) {
  const formatDate = (dateString: string) => {
    const d = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Empty state
  if (matches.length === 0) {
    return (
      <div className="py-12 text-center">
        <Inbox className="h-16 w-16 text-[#EAE0D5] mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-[#434E54]">No matching entries</h4>
        <p className="text-[#434E54]/60 mt-2 max-w-md mx-auto">
          No waitlist entries match this slot&apos;s service and date range (±3 days).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[#434E54]/60 uppercase tracking-wider mb-3">
        Matching Waitlist Entries ({matches.length})
      </h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {matches.map((entry, index) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry.id)}
            className="w-full bg-white rounded-xl border border-[#434E54]/10 hover:border-[#D4A574] hover:shadow-md transition-all duration-200 text-left p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Priority Badge */}
                {index === 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#D4A574] text-white">
                    Highest Priority
                  </span>
                )}

                {/* Customer Info */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#434E54]/30 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-[#434E54]">
                      {entry.customer
                        ? `${entry.customer.first_name} ${entry.customer.last_name}`
                        : 'Unknown'}
                    </div>
                    <div className="text-sm text-[#434E54]/60">
                      {entry.customer?.phone || 'No phone'}
                    </div>
                  </div>
                </div>

                {/* Pet Info */}
                <div className="flex items-center gap-2">
                  <Dog className="h-4 w-4 text-[#434E54]/30 flex-shrink-0" />
                  <span className="text-sm text-[#434E54]/60">
                    {entry.pet?.name || 'Unknown'}
                  </span>
                </div>

                {/* Requested Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#434E54]/30 flex-shrink-0" />
                  <span className="text-sm text-[#434E54]/60">
                    Requested: {formatDate(entry.requested_date)}
                  </span>
                </div>

                {/* Time Preference */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#434E54]/30 flex-shrink-0" />
                  <span className="text-sm text-[#434E54]/60">
                    {formatTimePreference(entry.time_preference, (entry as { preferred_time?: string | null }).preferred_time)}
                  </span>
                </div>

                {/* Notes (if any) */}
                {entry.notes && (
                  <div className="text-sm text-[#434E54]/60 italic mt-2 pl-6">
                    &quot;{entry.notes}&quot;
                  </div>
                )}
              </div>

              {/* Select Button Arrow */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#EAE0D5] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#434E54]"
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
          </button>
        ))}
      </div>
    </div>
  );
}
