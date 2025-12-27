/**
 * Date Range Step Component
 * Task 0045: Step 1 - Date range selection for calendar import
 */

'use client';

import { Calendar, Info, AlertCircle } from 'lucide-react';

interface DateRangeStepProps {
  dateFrom: string;
  dateTo: string;
  onChange: (field: 'dateFrom' | 'dateTo', value: string) => void;
  onNext: () => void;
  isLoading: boolean;
  error: string | null;
}

export function DateRangeStep({
  dateFrom,
  dateTo,
  onChange,
  onNext,
  isLoading,
  error,
}: DateRangeStepProps) {
  // Validation
  const validateDates = () => {
    if (!dateFrom || !dateTo) {
      return 'Both start and end dates are required';
    }

    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    if (end <= start) {
      return 'End date must be after start date';
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 90) {
      return 'Date range cannot exceed 90 days';
    }

    return null;
  };

  const validationError = validateDates();
  const canProceed = !validationError && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-[#6B7280] leading-relaxed mb-6">
          Choose the date range to import events from your connected Google Calendar.
        </p>

        {/* Start Date */}
        <div className="mb-4">
          <label htmlFor="date-from" className="block text-sm font-medium text-[#6B7280] mb-2">
            Start Date <span className="text-[#EF4444]" aria-label="required">*</span>
          </label>
          <div className="relative">
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onChange('dateFrom', e.target.value)}
              className="input input-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 pr-10"
              required
              aria-required="true"
              aria-invalid={validationError ? 'true' : 'false'}
              aria-describedby={validationError ? 'date-error' : 'date-help'}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* End Date */}
        <div className="mb-4">
          <label htmlFor="date-to" className="block text-sm font-medium text-[#6B7280] mb-2">
            End Date <span className="text-[#EF4444]" aria-label="required">*</span>
          </label>
          <div className="relative">
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onChange('dateTo', e.target.value)}
              className="input input-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 pr-10"
              required
              aria-required="true"
              aria-invalid={validationError ? 'true' : 'false'}
              aria-describedby={validationError ? 'date-error' : 'date-help'}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div
            id="date-error"
            role="alert"
            className="flex items-start gap-2 p-3 bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg mb-4"
          >
            <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-[#EF4444]">{validationError}</p>
          </div>
        )}

        {/* API Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 p-3 bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg mb-4"
          >
            <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-[#EF4444]">{error}</p>
          </div>
        )}

        {/* Info Messages */}
        <div id="date-help" className="space-y-2">
          <div className="flex items-start gap-2 p-3 bg-[#FFF7ED] border border-[#F59E0B]/20 rounded-lg">
            <Info className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-[#92400E]">
              <p className="font-medium mb-1">Default range: Next 30 days</p>
              <p>Maximum range: 90 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8">
          <span className="loading loading-spinner loading-lg text-[#434E54]"></span>
          <p className="mt-4 text-[#6B7280]">Fetching calendar events...</p>
          <p className="text-sm text-[#9CA3AF] mt-2">
            This may take a few seconds depending on the number of events.
          </p>
        </div>
      )}
    </form>
  );
}
