/**
 * CustomerTable Component
 * Displays customer list with search, infinite scroll, and sorting
 * Task 0017: Create CustomerTable component
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { CustomerFlagBadge } from './CustomerFlagBadge';
import { SearchFilterBar } from '@/components/admin/shared';
import { isWalkinPlaceholderEmail } from '@/lib/utils';
import type { User, CustomerFlag } from '@/types/database';

/**
 * Security: Escape special regex characters to prevent ReDoS attacks
 * @param text - User input to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface CustomerWithStats extends User {
  pets_count: number;
  appointments_count: number;
  flags: CustomerFlag[];
}

interface CustomerTableProps {
  onCustomerClick?: (customerId: string) => void;
}

type SortField = 'name' | 'email' | 'appointments' | 'join_date';

export function CustomerTable({ onCustomerClick }: CustomerTableProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Refs for IntersectionObserver — avoid recreating observer on every loading state change
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  // Derive hasMore — avoids extra setState call
  const hasMore = customers.length < totalCount;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCustomers = useCallback(async () => {
    if (page === 1) {
      setLoading(true);
      loadingRef.current = true;
    } else {
      setLoadingMore(true);
      loadingMoreRef.current = true;
    }
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) params.append('search', debouncedSearch);

      const response = await fetch(`/api/admin/customers?${params}`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to fetch customers');

      if (page === 1) {
        setCustomers(result.data);
      } else {
        setCustomers((curr) => [...curr, ...result.data]);
      }
      setTotalCount(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [page, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // IntersectionObserver for infinite scroll — re-observes when sentinel mounts/unmounts
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && !loadingMoreRef.current) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleRowClick = (customerId: string) => {
    if (onCustomerClick) {
      onCustomerClick(customerId);
    } else {
      router.push(`/admin/customers/${customerId}`);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-[#434E54]" />
    ) : (
      <ArrowDown className="w-4 h-4 text-[#434E54]" />
    );
  };

  // Highlight search terms
  // Security: Protected against XSS and ReDoS attacks
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    try {
      // Security: Escape user input to prevent RegEx injection
      const escapedQuery = escapeRegExp(searchQuery);
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
      return parts.map((part, index) =>
        part.toLowerCase() === escapedQuery.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 text-[#434E54] font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      // Security: If regex fails, return text unstyled to prevent crashes
      return text;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, phone, or pet name..."
        actions={
          searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#434E54]/40 hover:text-[#434E54]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : undefined
        }
      />

      {/* Results Count */}
      <p className="text-sm text-gray-600">
        {loading ? 'Loading...' : `${totalCount} ${totalCount === 1 ? 'customer' : 'customers'}`}
      </p>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#EAE0D5] border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-sm font-semibold text-[#434E54] hover:text-[#363F44] transition-colors"
                  >
                    Name
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-2 text-sm font-semibold text-[#434E54] hover:text-[#363F44] transition-colors"
                  >
                    Email
                    {getSortIcon('email')}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#434E54]">Phone</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-[#434E54]">Pets</th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => handleSort('appointments')}
                    className="flex items-center gap-2 text-sm font-semibold text-[#434E54] hover:text-[#363F44] transition-colors mx-auto"
                  >
                    Appointments
                    {getSortIcon('appointments')}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#434E54]">Flags</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <span className="loading loading-spinner loading-lg text-[#434E54]" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-gray-300" />
                      <div>
                        <p className="font-medium text-gray-900">No customers found</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {searchQuery
                            ? 'Try adjusting your search criteria'
                            : 'No customers have registered yet'}
                        </p>
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-4 py-2 rounded-lg bg-[#434E54] text-white font-medium hover:bg-[#363F44] transition-colors"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => handleRowClick(customer.id)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#434E54]">
                        {highlightText(`${customer.first_name} ${customer.last_name}`)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {isWalkinPlaceholderEmail(customer.email) ? (
                          <span className="text-gray-400 italic">Walk-in (phone only)</span>
                        ) : (
                          highlightText(customer.email)
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {customer.phone ? highlightText(customer.phone) : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#EAE0D5] text-[#434E54] text-sm font-medium">
                        {customer.pets_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-700 font-medium">
                        {customer.appointments_count}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <CustomerFlagBadge flags={customer.flags} maxVisible={2} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infinite scroll sentinel — only mounted when more rows exist */}
      {hasMore && <div ref={sentinelRef} />}

      {/* Load-more status */}
      <div className="py-4 text-center">
        {loadingMore && (
          <span className="loading loading-spinner loading-md text-[#434E54]" />
        )}
        {!hasMore && customers.length > 0 && !loading && (
          <p className="text-sm text-[#6B7280]">All {totalCount} customers loaded</p>
        )}
      </div>
    </div>
  );
}
