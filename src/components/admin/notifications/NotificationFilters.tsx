'use client';

/**
 * NotificationFilters Component
 * Task 0064: Filter bar with search, channel, status, type, date range
 */

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { NotificationFilters as FilterValues } from '@/types/notifications';

interface NotificationFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export function NotificationFilters({
  onFilterChange,
  initialFilters = {},
}: NotificationFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced filter change (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  // Calculate active filter count
  const hasActiveFilters =
    !!filters.channel ||
    !!filters.status ||
    !!filters.type ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.search;

  const activeFilterCount = [
    filters.channel,
    filters.status,
    filters.type,
    filters.dateFrom,
    filters.dateTo,
    filters.search,
  ].filter(Boolean).length;

  function handleSearch() {
    setFilters({ ...filters, search: searchTerm });
  }

  function handleFilterChange(key: keyof FilterValues, value: string) {
    setFilters({ ...filters, [key]: value || undefined });
  }

  function clearSearch() {
    setSearchTerm('');
    setFilters({ ...filters, search: undefined });
  }

  function handleClearFilters() {
    setFilters({});
    setSearchTerm('');
  }

  return (
    <div className="space-y-4">
      {/* Search Bar Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input input-bordered w-full pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn gap-2 ${
            hasActiveFilters
              ? 'btn-primary bg-[#434E54] hover:bg-[#363F44] text-white'
              : 'btn-outline'
          }`}
        >
          <Filter className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <span className="badge badge-sm bg-white text-[#434E54]">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="card bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="card-body space-y-4">
            {/* Header with Clear All */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-[#434E54]">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="btn btn-sm btn-ghost gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Channel Dropdown */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Channel</span>
                </label>
                <select
                  value={filters.channel || ''}
                  onChange={(e) => handleFilterChange('channel', e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">All Channels</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Status</span>
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Type Dropdown */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">Type</span>
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">All Types</option>
                  <option value="appointment_booked">Appointment Booked</option>
                  <option value="appointment_confirmed">Confirmed</option>
                  <option value="appointment_reminder">Reminder</option>
                  <option value="appointment_cancelled">Cancelled</option>
                  <option value="appointment_completed">Completed</option>
                  <option value="report_card_sent">Report Card</option>
                  <option value="waitlist_slot_available">Slot Available</option>
                  <option value="breed_reminder">Grooming Reminder</option>
                  <option value="marketing_campaign">Marketing</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">From Date</span>
                </label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">To Date</span>
                </label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
