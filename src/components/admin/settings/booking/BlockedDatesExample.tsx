/**
 * BlockedDatesExample Component
 *
 * Example usage of BlockedDatesManager and BlockedDatesCalendar
 * demonstrating both standalone and combined layouts.
 *
 * This is a reference implementation showing different layout options.
 */

'use client';

import { useState } from 'react';
import { BlockedDatesManager } from './BlockedDatesManager';
import { BlockedDatesCalendar } from './BlockedDatesCalendar';
import { BlockedDatesSection } from './BlockedDatesSection';
import type { BlockedDate } from '@/types/settings';

/**
 * Example 1: Combined Layout (Recommended)
 *
 * Uses BlockedDatesSection for automatic integration
 */
export function BlockedDatesExample1() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BlockedDatesSection />
    </div>
  );
}

/**
 * Example 2: Custom Layout with Shared State
 *
 * Manually manage shared state for custom layouts
 */
export function BlockedDatesExample2() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isManagerLoading, setIsManagerLoading] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-[#434E54] mb-6">Blocked Dates Management</h1>

      {/* Custom 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar (takes 2 columns) */}
        <div className="lg:col-span-2 bg-[#F8EEE5] rounded-xl p-6">
          <BlockedDatesCalendar
            blockedDates={blockedDates}
            onBlockedDatesChange={setBlockedDates}
            onLoadingChange={setIsCalendarLoading}
          />
        </div>

        {/* Right: List (takes 1 column) */}
        <div className="lg:col-span-1 bg-[#F8EEE5] rounded-xl p-6">
          <BlockedDatesManager
            blockedDates={blockedDates}
            onBlockedDatesChange={setBlockedDates}
            onLoadingChange={setIsManagerLoading}
          />
        </div>
      </div>

      {/* Loading indicator */}
      {(isCalendarLoading || isManagerLoading) && (
        <div className="fixed bottom-4 right-4 bg-[#434E54] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span className="loading loading-spinner loading-sm"></span>
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Manager Only (List View)
 *
 * Use only the list view for simpler interfaces
 */
export function BlockedDatesExample3() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-[#434E54] mb-4">Manage Blocked Dates</h2>
        <p className="text-[#6B7280] mb-6">
          Block specific dates to prevent customers from booking appointments.
        </p>

        <BlockedDatesManager
          blockedDates={blockedDates}
          onBlockedDatesChange={setBlockedDates}
        />
      </div>
    </div>
  );
}

/**
 * Example 4: Calendar Only
 *
 * Use only the calendar view for visual-focused interfaces
 */
export function BlockedDatesExample4() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-[#434E54] mb-4">Booking Calendar</h2>
        <p className="text-[#6B7280] mb-6">
          Click on dates to block or unblock them for appointments.
        </p>

        <BlockedDatesCalendar
          blockedDates={blockedDates}
          onBlockedDatesChange={setBlockedDates}
        />
      </div>
    </div>
  );
}

/**
 * Example 5: Stacked Layout (Mobile-First)
 *
 * Stack components vertically for mobile-friendly design
 */
export function BlockedDatesExample5() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#434E54] mb-6">Blocked Dates</h1>

      {/* Calendar on top */}
      <div className="bg-[#F8EEE5] rounded-xl p-6 mb-6">
        <BlockedDatesCalendar
          blockedDates={blockedDates}
          onBlockedDatesChange={setBlockedDates}
        />
      </div>

      {/* List below */}
      <div className="bg-[#F8EEE5] rounded-xl p-6">
        <BlockedDatesManager
          blockedDates={blockedDates}
          onBlockedDatesChange={setBlockedDates}
        />
      </div>
    </div>
  );
}

/**
 * Example 6: With Additional Context
 *
 * Embed within a larger settings page
 */
export function BlockedDatesExample6() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  return (
    <div className="space-y-8">
      {/* Other settings sections */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-[#434E54] mb-3">Booking Window</h3>
        <p className="text-[#6B7280]">Configure advance booking and cancellation policies...</p>
      </div>

      {/* Blocked dates section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-[#434E54] mb-3">Blocked Dates</h3>
        <p className="text-[#6B7280] mb-6">
          Prevent bookings on specific dates for holidays or closures.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#F8EEE5] rounded-lg p-4">
            <BlockedDatesCalendar
              blockedDates={blockedDates}
              onBlockedDatesChange={setBlockedDates}
            />
          </div>
          <div className="bg-[#F8EEE5] rounded-lg p-4">
            <BlockedDatesManager
              blockedDates={blockedDates}
              onBlockedDatesChange={setBlockedDates}
            />
          </div>
        </div>
      </div>

      {/* Other settings sections */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-[#434E54] mb-3">Business Hours</h3>
        <p className="text-[#6B7280]">Set your operating hours for each day...</p>
      </div>
    </div>
  );
}

// Default export for standalone demo page
export default BlockedDatesExample1;
