/**
 * Admin Settings Dashboard Page
 * Task 0157: Settings dashboard page structure
 * Hub page with navigation cards to different settings sections
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { SettingsDashboardClient } from '@/components/admin/settings/SettingsDashboardClient';
import type { SettingsSectionMetadata } from '@/types/settings-dashboard';

async function getSettingsMetadata(): Promise<{
  sections: SettingsSectionMetadata[];
  error: boolean;
}> {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch relevant data for status indicators
    const [settingsResult, siteContentResult, bannersResult, calendarConnectionResult] = await Promise.all([
      // Fetch key settings to determine status
      (supabase as any)
        .from('settings')
        .select('key, updated_at')
        .in('key', [
          'booking_settings',
          'loyalty_earning_rules',
          'loyalty_redemption_rules',
        ]),

      // Fetch site content to determine status
      (supabase as any)
        .from('site_content')
        .select('section, updated_at')
        .in('section', ['hero', 'seo', 'business_info']),

      // Fetch promo banners to count active banners
      (supabase as any)
        .from('promo_banners')
        .select('id, is_active')
        .eq('is_active', true),

      // Fetch calendar connection status
      (supabase as any)
        .from('calendar_connections')
        .select('is_active, last_sync_at')
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    // Build metadata for each section
    const sections: SettingsSectionMetadata[] = [
      {
        id: 'site-content',
        title: 'Site Content',
        description: 'Manage homepage content, SEO, and business information',
        href: '/admin/settings/site-content',
        icon: 'FileText',
        status: siteContentResult.data && siteContentResult.data.length > 0
          ? 'configured'
          : 'needs_attention',
        summary: siteContentResult.data
          ? `${siteContentResult.data.length} content sections configured`
          : 'No content configured',
        lastUpdated: siteContentResult.data?.[0]?.updated_at || null,
      },
      {
        id: 'banners',
        title: 'Promo Banners',
        description: 'Create and manage promotional banners',
        href: '/admin/settings/banners',
        icon: 'Image',
        status: bannersResult.data && bannersResult.data.length > 0
          ? 'configured'
          : 'not_configured',
        summary: bannersResult.data
          ? `${bannersResult.data.length} active banner${bannersResult.data.length !== 1 ? 's' : ''}`
          : 'No active banners',
        lastUpdated: null, // We'd need to fetch this separately if needed
      },
      {
        id: 'booking',
        title: 'Booking Settings',
        description: 'Configure appointment booking rules and policies',
        href: '/admin/settings/booking',
        icon: 'Calendar',
        status: settingsResult.data?.some((s) => s.key === 'booking_settings')
          ? 'configured'
          : 'needs_attention',
        summary: '24-hour cancellation policy',
        lastUpdated: settingsResult.data?.find((s) => s.key === 'booking_settings')?.updated_at || null,
      },
      {
        id: 'loyalty',
        title: 'Loyalty Program',
        description: 'Manage loyalty rewards and redemption rules',
        href: '/admin/settings/loyalty',
        icon: 'Gift',
        status: settingsResult.data?.some((s) => s.key === 'loyalty_earning_rules')
          ? 'configured'
          : 'not_configured',
        summary: 'Points earning and redemption rules',
        lastUpdated: settingsResult.data?.find((s) => s.key === 'loyalty_earning_rules')?.updated_at || null,
      },
      {
        id: 'staff',
        title: 'Staff Management',
        description: 'Manage staff accounts and permissions',
        href: '/admin/settings/staff',
        icon: 'Users',
        status: 'configured',
        summary: 'Team member access control',
        lastUpdated: null,
      },
      {
        id: 'calendar',
        title: 'Calendar Integration',
        description: 'Connect and sync with Google Calendar',
        href: '/admin/settings/calendar',
        icon: 'Calendar',
        status: calendarConnectionResult.data?.is_active
          ? 'configured'
          : 'not_configured',
        summary: calendarConnectionResult.data?.is_active
          ? 'Google Calendar connected'
          : 'Not connected',
        lastUpdated: calendarConnectionResult.data?.last_sync_at || null,
        badge: 'New',
      },
    ];

    return { sections, error: false };
  } catch (error) {
    console.error('[Settings Dashboard] Error fetching metadata:', error);
    return {
      sections: [],
      error: true,
    };
  }
}

export const metadata = {
  title: 'Settings | The Puppy Day',
  description: 'Configure system settings and preferences',
};

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();

  // Verify admin access (optional, as layout already checks)
  await requireAdmin(supabase);

  const { sections, error } = await getSettingsMetadata();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Settings</h1>
        <p className="mt-2 text-[#434E54]/60">
          Configure system settings, content, and preferences
        </p>
      </div>

      {/* Dashboard Client Component */}
      <SettingsDashboardClient sections={sections} hasError={error} />
    </div>
  );
}
