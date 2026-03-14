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
    const d = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-[#F8EEE5] rounded-xl p-4">
      <h4 className="font-semibold text-[#434E54] mb-3">Open Slot Details</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[#D4A574] flex-shrink-0" />
          <div>
            <div className="text-sm text-[#434E54]/60">Date</div>
            <div className="font-medium text-[#434E54]">{formatDate(date)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-[#D4A574] flex-shrink-0" />
          <div>
            <div className="text-sm text-[#434E54]/60">Time</div>
            <div className="font-medium text-[#434E54]">{time}</div>
          </div>
        </div>
        <div className="pt-2 border-t border-[#434E54]/10">
          <div className="text-sm text-[#434E54]/60">Service</div>
          <div className="font-medium text-[#434E54]">{serviceName}</div>
        </div>
      </div>
    </div>
  );
}
