/**
 * Profile Page
 * View and edit user profile information and preferences
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Get user info from session
async function getUserInfo() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: userData } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return userData;
}

export default async function ProfilePage() {
  const user = await getUserInfo();

  if (!user) {
    return null;
  }

  // Default notification preferences
  const notifications = user.preferences?.notifications || {
    email_appointment_reminders: true,
    email_promotional: false,
    email_report_cards: true,
    sms_appointment_reminders: true,
    sms_promotional: false,
    sms_report_cards: false,
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
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#434E54]/10 flex items-center justify-between">
                <h2 className="font-bold text-[#434E54]">Personal Information</h2>
                <button className="text-sm font-medium text-[#434E54]/70 hover:text-[#434E54] transition-colors">
                  Edit
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-[#EAE0D5] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.first_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-[#434E54]">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">First Name</p>
                      <p className="font-semibold text-[#434E54]">{user.first_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Last Name</p>
                      <p className="font-semibold text-[#434E54]">{user.last_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Email</p>
                      <p className="font-semibold text-[#434E54]">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Phone</p>
                      <p className="font-semibold text-[#434E54]">{user.phone || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#434E54]/10">
                <h2 className="font-bold text-[#434E54]">Notification Preferences</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Email notifications */}
                <div>
                  <h3 className="font-semibold text-[#434E54] mb-3">Email Notifications</h3>
                  <div className="space-y-3">
                    <NotificationToggle
                      label="Appointment Reminders"
                      description="Get reminders before your appointments"
                      enabled={notifications.email_appointment_reminders}
                    />
                    <NotificationToggle
                      label="Report Cards"
                      description="Receive report cards after grooming sessions"
                      enabled={notifications.email_report_cards}
                    />
                    <NotificationToggle
                      label="Promotions & Offers"
                      description="Receive special offers and promotions"
                      enabled={notifications.email_promotional}
                    />
                  </div>
                </div>

                {/* SMS notifications */}
                <div className="pt-6 border-t border-[#434E54]/10">
                  <h3 className="font-semibold text-[#434E54] mb-3">SMS Notifications</h3>
                  <div className="space-y-3">
                    <NotificationToggle
                      label="Appointment Reminders"
                      description="Get text reminders before appointments"
                      enabled={notifications.sms_appointment_reminders}
                    />
                    <NotificationToggle
                      label="Report Cards"
                      description="Receive report card notifications"
                      enabled={notifications.sms_report_cards}
                    />
                    <NotificationToggle
                      label="Promotions & Offers"
                      description="Receive special offers via text"
                      enabled={notifications.sms_promotional}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
              <h2 className="font-bold text-[#434E54] mb-4">Account</h2>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-lg text-[#434E54]
                                 hover:bg-[#EAE0D5]/30 transition-colors flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#434E54]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  Change Password
                </button>
                <Link
                  href="/membership"
                  className="w-full text-left px-4 py-3 rounded-lg text-[#434E54]
                           hover:bg-[#EAE0D5]/30 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-[#434E54]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Membership
                </Link>
              </div>
            </div>

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

            {/* Danger Zone */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden p-6">
              <h2 className="font-bold text-red-600 mb-4">Danger Zone</h2>
              <button className="w-full text-center px-4 py-2.5 rounded-lg
                               border border-red-200 text-red-600 text-sm font-medium
                               hover:bg-red-50 transition-colors">
                Delete Account
              </button>
              <p className="text-xs text-[#434E54]/50 mt-3">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

// Notification Toggle Component (read-only for now)
function NotificationToggle({
  label,
  description,
  enabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-[#434E54]">{label}</p>
        <p className="text-sm text-[#434E54]/60">{description}</p>
      </div>
      <div
        className={`
          w-11 h-6 rounded-full transition-colors cursor-pointer relative
          ${enabled ? 'bg-[#434E54]' : 'bg-[#434E54]/20'}
        `}
      >
        <div
          className={`
            absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
            ${enabled ? 'left-6' : 'left-1'}
          `}
        />
      </div>
    </div>
  );
}
