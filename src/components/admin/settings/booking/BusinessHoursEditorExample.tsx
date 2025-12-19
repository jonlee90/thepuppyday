/**
 * Business Hours Editor Example Usage
 * Task 0184: Demo page showing integration
 */

'use client';

import { BusinessHoursEditor } from './BusinessHoursEditor';

export default function BusinessHoursEditorExample() {
  return (
    <div className="min-h-screen bg-[#F8EEE5] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#434E54] mb-2">
            Business Hours Configuration
          </h1>
          <p className="text-[#6B7280]">
            Configure your weekly schedule for customer bookings
          </p>
        </div>

        <BusinessHoursEditor />
      </div>
    </div>
  );
}
