/**
 * SettingsFormExample Component
 * Task 0166: Example usage of shared form patterns
 *
 * This component demonstrates how to use:
 * - useSettingsForm hook
 * - UnsavedChangesIndicator
 * - LeaveConfirmDialog
 *
 * Use this as a reference for implementing other settings forms.
 */

'use client';

import { useSettingsForm } from '@/hooks/admin/use-settings-form';
import { UnsavedChangesIndicator } from './UnsavedChangesIndicator';
import { LeaveConfirmDialog } from './LeaveConfirmDialog';
import { Settings } from 'lucide-react';

interface ExampleSettings {
  setting1: string;
  setting2: number;
  setting3: boolean;
}

export function SettingsFormExample() {
  /**
   * Example: Fetch initial data (in real usage, this would come from an API)
   */
  const initialData: ExampleSettings = {
    setting1: 'Initial value',
    setting2: 42,
    setting3: true,
  };

  /**
   * Example: Save handler (in real usage, this would call an API)
   */
  const handleSave = async (data: ExampleSettings): Promise<ExampleSettings> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Network error - please try again');
    }

    // Return updated data from server
    return data;
  };

  /**
   * Initialize form with the hook
   */
  const form = useSettingsForm({
    initialData,
    onSave: handleSave,
    onSuccess: (data) => {
      console.log('Settings saved successfully:', data);
    },
    onError: (error) => {
      console.error('Save failed:', error);
    },
    // Optional: Enable auto-save after 3 seconds of inactivity
    // autoSaveDelay: 3000,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Leave Confirmation Dialog */}
      <LeaveConfirmDialog
        isDirty={form.isDirty}
        isSaving={form.isSaving}
        onSave={form.save}
      />

      {/* Unsaved Changes Indicator (sticky at top) */}
      <div className="sticky top-0 z-10">
        <UnsavedChangesIndicator
          isDirty={form.isDirty}
          isSaving={form.isSaving}
          error={form.error}
          lastSaved={form.lastSaved}
          onSave={form.save}
          onDiscard={form.discard}
          onRetry={form.retry}
        />
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#434E54]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#434E54]">
              Example Settings
            </h2>
            <p className="text-sm text-[#6B7280]">
              Demonstrating shared form patterns
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-[#434E54] mb-2">
              Setting 1 (Text)
            </label>
            <input
              type="text"
              value={form.data.setting1}
              onChange={(e) => form.updateData({ setting1: e.target.value })}
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200"
              placeholder="Enter text..."
            />
          </div>

          {/* Number Input */}
          <div>
            <label className="block text-sm font-medium text-[#434E54] mb-2">
              Setting 2 (Number)
            </label>
            <input
              type="number"
              value={form.data.setting2}
              onChange={(e) => form.updateData({ setting2: parseInt(e.target.value) || 0 })}
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200"
            />
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#FFFBF7] border border-[#434E54]/10">
            <div>
              <label className="text-sm font-medium text-[#434E54]">
                Setting 3 (Toggle)
              </label>
              <p className="text-xs text-[#6B7280] mt-1">
                Enable or disable this feature
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.data.setting3}
              onChange={(e) => form.updateData({ setting3: e.target.checked })}
              className="toggle toggle-md"
            />
          </div>
        </div>

        {/* Manual Save Button (if not using auto-save) */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => form.save()}
            disabled={!form.isDirty || form.isSaving}
            className="btn bg-[#434E54] text-white border-none
                     hover:bg-[#363F44] transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {form.isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>

          {form.isDirty && (
            <button
              onClick={form.discard}
              disabled={form.isSaving}
              className="btn bg-transparent text-[#6B7280] border-[#434E54]/20
                       hover:bg-[#EAE0D5] hover:border-[#434E54]/30 transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard
            </button>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs font-mono text-gray-600 mb-2">Debug Info:</p>
          <ul className="text-xs font-mono text-gray-500 space-y-1">
            <li>isDirty: {form.isDirty ? 'true' : 'false'}</li>
            <li>isSaving: {form.isSaving ? 'true' : 'false'}</li>
            <li>error: {form.error || 'null'}</li>
            <li>lastSaved: {form.lastSaved?.toLocaleString() || 'null'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
