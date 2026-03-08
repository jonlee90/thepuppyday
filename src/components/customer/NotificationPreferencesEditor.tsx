'use client';

import { useState } from 'react';

interface NotificationPrefs {
  marketing_enabled: boolean;
  email_appointment_reminders: boolean;
  sms_appointment_reminders: boolean;
  email_retention_reminders: boolean;
  sms_retention_reminders: boolean;
}

interface NotificationPreferencesEditorProps {
  initialPrefs: NotificationPrefs;
}

export function NotificationPreferencesEditor({ initialPrefs }: NotificationPreferencesEditorProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [saving, setSaving] = useState<keyof NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (key: keyof NotificationPrefs) => {
    const newValue = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: newValue }));
    setSaving(key);
    setError(null);

    try {
      const res = await fetch('/api/customer/preferences/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });

      if (!res.ok) {
        // Revert on failure
        setPrefs((p) => ({ ...p, [key]: !newValue }));
        setError('Failed to save preference. Please try again.');
      }
    } catch {
      setPrefs((p) => ({ ...p, [key]: !newValue }));
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#434E54]/10">
        <h2 className="font-bold text-[#434E54]">Notification Preferences</h2>
      </div>
      <div className="p-6 space-y-6">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Email notifications */}
        <div>
          <h3 className="font-semibold text-[#434E54] mb-3">Email Notifications</h3>
          <div className="space-y-3">
            <Toggle
              label="Appointment Reminders"
              description="Get reminders before your appointments"
              enabled={prefs.email_appointment_reminders}
              loading={saving === 'email_appointment_reminders'}
              onToggle={() => toggle('email_appointment_reminders')}
            />
            <Toggle
              label="Retention & Offers"
              description="Re-booking reminders and special offers"
              enabled={prefs.email_retention_reminders}
              loading={saving === 'email_retention_reminders'}
              onToggle={() => toggle('email_retention_reminders')}
            />
          </div>
        </div>

        {/* SMS notifications */}
        <div className="pt-6 border-t border-[#434E54]/10">
          <h3 className="font-semibold text-[#434E54] mb-3">SMS Notifications</h3>
          <div className="space-y-3">
            <Toggle
              label="Appointment Reminders"
              description="Get text reminders before appointments"
              enabled={prefs.sms_appointment_reminders}
              loading={saving === 'sms_appointment_reminders'}
              onToggle={() => toggle('sms_appointment_reminders')}
            />
            <Toggle
              label="Retention & Offers"
              description="Re-booking reminders and special offers via text"
              enabled={prefs.sms_retention_reminders}
              loading={saving === 'sms_retention_reminders'}
              onToggle={() => toggle('sms_retention_reminders')}
            />
          </div>
        </div>

        {/* Marketing */}
        <div className="pt-6 border-t border-[#434E54]/10">
          <h3 className="font-semibold text-[#434E54] mb-3">Marketing</h3>
          <div className="space-y-3">
            <Toggle
              label="Promotional Emails"
              description="Receive news, promotions, and special offers"
              enabled={prefs.marketing_enabled}
              loading={saving === 'marketing_enabled'}
              onToggle={() => toggle('marketing_enabled')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  enabled,
  loading,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-[#434E54]">{label}</p>
        <p className="text-sm text-[#434E54]/60">{description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={loading}
        aria-pressed={enabled}
        aria-label={`${label}: ${enabled ? 'on' : 'off'}`}
        className={`
          w-11 h-6 rounded-full transition-colors relative flex-shrink-0
          disabled:opacity-60 cursor-pointer
          ${enabled ? 'bg-[#434E54]' : 'bg-[#434E54]/20'}
        `}
      >
        <div
          className={`
            absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
            ${enabled ? 'left-6' : 'left-1'}
          `}
        />
      </button>
    </div>
  );
}
