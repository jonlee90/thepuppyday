/**
 * BookingSettingsClient
 *
 * Client wrapper that holds booking settings state and distributes
 * to child section components. Eliminates duplicate API fetches by
 * receiving settings from the server component and passing them down.
 */

'use client';

import { useState, useCallback } from 'react';
import type { BookingSettings } from '@/types/settings';
import { AdvanceBookingWindow } from './AdvanceBookingWindow';
import { CancellationPolicy } from './CancellationPolicy';
import { BufferTimeSettings } from './BufferTimeSettings';
import { BusinessHoursEditor } from './BusinessHoursEditor';
import { BlockedDatesSection } from './BlockedDatesSection';
import { RecurringBlockedDays } from './RecurringBlockedDays';
import { DefaultGroomerSetting } from './DefaultGroomerSetting';

interface BookingSettingsClientProps {
  initialSettings: BookingSettings;
}

export function BookingSettingsClient({ initialSettings }: BookingSettingsClientProps) {
  const [settings, setSettings] = useState<BookingSettings>(initialSettings);

  const handleSettingsUpdated = useCallback((updatedSettings: BookingSettings) => {
    setSettings(updatedSettings);
  }, []);

  return (
    <div className="space-y-6">
      {/* Default Groomer - uses different API, no settings prop needed */}
      <section>
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Default Groomer</h2>
        <DefaultGroomerSetting />
      </section>

      {/* Booking Hours */}
      <section>
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Booking Hours</h2>
        <BusinessHoursEditor
          initialSettings={settings}
          onSettingsUpdated={handleSettingsUpdated}
        />
      </section>

      {/* Booking Window */}
      <section>
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Booking Window</h2>
        <AdvanceBookingWindow
          initialSettings={settings}
          onSettingsUpdated={handleSettingsUpdated}
        />
      </section>

      {/* Cancellation Policy */}
      <section>
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Cancellation Policy</h2>
        <CancellationPolicy
          initialSettings={settings}
          onSettingsUpdated={handleSettingsUpdated}
        />
      </section>

      {/* Appointment Buffer */}
      <section>
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Appointment Buffer</h2>
        <BufferTimeSettings
          initialSettings={settings}
          onSettingsUpdated={handleSettingsUpdated}
        />
      </section>

      {/* Recurring Blocked Days */}
      <section>
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Recurring Blocked Days</h2>
        <RecurringBlockedDays
          initialSettings={settings}
          onSettingsUpdated={handleSettingsUpdated}
        />
      </section>

      {/* Blocked Dates - uses different API endpoint, no settings prop needed */}
      <section>
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Blocked Dates</h2>
        <BlockedDatesSection />
      </section>
    </div>
  );
}
