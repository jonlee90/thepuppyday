/**
 * Customer portal layout — Server Component
 * Fetches user and loyalty program status server-side, passes to client wrapper.
 */

import { createServiceRoleClient, getCurrentUser } from '@/lib/supabase/server';
import { getLoyaltySettings } from '@/lib/admin/loyalty-settings';
import { CustomerLayoutClient } from '@/components/customer/CustomerLayoutClient';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, loyaltySettings] = await Promise.all([
    getCurrentUser(),
    getLoyaltySettings(createServiceRoleClient()),
  ]);

  return (
    <CustomerLayoutClient
      user={{
        firstName: userData?.first_name || 'Guest',
        lastName: userData?.last_name || 'User',
        email: userData?.email || '',
        avatarUrl: userData?.avatar_url,
      }}
      loyaltyEnabled={loyaltySettings.program.is_enabled}
    >
      {children}
    </CustomerLayoutClient>
  );
}
