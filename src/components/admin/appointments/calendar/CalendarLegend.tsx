'use client';

import { getCalendarEventColor } from '@/lib/admin/appointment-status';
import type { Groomer, GroomerColorMap } from './types';
import { UNASSIGNED_COLOR } from './constants';

interface CalendarLegendProps {
  groomers: Groomer[];
  groomerColorMap: GroomerColorMap;
}

const STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No Show' },
] as const;

export function CalendarLegend({ groomers, groomerColorMap }: CalendarLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6B7280] mb-4">
      {/* Status legend */}
      {STATUSES.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getCalendarEventColor(key) }}
          />
          <span>{label}</span>
        </div>
      ))}

      {/* Divider */}
      {groomers.length > 0 && (
        <div className="w-px h-4 bg-[#E5E7EB] mx-1" />
      )}

      {/* Groomer border legend */}
      {groomers.length > 0 && (
        <>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm border-2"
              style={{ borderColor: UNASSIGNED_COLOR }}
            />
            <span>Unassigned</span>
          </div>
          {groomers.map((g) => (
            <div key={g.id} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm border-2"
                style={{ borderColor: groomerColorMap[g.id] }}
              />
              <span>{g.first_name}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
