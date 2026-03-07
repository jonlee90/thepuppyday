'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarView, Groomer, GroomerColorMap } from './types';
import { UNASSIGNED_COLOR } from './constants';

interface CalendarHeaderProps {
  title: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  groomers: Groomer[];
  selectedGroomerId: string;
  onGroomerChange: (id: string) => void;
  groomerColorMap: GroomerColorMap;
}

export function CalendarHeader({
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  groomers,
  selectedGroomerId,
  onGroomerChange,
  groomerColorMap,
}: CalendarHeaderProps) {
  const views: { key: CalendarView; label: string }[] = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  return (
    <div className="space-y-3 mb-4">
      {/* Top row: nav + title + view toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="btn btn-sm btn-ghost text-[#434E54] hover:bg-[#EAE0D5] min-w-[44px] min-h-[44px]"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNext}
            className="btn btn-sm btn-ghost text-[#434E54] hover:bg-[#EAE0D5] min-w-[44px] min-h-[44px]"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onToday}
            className="btn btn-sm bg-white text-[#434E54] hover:bg-[#EAE0D5] border border-[#E5E7EB] min-h-[44px]"
          >
            Today
          </button>
          <h2 className="text-lg font-semibold text-[#434E54] ml-2">{title}</h2>
        </div>

        {/* Right: View toggle + Groomer filter */}
        <div className="flex items-center gap-3">
          {/* Groomer filter dropdown */}
          {groomers.length > 0 && (
            <select
              value={selectedGroomerId}
              onChange={(e) => onGroomerChange(e.target.value)}
              className="select select-sm select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] text-[#434E54] min-h-[44px]"
              aria-label="Filter by groomer"
            >
              <option value="all">All Groomers</option>
              <option value="unassigned">Unassigned</option>
              {groomers.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.first_name} {g.last_name}
                </option>
              ))}
            </select>
          )}

          {/* View toggle buttons */}
          <div className="flex gap-1 bg-[#EAE0D5] rounded-lg p-1">
            {views.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onViewChange(key)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors min-h-[44px] ${
                  view === key
                    ? 'bg-[#434E54] text-white shadow-sm'
                    : 'text-[#434E54] hover:bg-[#DCD2C7]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Groomer filter chips (if ≤ 5 groomers and day/week view) */}
      {groomers.length > 0 && groomers.length <= 5 && (view === 'day' || view === 'week') && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onGroomerChange('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
              selectedGroomerId === 'all'
                ? 'bg-[#434E54] text-white'
                : 'bg-white text-[#434E54] border border-[#434E54] hover:bg-[#EAE0D5]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onGroomerChange('unassigned')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px]`}
            style={{
              backgroundColor: selectedGroomerId === 'unassigned' ? UNASSIGNED_COLOR : 'white',
              color: selectedGroomerId === 'unassigned' ? 'white' : UNASSIGNED_COLOR,
              borderWidth: 1,
              borderColor: UNASSIGNED_COLOR,
            }}
          >
            Unassigned
          </button>
          {groomers.map((g) => (
            <button
              key={g.id}
              onClick={() => onGroomerChange(g.id)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px]"
              style={{
                backgroundColor: selectedGroomerId === g.id ? groomerColorMap[g.id] : 'white',
                color: selectedGroomerId === g.id ? 'white' : groomerColorMap[g.id],
                borderWidth: 1,
                borderColor: groomerColorMap[g.id],
              }}
            >
              {g.first_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
