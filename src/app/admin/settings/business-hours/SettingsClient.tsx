/**
 * Settings Client Component
 * Manages business hours and Phase 6 settings with tabs navigation
 */

'use client';

import { useState } from 'react';
import { Clock, Save, AlertCircle, FileText, Mail, MessageSquare, Settings } from 'lucide-react';
import { ReportCardSettings } from '@/components/admin/settings/ReportCardSettings';
import { WaitlistSettings } from '@/components/admin/settings/WaitlistSettings';
import { MarketingSettings } from '@/components/admin/settings/MarketingSettings';
import { TemplateEditor } from '@/components/admin/settings/TemplateEditor';

interface DaySchedule {
  is_open: boolean;
  open: string;
  close: string;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface SettingsClientProps {
  initialBusinessHours: BusinessHours | null;
}

const defaultBusinessHours: BusinessHours = {
  monday: { is_open: true, open: '09:00', close: '17:00' },
  tuesday: { is_open: true, open: '09:00', close: '17:00' },
  wednesday: { is_open: true, open: '09:00', close: '17:00' },
  thursday: { is_open: true, open: '09:00', close: '17:00' },
  friday: { is_open: true, open: '09:00', close: '17:00' },
  saturday: { is_open: true, open: '09:00', close: '17:00' },
  sunday: { is_open: false, open: '00:00', close: '00:00' },
};

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

type TabType = 'hours' | 'report-cards' | 'waitlist' | 'marketing' | 'templates';

export function SettingsClient({ initialBusinessHours }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('hours');
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    initialBusinessHours || defaultBusinessHours
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleDayToggle = (day: keyof BusinessHours) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        is_open: !prev[day].is_open,
      },
    }));
  };

  const handleTimeChange = (
    day: keyof BusinessHours,
    field: 'open' | 'close',
    value: string
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/business-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessHours }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveMessage({
        type: 'success',
        text: 'Business hours saved successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('[Settings] Error saving:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    {
      id: 'hours' as TabType,
      label: 'Business Hours',
      icon: Clock,
      description: 'Operating hours',
    },
    {
      id: 'report-cards' as TabType,
      label: 'Report Cards',
      icon: FileText,
      description: 'Report card settings',
    },
    {
      id: 'waitlist' as TabType,
      label: 'Waitlist',
      icon: MessageSquare,
      description: 'Waitlist configuration',
    },
    {
      id: 'marketing' as TabType,
      label: 'Marketing',
      icon: Mail,
      description: 'Marketing automation',
    },
    {
      id: 'templates' as TabType,
      label: 'Templates',
      icon: Settings,
      description: 'Notification templates',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#434E54] text-white shadow-md'
                    : 'bg-transparent text-[#434E54] hover:bg-[#EAE0D5]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Business Hours Tab */}
        {activeTab === 'hours' && (
          <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#434E54]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#434E54]">Business Hours</h2>
                <p className="text-sm text-[#6B7280]">
                  Set your operating hours for each day of the week
                </p>
              </div>
            </div>

            {/* Days Grid */}
            <div className="space-y-4">
              {daysOfWeek.map(({ key, label }) => {
                const schedule = businessHours[key];
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]"
                  >
                    {/* Day Toggle */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <input
                        type="checkbox"
                        id={`day-${key}`}
                        checked={schedule.is_open}
                        onChange={() => handleDayToggle(key)}
                        className="toggle toggle-sm bg-gray-300"
                      />
                      <label
                        htmlFor={`day-${key}`}
                        className="font-medium text-[#434E54] cursor-pointer whitespace-nowrap"
                      >
                        {label}
                      </label>
                    </div>

                    {/* Time Inputs */}
                    {schedule.is_open ? (
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`${key}-open`}
                            className="text-sm text-[#6B7280] whitespace-nowrap"
                          >
                            Open:
                          </label>
                          <input
                            type="time"
                            id={`${key}-open`}
                            value={schedule.open}
                            onChange={(e) =>
                              handleTimeChange(key, 'open', e.target.value)
                            }
                            className="input input-bordered bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none h-10 w-[160px] min-w-[160px] text-sm [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                        </div>
                        <span className="text-[#6B7280] hidden sm:inline">-</span>
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`${key}-close`}
                            className="text-sm text-[#6B7280] whitespace-nowrap"
                          >
                            Close:
                          </label>
                          <input
                            type="time"
                            id={`${key}-close`}
                            value={schedule.close}
                            onChange={(e) =>
                              handleTimeChange(key, 'close', e.target.value)
                            }
                            className="input input-bordered bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none h-10 w-[160px] min-w-[160px] text-sm [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#6B7280] italic">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>

              {/* Save Message */}
              {saveMessage && (
                <div
                  className={`flex items-center gap-2 ${
                    saveMessage.type === 'success'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{saveMessage.text}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Cards Tab */}
        {activeTab === 'report-cards' && <ReportCardSettings />}

        {/* Waitlist Tab */}
        {activeTab === 'waitlist' && <WaitlistSettings />}

        {/* Marketing Tab */}
        {activeTab === 'marketing' && <MarketingSettings />}

        {/* Templates Tab */}
        {activeTab === 'templates' && <TemplateEditor />}
      </div>
    </div>
  );
}
