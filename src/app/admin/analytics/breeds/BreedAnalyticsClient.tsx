/**
 * Breed Analytics Deep-Dive — client wrapper
 * Owns DateRangeSelector state and feeds it to BreedDetailTable.
 */

'use client';

import { useState } from 'react';
import { DateRangeSelector } from '@/components/admin/analytics/DateRangeSelector';
import { BreedDetailTable } from '@/components/admin/analytics/BreedDetailTable';

interface DateRange {
  start: Date;
  end: Date;
}

export function BreedAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  return (
    <div className="space-y-6">
      <div className="card bg-white shadow-md p-4 sm:p-6">
        <DateRangeSelector value={dateRange} onChange={(range) => setDateRange(range)} />
      </div>
      <BreedDetailTable dateRange={dateRange} />
    </div>
  );
}
