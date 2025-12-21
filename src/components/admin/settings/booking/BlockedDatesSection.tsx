/**
 * BlockedDatesSection Component
 *
 * Combined layout integrating BlockedDatesManager and BlockedDatesCalendar
 * with shared state management.
 *
 * Layout:
 * - Desktop: Side-by-side (Calendar left, Manager right)
 * - Mobile: Stacked
 *
 * Tasks 0186 & 0187: Blocked dates management UI
 */

'use client';

import { useState, useEffect } from 'react';
import { BlockedDatesManager } from './BlockedDatesManager';
import { BlockedDatesCalendar } from './BlockedDatesCalendar';
import type { BlockedDate } from '@/types/settings';

export function BlockedDatesSection() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);
  const [isManagerLoading, setIsManagerLoading] = useState(true);

  // Fetch blocked dates on component mount
  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    setIsCalendarLoading(true);
    setIsManagerLoading(true);
    try {
      const response = await fetch('/api/admin/settings/booking/blocked-dates');
      if (!response.ok) throw new Error('Failed to fetch blocked dates');

      const data = await response.json();
      setBlockedDates(data.blocked_dates || []);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      setBlockedDates([]);
    } finally {
      setIsCalendarLoading(false);
      setIsManagerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#434E54] mb-2">Blocked Dates Management</h2>
        <p className="text-[#6B7280]">
          Manage dates when appointments cannot be booked. View in calendar or list format.
        </p>
      </div>

      {/* Combined Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Calendar View */}
        <div className="bg-[#F8EEE5] rounded-xl p-6">
          <BlockedDatesCalendar
            blockedDates={blockedDates}
            onBlockedDatesChange={setBlockedDates}
            onLoadingChange={setIsCalendarLoading}
          />
        </div>

        {/* Right: List View / Manager */}
        <div className="bg-[#F8EEE5] rounded-xl p-6">
          <BlockedDatesManager
            blockedDates={blockedDates}
            onBlockedDatesChange={setBlockedDates}
            onLoadingChange={setIsManagerLoading}
          />
        </div>
      </div>

    </div>
  );
}
