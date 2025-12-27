/**
 * Sync Settings Form Component
 * Task 0040: Configure calendar sync preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { CalendarSyncSettings, AppointmentStatusType } from '@/types/calendar';

interface SyncSettingsFormProps {
  initialSettings: CalendarSyncSettings;
  onSave: (settings: CalendarSyncSettings) => Promise<void>;
  isLoading?: boolean;
}

const SYNC_DIRECTION_OPTIONS = [
  { value: 'push', label: 'Push only', description: 'App → Calendar only' },
  { value: 'bidirectional', label: 'Two-way sync', description: 'Recommended - sync both ways' },
  { value: 'pull', label: 'Import only', description: 'Calendar → App only' },
] as const;

const STATUS_OPTIONS: { value: AppointmentStatusType; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked-in' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In-progress' },
  { value: 'completed', label: 'Completed' },
];

export function SyncSettingsForm({
  initialSettings,
  onSave,
  isLoading: externalLoading = false,
}: SyncSettingsFormProps) {
  const [settings, setSettings] = useState<CalendarSyncSettings>(initialSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncDirection, setSyncDirection] = useState<'push' | 'pull' | 'bidirectional'>('bidirectional');

  useEffect(() => {
    setSettings(initialSettings);
    setIsDirty(false);
  }, [initialSettings]);

  const handleToggleAutoSync = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      auto_sync_enabled: enabled,
    }));
    setIsDirty(true);
  };

  const handleSyncDirectionChange = (direction: 'push' | 'pull' | 'bidirectional') => {
    setSyncDirection(direction);
    setIsDirty(true);
  };

  const handleStatusToggle = (status: AppointmentStatusType) => {
    setSettings((prev) => {
      const currentStatuses = prev.sync_statuses;
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];

      return {
        ...prev,
        sync_statuses: newStatuses,
      };
    });
    setIsDirty(true);
  };

  const handleNotificationToggle = (type: 'success' | 'failure') => {
    setSettings((prev) => ({
      ...prev,
      notification_preferences: {
        send_success_notifications:
          type === 'success'
            ? !prev.notification_preferences?.send_success_notifications
            : prev.notification_preferences?.send_success_notifications ?? false,
        send_failure_notifications:
          type === 'failure'
            ? !prev.notification_preferences?.send_failure_notifications
            : prev.notification_preferences?.send_failure_notifications ?? true,
      },
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    // Validation
    if (settings.sync_statuses.length === 0) {
      toast.error('Validation Error', {
        description: 'Select at least one appointment status to sync',
      });
      return;
    }

    setIsSaving(true);

    try {
      await onSave(settings);
      toast.success('Settings Saved', {
        description: 'Calendar sync settings updated successfully',
      });
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Save Failed', {
        description: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = externalLoading || isSaving;

  return (
    <div className="card bg-white shadow-md mb-6">
      <div className="card-body p-6">
        <h2 className="text-xl font-semibold text-[#434E54] mb-6">Sync Settings</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column: Synchronization Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-[#434E54] mb-3">Synchronization</h3>

              {/* Auto-Sync Toggle */}
              <div className="form-control mb-4">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary bg-[#E5E5E5] [--tglbg:#F59E0B] hover:bg-[#D97706]"
                    checked={settings.auto_sync_enabled}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                    disabled={isLoading}
                  />
                  <div>
                    <span className="label-text font-medium text-[#434E54]">Enable automatic sync</span>
                    <p className="text-sm text-[#6B7280]">
                      Appointments will sync automatically when created or updated
                    </p>
                  </div>
                </label>
              </div>

              {/* Sync Direction Radio Group */}
              <div>
                <p className="text-sm font-medium text-[#434E54] mb-3">Sync Direction</p>
                <div className="space-y-2">
                  {SYNC_DIRECTION_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-[#FFFBF7] transition-colors"
                    >
                      <input
                        type="radio"
                        name="sync_direction"
                        value={option.value}
                        className="radio radio-primary mt-0.5 [--chkbg:#F59E0B] [--chkfg:white]"
                        checked={syncDirection === option.value}
                        onChange={(e) => handleSyncDirectionChange(e.target.value as 'push' | 'bidirectional' | 'pull')}
                        disabled={isLoading}
                      />
                      <div>
                        <p className="text-[#434E54] font-medium">{option.label}</p>
                        <p className="text-sm text-[#6B7280]">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="mt-6">
                <p className="text-sm font-medium text-[#434E54] mb-3">Notifications</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm [--chkbg:#F59E0B] [--chkfg:white]"
                      checked={settings.notification_preferences?.send_success_notifications ?? false}
                      onChange={() => handleNotificationToggle('success')}
                      disabled={isLoading}
                    />
                    <span className="text-[#434E54]">Send success notifications</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm [--chkbg:#F59E0B] [--chkfg:white]"
                      checked={settings.notification_preferences?.send_failure_notifications ?? true}
                      onChange={() => handleNotificationToggle('failure')}
                      disabled={isLoading}
                    />
                    <span className="text-[#434E54]">Send failure notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status-Based Sync */}
          <div>
            <h3 className="font-medium text-[#434E54] mb-3">Status-Based Sync</h3>
            <p className="text-sm text-[#6B7280] mb-4">
              Select which appointment statuses to sync:
            </p>

            <div className="space-y-3">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#FFFBF7] transition-colors"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm [--chkbg:#F59E0B] [--chkfg:white]"
                    checked={settings.sync_statuses.includes(option.value)}
                    onChange={() => handleStatusToggle(option.value)}
                    disabled={isLoading}
                  />
                  <span className="text-[#434E54]">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
              <p className="text-sm italic text-[#9CA3AF]">
                Note: Cancelled and No-show appointments are never synced.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="card-actions justify-end pt-4 border-t border-[#E5E5E5]">
          <button
            onClick={handleSave}
            disabled={!isDirty || isLoading}
            className={`
              btn btn-primary bg-[#F59E0B] hover:bg-[#D97706] border-none
              ${!isDirty && !isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              flex items-center gap-2
            `}
          >
            {isSaving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
