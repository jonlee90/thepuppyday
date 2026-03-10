'use client';

import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminButton } from '@/components/admin/ui/AdminButton';
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

const STATUS_OPTIONS: Array<{ value: WaitlistStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'notified', label: 'Notified' },
  { value: 'booked', label: 'Booked' },
  { value: 'expired', label: 'Expired' },
  { value: 'expired_offer', label: 'Expired Offer' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_SELECTED_STYLES: Record<WaitlistStatus, string> = {
  active: 'bg-blue-50 text-blue-700 border border-blue-100',
  notified: 'bg-amber-50 text-amber-700 border border-amber-100',
  booked: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  expired: 'bg-gray-100 text-gray-500 border border-gray-200',
  expired_offer: 'bg-gray-100 text-gray-500 border border-gray-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-100',
};

const SORT_OPTIONS = [
  { value: 'requested_date', label: 'Requested Date' },
  { value: 'created_at', label: 'Added Date' },
  { value: 'priority', label: 'Priority' },
];

const INPUT_CLASS =
  'w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors text-sm';

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

  const activeFilterCount = [
    filters.status.length,
    filters.service_id ? 1 : 0,
    filters.start_date ? 1 : 0,
    filters.end_date ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#434E54]/40" />
          <input
            type="text"
            placeholder="Search by customer, pet, or phone..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className={`${INPUT_CLASS} pl-10 pr-10`}
          />
          {filters.search ? (
            <button
              onClick={() => setFilters({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#434E54]/40 hover:text-[#434E54]/60"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors ${
            hasActiveFilters
              ? 'bg-[#434E54] text-white border-[#434E54] hover:bg-[#363F44]'
              : 'border-[#434E54]/20 bg-white text-[#434E54] hover:bg-[#EAE0D5]'
          }`}
          aria-label="Toggle filters"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters ? (
            <span className="ml-1 bg-white text-[#434E54] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Expandable Filter Panel */}
      <AnimatePresence>
        {showFilters ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-[#434E54]/10 shadow-sm">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-base text-[#434E54]">Filters</h3>
                  {hasActiveFilters ? (
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      aria-label="Clear all filters"
                    >
                      <X className="h-4 w-4" />
                      Clear All
                    </AdminButton>
                  ) : null}
                </div>

                {/* Status Multi-Select */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((option) => {
                      const isSelected = filters.status.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleStatusToggle(option.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? STATUS_SELECTED_STYLES[option.value]
                              : 'border-[#434E54]/20 text-[#434E54]/60 hover:border-[#434E54]/40'
                          }`}
                        >
                          {option.label}
                          {isSelected ? <X className="h-3 w-3" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Service Filter */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Service
                  </label>
                  <select
                    value={filters.service_id}
                    onChange={(e) => setFilters({ ...filters, service_id: e.target.value })}
                    className={INPUT_CLASS}
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
                    <label className="block text-sm font-medium text-[#434E54] mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* Sort Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-2">
                      Sort By
                    </label>
                    <select
                      value={filters.sort_by}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          sort_by: e.target.value as FilterValues['sort_by'],
                        })
                      }
                      className={INPUT_CLASS}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-2">
                      Order
                    </label>
                    <select
                      value={filters.sort_order}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          sort_order: e.target.value as 'asc' | 'desc',
                        })
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
