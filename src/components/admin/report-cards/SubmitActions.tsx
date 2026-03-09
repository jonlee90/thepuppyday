'use client';

/**
 * SubmitActions Component
 * Sticky bottom bar with save draft and submit buttons
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
  const errorCount = Object.keys(validation.errors).length;

  // Format last saved time
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return 'Saved just now';
    if (minutes === 1) return 'Saved 1 min ago';
    if (minutes < 60) return `Saved ${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Saved 1 hr ago';
    return `Saved ${hours} hrs ago`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E5E5] shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* Status + Buttons Row */}
        <div className="flex items-center gap-3">
          {/* Save Status - compact */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm min-w-0 flex-shrink-0">
            {isSaving ? (
              <>
                <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span className="text-blue-600 font-medium">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500 truncate">{formatLastSaved(lastSaved)}</span>
              </>
            ) : null}
          </div>

          {/* Validation error count */}
          {!validation.valid && (
            <span className="hidden sm:inline text-xs text-red-600 font-medium flex-shrink-0">
              {errorCount} issue{errorCount > 1 ? 's' : ''} remaining
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="
              flex items-center justify-center gap-2 px-5 py-2.5
              bg-white text-[#434E54] font-medium rounded-lg border-2 border-[#434E54]
              hover:bg-[#F8EEE5] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[44px] text-sm
            "
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="
              flex items-center justify-center gap-2 px-5 py-2.5
              bg-[#434E54] text-white font-medium rounded-lg
              hover:bg-[#363F44] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[44px] text-sm
            "
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
