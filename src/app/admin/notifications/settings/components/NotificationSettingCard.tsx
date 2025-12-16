'use client';

/**
 * Notification setting card component
 * Displays settings and controls for a single notification type
 */

import { useState } from 'react';
import { Calendar, Zap } from 'lucide-react';
import { ChannelToggle } from './ChannelToggle';
import { SettingsStats } from './SettingsStats';
import { getNotificationTypeLabel, parseCronExpression } from '../utils';
import type { NotificationSettingsRow } from '@/lib/notifications/database-types';

export interface NotificationSettingCardProps {
  setting: NotificationSettingsRow;
  onUpdateSetting: (
    notificationType: string,
    channel: 'email' | 'sms',
    enabled: boolean
  ) => Promise<void>;
}

export function NotificationSettingCard({ setting, onUpdateSetting }: NotificationSettingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (channel: 'email' | 'sms', enabled: boolean) => {
    setIsUpdating(true);
    try {
      await onUpdateSetting(setting.notification_type, channel, enabled);
    } finally {
      setIsUpdating(false);
    }
  };

  const scheduleDescription = setting.schedule_enabled
    ? parseCronExpression(setting.schedule_cron)
    : 'Manual';

  const isAutomated = setting.schedule_enabled && setting.schedule_cron;
  const ScheduleIcon = isAutomated ? Calendar : Zap;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#434E54] mb-1">
          {getNotificationTypeLabel(setting.notification_type)}
        </h3>
        <p className="text-xs text-[#9CA3AF] font-mono">{setting.notification_type}</p>
      </div>

      {/* Channel toggles */}
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
        <ChannelToggle
          channel="email"
          enabled={setting.email_enabled}
          notificationType={setting.notification_type}
          notificationLabel={getNotificationTypeLabel(setting.notification_type)}
          onToggle={(enabled) => handleToggle('email', enabled)}
          disabled={isUpdating}
        />

        <ChannelToggle
          channel="sms"
          enabled={setting.sms_enabled}
          notificationType={setting.notification_type}
          notificationLabel={getNotificationTypeLabel(setting.notification_type)}
          onToggle={(enabled) => handleToggle('sms', enabled)}
          disabled={isUpdating}
        />
      </div>

      {/* Schedule info */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ScheduleIcon className="w-4 h-4 text-[#6B7280]" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-[#434E54]">
              {isAutomated ? 'Automated' : 'Manual'}
            </p>
            <p className="text-xs text-[#6B7280]">{scheduleDescription}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <SettingsStats
        lastSentAt={setting.last_sent_at}
        totalSentCount={setting.total_sent_count}
        totalFailedCount={setting.total_failed_count}
      />

      {/* Future: Settings button */}
      {/* <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-[#434E54] hover:text-[#363F44] font-medium flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Advanced Settings
        </button>
      </div> */}
    </div>
  );
}
