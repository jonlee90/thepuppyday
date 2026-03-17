'use client';

import React from 'react';
import { Search } from 'lucide-react';

export interface FilterConfig {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

export interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  actions?: React.ReactNode;
  className?: string;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  className = '',
}: SearchFilterBarProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 items-stretch sm:items-center ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#434E54]/40 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] placeholder:text-[#434E54]/40 focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 text-sm"
        />
      </div>
      {filters?.map((filter) => (
        <select
          key={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          aria-label={filter.label}
          className="px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] text-sm focus:outline-none focus:ring-2 focus:ring-[#434E54]/30"
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {actions && <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>}
    </div>
  );
}
