'use client';

/**
 * Admin Notification Settings Page
 * Configure notification channels and delivery settings for each notification type
 */

import { useEffect, useState } from 'react';
import { NotificationSettingCard } from './components/NotificationSettingCard';
import { ToastContainer, type ToastItem } from './components/Toast';
import { getNotificationTypeLabel } from './utils';
import type { NotificationSettingsRow } from '@/lib/notifications/database-types';

interface SettingsResponse {
  settings: NotificationSettingsRow[];
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettingsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/notifications/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
      }

      const data: SettingsResponse = await response.json();
      setSettings(data.settings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = async (
    notificationType: string,
    channel: 'email' | 'sms',
    enabled: boolean
  ) => {
    try {
      const channelField = channel === 'email' ? 'email_enabled' : 'sms_enabled';

      const response = await fetch(`/api/admin/notifications/settings/${notificationType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [channelField]: enabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const { settings: updatedSetting }: { settings: NotificationSettingsRow } =
        await response.json();

      // Update local state
      setSettings((prev) =>
        prev.map((s) => (s.notification_type === notificationType ? updatedSetting : s))
      );

      // Show success toast
      const channelLabel = channel === 'email' ? 'Email' : 'SMS';
      const statusLabel = enabled ? 'enabled' : 'disabled';
      const typeLabel = getNotificationTypeLabel(notificationType);
      addToast(`${channelLabel} notifications ${statusLabel} for ${typeLabel}`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      addToast(message, 'error');
      // Re-throw to trigger rollback in ChannelToggle
      throw err;
    }
  };

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8EEE5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#434E54] mb-2">Notification Settings</h1>
          <p className="text-[#6B7280]">
            Configure notification channels and delivery settings for each notification type
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <span className="loading loading-spinner loading-lg text-[#434E54]" aria-label="Loading settings" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-red-600 font-medium mb-2">Failed to load settings</p>
            <p className="text-[#6B7280] text-sm mb-4">{error}</p>
            <button
              onClick={fetchSettings}
              className="bg-[#434E54] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#363F44] transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Settings grid */}
        {!isLoading && !error && (
          <>
            {settings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <p className="text-[#6B7280]">No notification settings found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.map((setting) => (
                  <NotificationSettingCard
                    key={setting.notification_type}
                    setting={setting}
                    onUpdateSetting={handleUpdateSetting}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
