/**
 * RecurringBlockedDays Component Example
 *
 * Demonstrates usage of the RecurringBlockedDays component
 * for configuring recurring blocked days in booking settings.
 *
 * Task 0188: Recurring blocked days configuration
 */

'use client';

import { useState } from 'react';
import { RecurringBlockedDays } from './RecurringBlockedDays';

export function RecurringBlockedDaysExample() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#434E54] mb-2">
          Recurring Blocked Days Example
        </h1>
        <p className="text-[#6B7280]">
          Configure which days of the week should be blocked for all future bookings.
        </p>
      </div>

      {/* Component */}
      <RecurringBlockedDays
        onLoadingChange={handleLoadingChange}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-sm text-blue-600"></span>
            <span className="text-sm text-blue-900">Loading...</span>
          </div>
        </div>
      )}

      {/* Usage Guide */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#434E54] mb-4">Usage Guide</h2>
        <div className="prose prose-sm max-w-none text-[#6B7280]">
          <h3 className="text-[#434E54] font-semibold">Features:</h3>
          <ul>
            <li>
              <strong>Day Toggles:</strong> Click toggles to enable/disable recurring blocks for
              each day of the week
            </li>
            <li>
              <strong>Business Hours Integration:</strong> Shows which days are already marked as
              closed in business hours
            </li>
            <li>
              <strong>Quick Action:</strong> Block all closed days from business hours with one
              click
            </li>
            <li>
              <strong>Affected Dates Preview:</strong> See the next 4 occurrences of each blocked
              day
            </li>
            <li>
              <strong>Appointment Conflicts:</strong> Warns if enabling a block affects existing
              appointments
            </li>
            <li>
              <strong>Unsaved Changes:</strong> Clear indicator when changes haven&apos;t been saved
            </li>
          </ul>

          <h3 className="text-[#434E54] font-semibold mt-6">Integration:</h3>
          <pre className="bg-[#F8EEE5] p-4 rounded-lg text-xs overflow-auto">
{`import { RecurringBlockedDays } from '@/components/admin/settings/booking';

// Component fetches its own settings from the API
<RecurringBlockedDays
  onLoadingChange={(loading) => {
    // Optional: handle loading state
    setIsLoading(loading);
  }}
/>`}
          </pre>

          <h3 className="text-[#434E54] font-semibold mt-6">Data Structure:</h3>
          <p>
            The <code>recurring_blocked_days</code> field is an array of day indices where:
          </p>
          <ul>
            <li>0 = Sunday</li>
            <li>1 = Monday</li>
            <li>2 = Tuesday</li>
            <li>3 = Wednesday</li>
            <li>4 = Thursday</li>
            <li>5 = Friday</li>
            <li>6 = Saturday</li>
          </ul>
          <p>Example: <code>[0, 6]</code> blocks all Sundays and Saturdays.</p>
        </div>
      </div>
    </div>
  );
}
