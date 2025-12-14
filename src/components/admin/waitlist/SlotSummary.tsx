'use client';

import { Calendar, Clock } from 'lucide-react';

interface SlotSummaryProps {
  date: string;
  time: string;
  serviceName: string;
}

/**
 * SlotSummary - Display summary of the open appointment slot
 * Shows date, time, and service for the slot being filled
 */
export function SlotSummary({ date, time, serviceName }: SlotSummaryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="card bg-primary/10 border border-primary/20">
      <div className="card-body p-4">
        <h4 className="font-semibold text-gray-700 mb-3">Open Slot Details</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div className="font-medium text-gray-900">{formatDate(date)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="text-sm text-gray-500">Time</div>
              <div className="font-medium text-gray-900">{time}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-500">Service</div>
            <div className="font-medium text-gray-900">{serviceName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
