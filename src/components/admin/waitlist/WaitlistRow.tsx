'use client';

import { Calendar } from 'lucide-react';
import type { WaitlistEntry, WaitlistStatus } from '@/types/database';

interface WaitlistRowProps {
  entry: WaitlistEntry & {
    customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
    pet?: { id: string; name: string };
    service?: { id: string; name: string };
  };
  onBookNow: (entryId: string) => void;
  onEdit: (entryId: string) => void;
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

const INACTIVE_STATUSES = new Set<WaitlistStatus>(['cancelled', 'booked', 'expired', 'expired_offer']);

export function WaitlistRow({ entry, onBookNow, onEdit }: WaitlistRowProps) {
  const isInactive = INACTIVE_STATUSES.has(entry.status);
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
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  return (
    <tr
      className="hover:bg-[#F8EEE5]/50 cursor-pointer border-b border-[#434E54]/5 transition-colors"
      onClick={() => onEdit(entry.id)}
    >
      <td className="px-4 py-3">
        <div className="font-medium text-[#434E54]">
          {entry.customer
            ? `${entry.customer.first_name} ${entry.customer.last_name}`
            : 'Unknown'}
        </div>
        <div className="text-sm text-[#434E54]/60">{entry.customer?.phone || ''}</div>
      </td>
      <td className="px-4 py-3">
        <span className="font-medium text-[#434E54]">{entry.pet?.name || 'Unknown'}</span>
      </td>
      <td className="px-4 py-3 text-[#434E54]">{entry.service?.name || 'Unknown'}</td>
      <td className="px-4 py-3 text-[#434E54]">
        {isToday(entry.requested_date) ? (
          <span className="font-semibold text-emerald-600">Today</span>
        ) : (
          formatDate(entry.requested_date)
        )}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#EAE0D5] text-[#434E54]">
          {formatTimePreference(
            entry.time_preference,
            (entry as { preferred_time?: string | null }).preferred_time,
          )}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[entry.status]}`}
        >
          {STATUS_LABELS[entry.status]}
        </span>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onBookNow(entry.id)}
          disabled={isInactive}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isInactive
              ? 'bg-[#EAE0D5] text-[#434E54]/30 cursor-not-allowed'
              : 'bg-[#434E54] hover:bg-[#363F44] text-white'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Book Now
        </button>
      </td>
    </tr>
  );
}
