'use client';

import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

export interface FilterOptions {
  search: string;
  channel: 'all' | 'email' | 'sms';
  status: 'all' | 'active' | 'inactive';
}

interface TemplateFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export function TemplateFilters({ filters, onFilterChange }: TemplateFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onFilterChange({ ...filters, search: value });
  };

  const handleChannelChange = (channel: FilterOptions['channel']) => {
    onFilterChange({ ...filters, channel });
  };

  const handleStatusChange = (status: FilterOptions['status']) => {
    onFilterChange({ ...filters, status });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[#9CA3AF]" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name or trigger event..."
            className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     placeholder:text-gray-400 transition-colors duration-200"
          />
        </div>

        {/* Channel Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#6B7280]" />
          <select
            value={filters.channel}
            onChange={(e) => handleChannelChange(e.target.value as FilterOptions['channel'])}
            className="select select-bordered border-gray-200 bg-white focus:outline-none
                     focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]"
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value as FilterOptions['status'])}
            className="select select-bordered border-gray-200 bg-white focus:outline-none
                     focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
}
