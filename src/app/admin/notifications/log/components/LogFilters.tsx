/**
 * Notification Log Filters Component
 * Task 0146: Filter controls with search, type, channel, status, date range
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import type { NotificationLogFilters } from '@/types/notification-log';
import type { NotificationChannel, NotificationStatus } from '@/types/database';
import {
  TRANSACTIONAL_NOTIFICATION_TYPES,
  MARKETING_NOTIFICATION_TYPES,
} from '@/types/preferences';

interface LogFiltersProps {
  filters: NotificationLogFilters;
  onFilterChange: (filters: NotificationLogFilters) => void;
  onApplyFilters: () => void;
}

export function LogFilters({ filters, onFilterChange, onApplyFilters }: LogFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleChannelChange = (channel: NotificationChannel | 'all') => {
    onFilterChange({ ...filters, channel });
  };

  const handleStatusChange = (status: NotificationStatus | 'all') => {
    onFilterChange({ ...filters, status });
  };

  const handleTypeChange = (type: string) => {
    onFilterChange({ ...filters, type: type || undefined });
  };

  const handleStartDateChange = (date: string) => {
    onFilterChange({ ...filters, start_date: date || undefined });
  };

  const handleEndDateChange = (date: string) => {
    onFilterChange({ ...filters, end_date: date || undefined });
  };

  const clearFilters = () => {
    setSearchInput('');
    onFilterChange({
      search: undefined,
      type: undefined,
      channel: 'all',
      status: 'all',
      start_date: undefined,
      end_date: undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.type ||
    (filters.channel && filters.channel !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    filters.start_date ||
    filters.end_date;

  // All notification types
  const allNotificationTypes = [
    ...TRANSACTIONAL_NOTIFICATION_TYPES,
    ...MARKETING_NOTIFICATION_TYPES,
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      {/* Search Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#434E54] mb-2">
          Search Recipient
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email or phone..."
            className="input input-bordered w-full pl-10 bg-white border-gray-200
                     focus:border-[#434E54] focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-[#434E54] mb-2">Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="select select-bordered w-full bg-white border-gray-200
                     focus:border-[#434E54] focus:outline-none"
          >
            <option value="">All Types</option>
            <optgroup label="Transactional">
              {TRANSACTIONAL_NOTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatNotificationType(type)}
                </option>
              ))}
            </optgroup>
            <optgroup label="Marketing">
              {MARKETING_NOTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatNotificationType(type)}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Channel Filter */}
        <div>
          <label className="block text-sm font-medium text-[#434E54] mb-2">Channel</label>
          <select
            value={filters.channel || 'all'}
            onChange={(e) => handleChannelChange(e.target.value as NotificationChannel | 'all')}
            className="select select-bordered w-full bg-white border-gray-200
                     focus:border-[#434E54] focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="email">📧 Email</option>
            <option value="sms">📱 SMS</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-[#434E54] mb-2">Status</label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleStatusChange(e.target.value as NotificationStatus | 'all')}
            className="select select-bordered w-full bg-white border-gray-200
                     focus:border-[#434E54] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="sent">✅ Delivered</option>
            <option value="failed">❌ Failed</option>
            <option value="pending">⏳ Pending</option>
          </select>
        </div>

        {/* Date Range (Start) */}
        <div>
          <label className="block text-sm font-medium text-[#434E54] mb-2">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={filters.start_date ? filters.start_date.split('T')[0] : ''}
              onChange={(e) =>
                handleStartDateChange(e.target.value ? `${e.target.value}T00:00:00` : '')
              }
              className="input input-bordered w-full pl-10 bg-white border-gray-200
                       focus:border-[#434E54] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Date Range (End) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-[#434E54] mb-2">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={filters.end_date ? filters.end_date.split('T')[0] : ''}
              onChange={(e) =>
                handleEndDateChange(e.target.value ? `${e.target.value}T23:59:59` : '')
              }
              className="input input-bordered w-full pl-10 bg-white border-gray-200
                       focus:border-[#434E54] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-[#434E54]">Active Filters:</span>

          {filters.search && (
            <FilterChip
              label={`Search: "${filters.search}"`}
              onRemove={() => {
                setSearchInput('');
                onFilterChange({ ...filters, search: undefined });
              }}
            />
          )}

          {filters.type && (
            <FilterChip
              label={`Type: ${formatNotificationType(filters.type)}`}
              onRemove={() => onFilterChange({ ...filters, type: undefined })}
            />
          )}

          {filters.channel && filters.channel !== 'all' && (
            <FilterChip
              label={`Channel: ${filters.channel.toUpperCase()}`}
              onRemove={() => onFilterChange({ ...filters, channel: 'all' })}
            />
          )}

          {filters.status && filters.status !== 'all' && (
            <FilterChip
              label={`Status: ${filters.status}`}
              onRemove={() => onFilterChange({ ...filters, status: 'all' })}
            />
          )}

          {filters.start_date && (
            <FilterChip
              label={`From: ${filters.start_date.split('T')[0]}`}
              onRemove={() => onFilterChange({ ...filters, start_date: undefined })}
            />
          )}

          {filters.end_date && (
            <FilterChip
              label={`Until: ${filters.end_date.split('T')[0]}`}
              onRemove={() => onFilterChange({ ...filters, end_date: undefined })}
            />
          )}

          <button
            onClick={clearFilters}
            className="text-sm text-[#434E54] hover:text-[#363F44] font-medium underline"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Filter Chip Component
 */
interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE0D5] text-sm font-medium text-[#434E54]">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-[#DCD2C7] rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Format notification type for display
 */
function formatNotificationType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
