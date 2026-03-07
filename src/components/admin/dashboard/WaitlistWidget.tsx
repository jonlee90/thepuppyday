/**
 * WaitlistWidget
 * Self-fetching compact waitlist summary card.
 * Shows active count, fill rate, top 3 entries, and a "View All" link.
 * Auto-refreshes every 60 seconds; pauses when tab is hidden.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bone, RefreshCw } from 'lucide-react';

interface WaitlistCustomer {
  first_name: string | null;
  last_name: string | null;
}

interface WaitlistPet {
  name: string | null;
}

interface WaitlistEntry {
  id: string;
  requested_date: string | null;
  customer?: WaitlistCustomer | null;
  pet?: WaitlistPet | null;
  service?: { name: string } | null;
}

interface WaitlistResponse {
  entries: WaitlistEntry[];
  total: number;
  page: number;
  limit: number;
}

const CAPACITY = 8;
const REFRESH_INTERVAL_MS = 60_000;

function formatRequestedDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WaitlistWidget() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        '/api/admin/waitlist?status=active&limit=3&sort_by=priority&sort_order=desc'
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: WaitlistResponse = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
      setLoadingState('loaded');
    } catch (err) {
      console.error('[WaitlistWidget] fetch error:', err);
      setLoadingState('error');
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Polling with visibility awareness
    let timer: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (!document.hidden) fetchData();
      }, REFRESH_INTERVAL_MS);
    };

    const handleVisibility = () => {
      if (!document.hidden) fetchData();
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchData]);

  const fillRate = Math.min((total / CAPACITY) * 100, 100);

  // Loading skeleton
  if (loadingState === 'loading') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-16 bg-[#EAE0D5] animate-pulse rounded" />
          <div className="h-5 w-6 bg-[#EAE0D5] animate-pulse rounded-full" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 w-full bg-[#EAE0D5] animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (loadingState === 'error') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#434E54] mb-3">Waitlist</h3>
        <p className="text-sm text-[#434E54]/60 mb-3">Failed to load waitlist</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 text-sm text-[#434E54] hover:underline"
          aria-label="Retry loading waitlist"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#434E54]">Waitlist</h3>
        <span className="bg-[#EAE0D5] text-[#434E54] text-xs font-medium px-2.5 py-0.5 rounded-full">
          {total}
        </span>
      </div>

      {/* Fill rate */}
      <div className="mb-4">
        <span className="text-xs text-[#434E54]/60 block mb-1">Fill Rate</span>
        <div className="h-2 rounded-full bg-[#EAE0D5] overflow-hidden">
          <div
            className="h-2 rounded-full bg-[#434E54] transition-all duration-500"
            style={{ width: `${fillRate}%` }}
            role="progressbar"
            aria-valuenow={Math.round(fillRate)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(fillRate)}% capacity filled`}
          />
        </div>
      </div>

      {/* Entry list or empty state */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-4 gap-2">
          <Bone className="w-8 h-8 text-[#EAE0D5]" aria-hidden="true" />
          <p className="text-sm text-[#434E54]/60">No one on the waitlist</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#EAE0D5] mb-3">
          {entries.map((entry) => {
            const firstName = entry.customer?.first_name ?? '';
            const lastName = entry.customer?.last_name ?? '';
            const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
            const petName = entry.pet?.name ?? '';

            return (
              <li key={entry.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#434E54] truncate">{customerName}</p>
                  {petName && (
                    <p className="text-xs text-[#434E54]/60 truncate">{petName}</p>
                  )}
                </div>
                <span className="text-xs text-[#434E54]/50 flex-shrink-0">
                  {formatRequestedDate(entry.requested_date)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* View All link */}
      <div className="flex justify-end">
        <Link
          href="/admin/waitlist"
          className="text-sm text-[#434E54] hover:underline"
          aria-label="View all waitlist entries"
        >
          View All
        </Link>
      </div>
    </div>
  );
}
