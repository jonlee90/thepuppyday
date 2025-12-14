'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { WaitlistActionMenu } from './WaitlistActionMenu';
import type { WaitlistEntry, WaitlistStatus, TimePreference } from '@/types/database';

interface WaitlistRowProps {
  entry: WaitlistEntry & {
    customer?: { id: string; full_name: string; email: string; phone: string };
    pet?: { id: string; name: string };
    service?: { id: string; name: string };
  };
  onBookNow: (entryId: string) => void;
  onEdit: (entryId: string) => void;
  onContact: (entryId: string) => void;
  onCancel: (entryId: string) => void;
}

const STATUS_STYLES: Record<WaitlistStatus, string> = {
  active: 'badge-info',
  notified: 'badge-warning',
  booked: 'badge-success',
  expired: 'badge-ghost',
  cancelled: 'badge-error',
};

const TIME_PREFERENCE_LABELS: Record<TimePreference, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  any: 'Any Time',
};

/**
 * WaitlistRow - Individual waitlist table row with expandable details
 * Displays customer, pet, service, date, and actions
 */
export function WaitlistRow({
  entry,
  onBookNow,
  onEdit,
  onContact,
  onCancel,
}: WaitlistRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Main Row */}
      <tr
        className="hover:bg-base-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
            <div>
              <div className="font-medium">{entry.customer?.full_name || 'Unknown'}</div>
              <div className="text-sm text-gray-500">{entry.customer?.phone || ''}</div>
            </div>
          </div>
        </td>
        <td>
          <span className="font-medium">{entry.pet?.name || 'Unknown'}</span>
        </td>
        <td>{entry.service?.name || 'Unknown'}</td>
        <td>{formatDate(entry.requested_date)}</td>
        <td>
          <span className="badge badge-outline">
            {TIME_PREFERENCE_LABELS[entry.time_preference]}
          </span>
        </td>
        <td>
          <span className={`badge ${STATUS_STYLES[entry.status]}`}>
            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
          </span>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <WaitlistActionMenu
            entryId={entry.id}
            onBookNow={onBookNow}
            onEdit={onEdit}
            onContact={onContact}
            onCancel={onCancel}
          />
        </td>
      </tr>

      {/* Expanded Details Row */}
      {isExpanded && (
        <tr className="bg-base-50">
          <td colSpan={7} className="py-4 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Email:</span>{' '}
                <span className="text-gray-600">{entry.customer?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Added:</span>{' '}
                <span className="text-gray-600">{formatDate(entry.created_at)}</span>
              </div>
              {entry.notified_at && (
                <div>
                  <span className="font-medium text-gray-700">Notified:</span>{' '}
                  <span className="text-gray-600">{formatDate(entry.notified_at)}</span>
                </div>
              )}
              {entry.notes && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Notes:</span>{' '}
                  <p className="text-gray-600 mt-1">{entry.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
