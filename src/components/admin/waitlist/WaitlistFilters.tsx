'use client';

import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import type { WaitlistStatus } from '@/types/database';

interface WaitlistFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  services: Array<{ id: string; name: string }>;
}

export interface FilterValues {
  status: WaitlistStatus[];
  service_id: string;
  start_date: string;
  end_date: string;
  search: string;
  sort_by: 'requested_date' | 'created_at' | 'priority';
  sort_order: 'asc' | 'desc';
}

const STATUS_OPTIONS: Array<{ value: WaitlistStatus; label: string; color: string }> = [
  { value: 'active', label: 'Active', color: 'badge-info' },
  { value: 'notified', label: 'Notified', color: 'badge-warning' },
  { value: 'booked', label: 'Booked', color: 'badge-success' },
  { value: 'expired', label: 'Expired', color: 'badge-ghost' },
  { value: 'cancelled', label: 'Cancelled', color: 'badge-error' },
];

const SORT_OPTIONS = [
  { value: 'requested_date', label: 'Requested Date' },
  { value: 'created_at', label: 'Added Date' },
  { value: 'priority', label: 'Priority' },
];

/**
 * WaitlistFilters - Filter controls for waitlist dashboard
 * Provides search, status, service, date range, and sort controls
 */
export function WaitlistFilters({ onFilterChange, services }: WaitlistFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    status: [],
    service_id: '',
    start_date: '',
    end_date: '',
    search: '',
    sort_by: 'requested_date',
    sort_order: 'asc',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleStatusToggle = (status: WaitlistStatus) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      service_id: '',
      start_date: '',
      end_date: '',
      search: '',
      sort_by: 'requested_date',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.service_id ||
    filters.start_date ||
    filters.end_date ||
    filters.search;

  return (
    <div className="space-y-4">
      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, pet, or phone..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input input-bordered w-full pl-10 pr-10"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: '' })}
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
          className={`btn btn-outline gap-2 ${hasActiveFilters ? 'btn-primary' : ''}`}
          aria-label="Toggle filters"
        >
          <Filter className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <span className="badge badge-sm badge-primary">
              {[
                filters.status.length,
                filters.service_id ? 1 : 0,
                filters.start_date ? 1 : 0,
                filters.end_date ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="btn btn-sm btn-ghost gap-2"
                  aria-label="Clear all filters"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              )}
            </div>

            {/* Status Multi-Select */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Status</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusToggle(option.value)}
                    className={`badge badge-lg gap-2 cursor-pointer ${
                      filters.status.includes(option.value)
                        ? option.color
                        : 'badge-outline'
                    }`}
                  >
                    {option.label}
                    {filters.status.includes(option.value) && (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Filter */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Service</span>
              </label>
              <select
                value={filters.service_id}
                onChange={(e) => setFilters({ ...filters, service_id: e.target.value })}
                className="select select-bordered w-full"
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Start Date</span>
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-medium">End Date</span>
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            {/* Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Sort By</span>
                </label>
                <select
                  value={filters.sort_by}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sort_by: e.target.value as FilterValues['sort_by'],
                    })
                  }
                  className="select select-bordered w-full"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-medium">Order</span>
                </label>
                <select
                  value={filters.sort_order}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sort_order: e.target.value as 'asc' | 'desc',
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
