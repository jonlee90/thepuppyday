'use client';

import { useEffect, useRef, useState } from 'react';

interface AdminFreeTimeInputProps {
  selectedDate: string | null;
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
  isBackdated: boolean;
}

export function AdminFreeTimeInput({
  selectedDate,
  selectedTime,
  onTimeChange,
  isBackdated,
}: AdminFreeTimeInputProps) {
  const [conflictCount, setConflictCount] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!selectedDate || !selectedTime) {
      debounceRef.current = setTimeout(() => setConflictCount(null), 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/appointments/conflicts?date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(selectedTime)}`
        );
        if (!res.ok) return;
        const json = await res.json();
        setConflictCount(json.count ?? 0);
      } catch {
        // Non-blocking: silently ignore errors
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedDate, selectedTime]);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[#434E54]">Select Time</h3>

      <input
        type="time"
        value={selectedTime || ''}
        onChange={(e) => onTimeChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none text-[#434E54] bg-white"
      />

      {isBackdated ? (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Backdating — this appointment will be marked as completed</span>
        </div>
      ) : null}

      {conflictCount !== null && conflictCount > 0 ? (
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {conflictCount} existing appointment{conflictCount !== 1 ? 's' : ''} at this time
          </span>
        </div>
      ) : null}
    </div>
  );
}
