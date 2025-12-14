'use client';

/**
 * SubmitActions Component
 * Save draft and submit buttons with validation feedback
 */

import { Save, Send, Clock } from 'lucide-react';
import { validateReportCard } from '@/lib/admin/report-card-validation';
import type { ReportCardFormState } from '@/types/report-card';

interface SubmitActionsProps {
  formState: ReportCardFormState;
  isSaving: boolean;
  lastSaved: Date | null;
  onSaveDraft: () => Promise<boolean>;
  onSubmit: () => Promise<boolean>;
}

export function SubmitActions({
  formState,
  isSaving,
  lastSaved,
  onSaveDraft,
  onSubmit,
}: SubmitActionsProps) {
  // Validate for submission
  const validation = validateReportCard(formState, false);
  const canSubmit = validation.valid && !isSaving;

  // Format last saved time
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return 'Saved just now';
    if (minutes === 1) return 'Saved 1 minute ago';
    if (minutes < 60) return `Saved ${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Saved 1 hour ago';
    return `Saved ${hours} hours ago`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      {/* Save Status */}
      <div className="flex items-center gap-2 mb-6">
        {isSaving ? (
          <>
            <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-sm text-blue-600 font-medium">Saving...</span>
          </>
        ) : lastSaved ? (
          <>
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{formatLastSaved(lastSaved)}</span>
          </>
        ) : null}
      </div>

      {/* Validation Errors */}
      {!validation.valid && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            Please fix the following issues:
          </h3>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.entries(validation.errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Save Draft Button */}
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="
            flex-1 flex items-center justify-center gap-2 px-6 py-3
            bg-white text-[#434E54] font-medium rounded-lg border-2 border-[#434E54]
            hover:bg-[#F8EEE5] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-[50px]
          "
        >
          <Save className="w-5 h-5" />
          Save Draft
        </button>

        {/* Submit Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="
            flex-1 flex items-center justify-center gap-2 px-6 py-3
            bg-[#434E54] text-white font-medium rounded-lg
            hover:bg-[#363F44] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-[50px]
          "
        >
          <Send className="w-5 h-5" />
          Submit Report Card
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Report cards can be edited within 24 hours of submission.
      </p>
    </div>
  );
}
