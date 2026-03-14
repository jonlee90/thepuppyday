/**
 * Profile Page
 * View and edit user profile information and preferences
 */

import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { getCurrentUser } from '@/lib/supabase/server';
import { ProfileInfoEditor } from '@/components/customer/ProfileInfoEditor';
import { NotificationPreferencesEditor } from '@/components/customer/NotificationPreferencesEditor';
import { AccountActions } from '@/components/customer/AccountActions';


export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const prefs = user.preferences as Record<string, unknown> | null;
  const notifications = {
    marketing_enabled: typeof prefs?.marketing_enabled === 'boolean' ? prefs.marketing_enabled : false,
    email_appointment_reminders: typeof prefs?.email_appointment_reminders === 'boolean' ? prefs.email_appointment_reminders : true,
    sms_appointment_reminders: typeof prefs?.sms_appointment_reminders === 'boolean' ? prefs.sms_appointment_reminders : true,
    email_retention_reminders: typeof prefs?.email_retention_reminders === 'boolean' ? prefs.email_retention_reminders : false,
    sms_retention_reminders: typeof prefs?.sms_retention_reminders === 'boolean' ? prefs.sms_retention_reminders : false,
  };

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#434E54]">Profile</h1>
          <p className="text-[#434E54]/60 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <ProfileInfoEditor
              user={{
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                avatar_url: user.avatar_url,
                address: (user as any).address || null,
                city: (user as any).city || null,
                zip: (user as any).zip || null,
              }}
            />

            {/* Notification Preferences */}
            <NotificationPreferencesEditor initialPrefs={notifications} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
              <h2 className="font-bold text-[#434E54] mb-4">Your Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[#434E54]/70">Member Since</span>
                  <span className="font-semibold text-[#434E54]">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Actions + Danger Zone */}
            <AccountActions />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
