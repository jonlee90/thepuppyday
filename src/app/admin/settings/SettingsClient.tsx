/**
 * Settings Client Component
 * Manages business hours and other system settings
 */

'use client';

import { useState } from 'react';
import { Clock, Save, AlertCircle } from 'lucide-react';

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

export function SettingsClient({ initialBusinessHours }: SettingsClientProps) {
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

  return (
    <div className="space-y-6">
      {/* Business Hours Card */}
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
                className="flex items-center gap-4 p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]"
              >
                {/* Day Toggle */}
                <div className="flex items-center gap-3 w-40">
                  <input
                    type="checkbox"
                    id={`day-${key}`}
                    checked={schedule.is_open}
                    onChange={() => handleDayToggle(key)}
                    className="toggle toggle-sm"
                  />
                  <label
                    htmlFor={`day-${key}`}
                    className="font-medium text-[#434E54] cursor-pointer"
                  >
                    {label}
                  </label>
                </div>

                {/* Time Inputs */}
                {schedule.is_open ? (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`${key}-open`}
                        className="text-sm text-[#6B7280]"
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
                        className="input input-sm input-bordered bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none"
                      />
                    </div>
                    <span className="text-[#6B7280]">-</span>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`${key}-close`}
                        className="text-sm text-[#6B7280]"
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
                        className="input input-sm input-bordered bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none"
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

      {/* Additional Settings Sections (Placeholder) */}
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="text-center py-8">
          <p className="text-[#6B7280]">
            Additional settings sections will be added here (notifications, booking
            preferences, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
