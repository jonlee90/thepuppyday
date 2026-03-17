/**
 * Booking Settings Page
 * Tasks 0180-0191: Complete booking configuration management
 *
 * Server component that fetches booking settings once and passes
 * them to the client wrapper, eliminating duplicate API requests.
 */

export const dynamic = 'force-dynamic';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { BookingSettingsClient } from '@/components/admin/settings/booking/BookingSettingsClient';
import { AdminBreadcrumb } from '@/components/admin/shared';
import { BookingSettingsSchema } from '@/types/settings';
import type { BookingSettings } from '@/types/settings';

const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  min_advance_hours: 2,
  max_advance_days: 90,
  cancellation_cutoff_hours: 24,
  buffer_minutes: 15,
  blocked_dates: [],
  recurring_blocked_days: [0],
};

export default async function BookingSettingsPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  // Fetch booking settings server-side (single query instead of 4-7 client fetches)
  let settings: BookingSettings = DEFAULT_BOOKING_SETTINGS;

  try {
    const serviceClient = createServiceRoleClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error } = (await (serviceClient as any)
      .from('settings')
      .select('value')
      .eq('key', 'booking_settings')
      .single()) as {
      data: { value: unknown } | null;
      error: Error | null;
    };

    if (!error && settingRecord) {
      const parseResult = BookingSettingsSchema.safeParse(settingRecord.value);
      if (parseResult.success) {
        settings = parseResult.data;
      }
    }
  } catch (error) {
    console.error('[BookingSettingsPage] Error fetching settings:', error);
    // Fall through to use defaults
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Booking Settings' }]} />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="hidden lg:block text-3xl font-bold text-[#434E54]">Booking Settings</h1>
        <p className="mt-2 text-[#434E54]/60">
          Configure appointment booking rules, policies, business hours, and blocked dates
        </p>
      </div>

      {/* Settings Sections - client component distributes settings */}
      <BookingSettingsClient initialSettings={settings} />
    </div>
  );
}
