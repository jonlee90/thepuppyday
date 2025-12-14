/**
 * Date Range Selector Component
 * Task 0048: Date range presets and custom picker
 */

'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

export type DateRangePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange, preset: DateRangePreset) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [activePreset, setActivePreset] = useState<DateRangePreset>('month');
  const [showCustom, setShowCustom] = useState(false);

  const getPresetRange = (preset: DateRangePreset): DateRange => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        start.setDate(now.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setDate(now.getDate() - 365);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        return value; // Return current value for custom
    }

    return { start, end };
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const range = getPresetRange(preset);
      onChange(range, preset);
    }
  };

  const handleCustomChange = (field: 'start' | 'end', dateValue: string) => {
    const newRange = { ...value };
    newRange[field] = new Date(dateValue);

    // Validate that start is before end
    if (newRange.start > newRange.end) {
      console.error('Start date must be before end date');
      return;
    }

    onChange(newRange, 'custom');
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const presets: { label: string; value: DateRangePreset }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Year', value: 'year' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className={`btn btn-sm ${
              activePreset === preset.value
                ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
                : 'btn-ghost hover:bg-[#EAE0D5]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Picker */}
      {showCustom && (
        <div className="card bg-white shadow-sm p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={formatDate(value.start)}
                onChange={(e) => handleCustomChange('start', e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={formatDate(value.end)}
                onChange={(e) => handleCustomChange('end', e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Display current range */}
      <div className="text-sm text-gray-600">
        Showing data from <strong>{value.start.toLocaleDateString()}</strong> to{' '}
        <strong>{value.end.toLocaleDateString()}</strong>
      </div>
    </div>
  );
}
