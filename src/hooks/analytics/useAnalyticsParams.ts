'use client';

import { useMemo } from 'react';

export function useAnalyticsParams(
  dateRange: { start: Date; end: Date },
  extra?: Record<string, string>
): URLSearchParams {
  return useMemo(() => {
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      ...extra,
    });
    return params;
  }, [dateRange.start, dateRange.end, extra]);
}
