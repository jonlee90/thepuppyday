/**
 * Booking Settings Page
 * Tasks 0180-0191: Complete booking configuration management
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AdvanceBookingWindow } from '@/components/admin/settings/booking/AdvanceBookingWindow';
import { CancellationPolicy } from '@/components/admin/settings/booking/CancellationPolicy';
import { BufferTimeSettings } from '@/components/admin/settings/booking/BufferTimeSettings';
import { BusinessHoursEditor } from '@/components/admin/settings/booking/BusinessHoursEditor';
import { BlockedDatesSection } from '@/components/admin/settings/booking/BlockedDatesSection';
import { RecurringBlockedDays } from '@/components/admin/settings/booking/RecurringBlockedDays';

export default async function BookingSettingsPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return (
    <div className="min-h-screen bg-[#F8EEE5] p-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="flex items-center text-sm text-[#434E54]/60">
          <Link href="/admin/settings" className="hover:text-[#434E54] transition-colors">
            Settings
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-[#434E54] font-medium">Booking Settings</span>
        </nav>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#434E54]">Booking Settings</h1>
        <p className="mt-2 text-[#434E54]/60">
          Configure appointment booking rules, policies, business hours, and blocked dates
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Booking Hours */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">Booking Hours</h2>
          <BusinessHoursEditor />
        </section>

        {/* Booking Window */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">Booking Window</h2>
          <AdvanceBookingWindow />
        </section>

        {/* Cancellation Policy */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">Cancellation Policy</h2>
          <CancellationPolicy />
        </section>

        {/* Appointment Buffer */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">Appointment Buffer</h2>
          <BufferTimeSettings />
        </section>

        {/* Recurring Blocked Days */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">Recurring Blocked Days</h2>
          <RecurringBlockedDays />
        </section>

        {/* Blocked Dates */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">Blocked Dates</h2>
          <BlockedDatesSection />
        </section>
      </div>
    </div>
  );
}
