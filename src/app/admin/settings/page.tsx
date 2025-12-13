/**
 * Admin Settings Page
 * Server Component that fetches settings data and passes to client components
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsClient } from './SettingsClient';

interface Setting {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

interface BusinessHours {
  monday: { is_open: boolean; open: string; close: string };
  tuesday: { is_open: boolean; open: string; close: string };
  wednesday: { is_open: boolean; open: string; close: string };
  thursday: { is_open: boolean; open: string; close: string };
  friday: { is_open: boolean; open: string; close: string };
  saturday: { is_open: boolean; open: string; close: string };
  sunday: { is_open: boolean; open: string; close: string };
}

async function getSettingsData() {
  try {
    const supabase = await createServerSupabaseClient();
    // Note: Admin access is already verified by the layout

    // Fetch all settings
    const { data: settings, error } = (await (supabase as any)
      .from('settings')
      .select('*')) as {
      data: Setting[] | null;
      error: Error | null;
    };

    if (error) {
      console.error('[Settings Page] Error fetching settings:', error);
      return {
        businessHours: null,
      };
    }

    // Extract business hours from settings
    const businessHoursSetting = settings?.find((s) => s.key === 'business_hours');
    const businessHours: BusinessHours | null = businessHoursSetting?.value || null;

    return {
      businessHours,
    };
  } catch (error) {
    console.error('[Settings Page] Error loading data:', error);
    return {
      businessHours: null,
    };
  }
}

export default async function SettingsPage() {
  const { businessHours } = await getSettingsData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#434E54]">Settings</h1>
        <p className="text-[#6B7280] mt-1">
          Configure business hours and system preferences
        </p>
      </div>

      {/* Settings Client Component */}
      <SettingsClient initialBusinessHours={businessHours} />
    </div>
  );
}
