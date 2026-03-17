/**
 * Blocked Dates Settings Page
 *
 * Admin page for managing blocked dates with calendar and list views.
 *
 * Tasks 0186 & 0187: Blocked dates management UI
 */

import { BlockedDatesSection } from '@/components/admin/settings/booking';

export const metadata = {
  title: 'Blocked Dates - Booking Settings | Admin',
  description: 'Manage blocked dates for appointment bookings',
};

export default function BlockedDatesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <BlockedDatesSection />
    </div>
  );
}
