/**
 * Default Groomer Setting Component
 * Allows admins to select a default groomer for new appointments
 */

'use client';

import { useState, useEffect } from 'react';
import { Users, Save, AlertCircle } from 'lucide-react';

interface Groomer {
  id: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'groomer';
}

export function DefaultGroomerSetting() {
  const [groomerId, setGroomerId] = useState<string | null>(null);
  const [originalGroomerId, setOriginalGroomerId] = useState<string | null>(null);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [settingRes, groomersRes] = await Promise.all([
          fetch('/api/admin/settings/default-groomer'),
          fetch('/api/admin/groomers'),
        ]);

        if (settingRes.ok) {
          const settingResult = await settingRes.json();
          const id = settingResult.data?.groomer_id ?? null;
          setGroomerId(id);
          setOriginalGroomerId(id);
        }

        if (groomersRes.ok) {
          const groomersResult = await groomersRes.json();
          setGroomers(groomersResult.groomers || []);
        }
      } catch (error) {
        console.error('Error fetching default groomer data:', error);
        setSaveMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const hasUnsavedChanges = groomerId !== originalGroomerId;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/default-groomer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groomer_id: groomerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save setting');
      }

      setOriginalGroomerId(groomerId);
      setSaveMessage({ type: 'success', text: 'Default groomer updated!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving default groomer:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const selectedGroomer = groomers.find((g) => g.id === groomerId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
          <Users className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#434E54]">Default Groomer</h2>
          <p className="text-sm text-[#6B7280]">
            Pre-select a groomer for new appointments (can be changed during booking)
          </p>
        </div>
      </div>

      {/* Dropdown */}
      <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
        <label className="block text-sm font-medium text-[#434E54] mb-2">
          Default Groomer Assignment
        </label>
        <select
          value={groomerId || ''}
          onChange={(e) => setGroomerId(e.target.value || null)}
          className="select select-bordered w-full bg-white border-[#434E54]/20
                   focus:border-[#434E54] focus:outline-none focus:ring-2
                   focus:ring-[#434E54]/20"
        >
          <option value="">No default (groomer must be selected manually)</option>
          {groomers.map((groomer) => (
            <option key={groomer.id} value={groomer.id}>
              {groomer.first_name} {groomer.last_name}
              {groomer.role === 'admin' && ' (Admin)'}
            </option>
          ))}
        </select>

        {selectedGroomer && (
          <p className="text-xs text-[#6B7280] mt-2">
            {selectedGroomer.first_name} {selectedGroomer.last_name} will be automatically assigned to new appointments
          </p>
        )}

        {groomers.length === 0 && (
          <p className="text-sm text-[#434E54]/60 mt-2">
            No groomers available. Add staff members first.
          </p>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none disabled:bg-gray-300 disabled:text-gray-500"
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

        {hasUnsavedChanges && !saveMessage && (
          <div className="flex items-center gap-2 text-[#FFB347]">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        )}

        {saveMessage && (
          <div
            className={`flex items-center gap-2 ${
              saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{saveMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
