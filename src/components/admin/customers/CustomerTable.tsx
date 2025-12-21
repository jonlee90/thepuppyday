/**
 * CustomerTable Component
 * Displays customer list with search, pagination, and sorting
 * Task 0017: Create CustomerTable component
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { CustomerFlagBadge } from './CustomerFlagBadge';
import { isWalkinPlaceholderEmail } from '@/lib/utils';
import type { User, CustomerFlag, CustomerMembership } from '@/types/database';

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
  active_membership: CustomerMembership | null;
}

interface CustomerTableProps {
  onCustomerClick?: (customerId: string) => void;
  initialCustomers?: CustomerWithStats[];
}

type SortField = 'name' | 'email' | 'appointments' | 'join_date';
type SortOrder = 'asc' | 'desc';

export function CustomerTable({ onCustomerClick, initialCustomers = [] }: CustomerTableProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithStats[]>(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialCustomers.length);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const ITEMS_PER_PAGE = 50;

  // Fetch customers - only when search/sort/page changes
  useEffect(() => {
    if (searchQuery || currentPage > 1 || sortBy !== 'name' || sortOrder !== 'asc') {
      fetchCustomers();
    }
  }, [searchQuery, currentPage, sortBy, sortOrder]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customers');
      }

      setCustomers(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleRowClick = (customerId: string) => {
    if (onCustomerClick) {
      onCustomerClick(customerId);
    } else {
      router.push(`/admin/customers/${customerId}`);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
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
    } catch (error) {
      // Security: If regex fails, return text unstyled to prevent crashes
      console.error('Error highlighting text:', error);
      return text;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, phone, or pet name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors"
          />
        </div>
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-[#434E54]
                       font-medium hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading ? (
            'Loading...'
          ) : (
            <>
              Showing {customers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} customers
            </>
          )}
        </p>
      </div>

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
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#434E54]">Member</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#434E54] rounded-full animate-spin" />
                      <span>Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
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
                          onClick={handleClearSearch}
                          className="px-4 py-2 rounded-lg bg-[#434E54] text-white font-medium
                                     hover:bg-[#363F44] transition-colors"
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
                    <td className="py-3 px-4">
                      {customer.active_membership ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200
                       text-[#434E54] font-medium hover:bg-gray-50 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`
                    w-10 h-10 rounded-lg font-medium transition-colors
                    ${
                      currentPage === pageNumber
                        ? 'bg-[#434E54] text-white'
                        : 'bg-white border border-gray-200 text-[#434E54] hover:bg-gray-50'
                    }
                  `}
                >
                  {pageNumber}
                </button>
              );
            })}
            {totalPages > 5 && <span className="text-gray-400">...</span>}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200
                       text-[#434E54] font-medium hover:bg-gray-50 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
