'use client';

import { useState } from 'react';
import { Calendar, Clock, Repeat } from 'lucide-react';
import type { CampaignType } from '@/types/marketing';

interface ScheduleSectionProps {
  campaignType: CampaignType;
  sendNow: boolean;
  onSendNowChange: (sendNow: boolean) => void;
  scheduledAt: string | null;
  onScheduledAtChange: (scheduledAt: string | null) => void;
}

/**
 * ScheduleSection - Configure campaign scheduling and recurrence
 */
export function ScheduleSection({
  campaignType,
  sendNow,
  onSendNowChange,
  scheduledAt,
  onScheduledAtChange,
}: ScheduleSectionProps) {
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    'weekly'
  );
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState<number>(1); // Monday
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number>(1);
  const [recurringTime, setRecurringTime] = useState<string>('09:00');

  // Get minimum datetime (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const handleScheduledDateChange = (value: string) => {
    onScheduledAtChange(value ? new Date(value).toISOString() : null);
  };

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h4 className="text-xl font-semibold text-[#434E54] mb-2">Schedule Your Campaign</h4>
        <p className="text-[#6B7280]">
          Choose when to send your campaign to your audience
        </p>
      </div>

      {/* Send Now vs Schedule */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">When to Send</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onSendNowChange(true)}
            className={`card border-2 transition-all ${
              sendNow
                ? 'border-[#434E54] bg-[#434E54] text-white'
                : 'border-gray-200 bg-white hover:border-[#434E54]'
            }`}
          >
            <div className="card-body items-center text-center py-6">
              <Clock
                className={`w-10 h-10 mb-2 ${sendNow ? 'text-white' : 'text-[#434E54]'}`}
              />
              <h5 className="font-semibold">Send Now</h5>
              <p className={`text-sm ${sendNow ? 'text-white/80' : 'text-[#6B7280]'}`}>
                Send immediately after creation
              </p>
            </div>
          </button>

          <button
            onClick={() => onSendNowChange(false)}
            className={`card border-2 transition-all ${
              !sendNow
                ? 'border-[#434E54] bg-[#434E54] text-white'
                : 'border-gray-200 bg-white hover:border-[#434E54]'
            }`}
          >
            <div className="card-body items-center text-center py-6">
              <Calendar
                className={`w-10 h-10 mb-2 ${!sendNow ? 'text-white' : 'text-[#434E54]'}`}
              />
              <h5 className="font-semibold">Schedule Later</h5>
              <p className={`text-sm ${!sendNow ? 'text-white/80' : 'text-[#6B7280]'}`}>
                Choose a specific date and time
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Schedule Date/Time Picker */}
      {!sendNow && (
        <div className="card bg-gray-50 border border-gray-200">
          <div className="card-body">
            <h5 className="font-medium text-[#434E54] mb-4">Schedule Details</h5>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date and Time *</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleScheduledDateChange(e.target.value)}
                min={getMinDateTime()}
              />
              <label className="label">
                <span className="label-text-alt text-[#6B7280]">
                  Campaign will be sent at the specified date and time
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Configuration */}
      {campaignType === 'recurring' && (
        <div className="card bg-[#434E54] text-white">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <Repeat className="w-5 h-5" />
              <h5 className="font-medium">Recurring Schedule</h5>
            </div>

            <div className="space-y-4">
              {/* Frequency */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Frequency *</span>
                </label>
                <select
                  className="select select-bordered text-[#434E54]"
                  value={recurringFrequency}
                  onChange={(e) =>
                    setRecurringFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Day of Week (for weekly) */}
              {recurringFrequency === 'weekly' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white">Day of Week *</span>
                  </label>
                  <select
                    className="select select-bordered text-[#434E54]"
                    value={recurringDayOfWeek}
                    onChange={(e) => setRecurringDayOfWeek(parseInt(e.target.value))}
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {recurringFrequency === 'monthly' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white">Day of Month *</span>
                  </label>
                  <select
                    className="select select-bordered text-[#434E54]"
                    value={recurringDayOfMonth}
                    onChange={(e) => setRecurringDayOfMonth(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <label className="label">
                    <span className="label-text-alt text-white/80">
                      Limited to day 1-28 to ensure all months are valid
                    </span>
                  </label>
                </div>
              )}

              {/* Time */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Time *</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered text-[#434E54]"
                  value={recurringTime}
                  onChange={(e) => setRecurringTime(e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="alert bg-white/10 border-white/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm">
                  <p className="font-medium">Campaign will send:</p>
                  <p className="mt-1">
                    {recurringFrequency === 'daily' && `Every day at ${recurringTime}`}
                    {recurringFrequency === 'weekly' &&
                      `Every ${daysOfWeek[recurringDayOfWeek].label} at ${recurringTime}`}
                    {recurringFrequency === 'monthly' &&
                      `On day ${recurringDayOfMonth} of each month at ${recurringTime}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
