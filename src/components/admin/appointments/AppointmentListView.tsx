/**
 * AppointmentListView Component
 * Tabular list view of appointments with search, filters, and pagination
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, Calendar, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getStatusBadgeColor, getStatusLabel } from '@/lib/admin/appointment-status';
import type { Appointment, AppointmentStatus } from '@/types/database';
import { getTodayInBusinessTimezone } from '@/lib/utils/timezone';

interface AppointmentListViewProps {
  onRowClick: (appointmentId: string) => void;
}

interface Filters {
  status: AppointmentStatus | '';
  service: string;
  dateFrom: string;
  dateTo: string;
}

const DATE_RANGE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Custom', value: 'custom' },
] as const;

export function AppointmentListView({ onRowClick }: AppointmentListViewProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({
    status: '',
    service: '',
    dateFrom: '',
    dateTo: '',
  });
  const [datePreset, setDatePreset] = useState<string>('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<'scheduled_at' | 'customer' | 'status'>('scheduled_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [services, setServices] = useState<any[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch services for filter dropdown
  useEffect(() => {
    async function fetchServices() {
      try {
        if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
          const { getMockStore } = await import('@/mocks/supabase/store');
          const store = getMockStore();
          const allServices = store.select('services');
          setServices(allServices);
        }
      } catch (error) {
        console.error('[AppointmentListView] Error fetching services:', error);
      }
    }
    fetchServices();
  }, []);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (filters.status) {
        params.append('status', filters.status);
      }

      if (filters.service) {
        params.append('service', filters.service);
      }

      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }

      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await fetch(`/api/admin/appointments?${params}`);
      const result = await response.json();

      if (response.ok) {
        setAppointments(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalCount(result.pagination?.total || 0);
      }
    } catch (error) {
      console.error('[AppointmentListView] Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Handle date preset change
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();

    switch (preset) {
      case 'today': {
        setFilters((prev) => ({
          ...prev,
          dateFrom: todayStart,
          dateTo: todayEnd,
        }));
        setShowCustomDate(false);
        break;
      }
      case 'tomorrow': {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);
        setFilters((prev) => ({
          ...prev,
          dateFrom: tomorrow.toISOString(),
          dateTo: tomorrowEnd.toISOString(),
        }));
        setShowCustomDate(false);
        break;
      }
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        setFilters((prev) => ({
          ...prev,
          dateFrom: startOfWeek.toISOString(),
          dateTo: endOfWeek.toISOString(),
        }));
        setShowCustomDate(false);
        break;
      }
      case 'this_month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        setFilters((prev) => ({
          ...prev,
          dateFrom: startOfMonth.toISOString(),
          dateTo: endOfMonth.toISOString(),
        }));
        setShowCustomDate(false);
        break;
      }
      case 'custom':
        setShowCustomDate(true);
        break;
      default:
        setFilters((prev) => ({
          ...prev,
          dateFrom: '',
          dateTo: '',
        }));
        setShowCustomDate(false);
    }
    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      status: '',
      service: '',
      dateFrom: '',
      dateTo: '',
    });
    setDatePreset('');
    setShowCustomDate(false);
    setPage(1);
  };

  // Handle sort
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const hasActiveFilters = useMemo(
    () =>
      searchQuery ||
      filters.status ||
      filters.service ||
      filters.dateFrom ||
      filters.dateTo,
    [searchQuery, filters]
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#434E54]">Appointments List</h2>
        <div className="text-sm text-[#6B7280]">
          {totalCount} {totalCount === 1 ? 'appointment' : 'appointments'}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by customer name, pet name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     placeholder:text-gray-400 transition-colors duration-200"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, status: e.target.value as AppointmentStatus | '' }));
              setPage(1);
            }}
            className="select select-bordered bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          {/* Service Filter */}
          <select
            value={filters.service}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, service: e.target.value }));
              setPage(1);
            }}
            className="select select-bordered bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
          >
            <option value="">All Services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>

          {/* Date Range Preset */}
          <select
            value={datePreset}
            onChange={(e) => handleDatePresetChange(e.target.value)}
            className="select select-bordered bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
          >
            <option value="">All Dates</option>
            {DATE_RANGE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>

          {/* Custom Date Inputs */}
          {showCustomDate && (
            <>
              <input
                type="date"
                value={filters.dateFrom ? format(new Date(filters.dateFrom), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value).toISOString() : '';
                  setFilters((prev) => ({ ...prev, dateFrom: date }));
                  setPage(1);
                }}
                className="input input-bordered bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
              />
              <input
                type="date"
                value={filters.dateTo ? format(new Date(filters.dateTo), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value).toISOString() : '';
                  setFilters((prev) => ({ ...prev, dateTo: date }));
                  setPage(1);
                }}
                className="input input-bordered bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
              />
            </>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5]"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-[#F8EEE5]">
              <th
                className="cursor-pointer hover:bg-[#EAE0D5] transition-colors"
                onClick={() => handleSort('scheduled_at')}
              >
                <div className="flex items-center gap-2">
                  Date/Time
                  {sortBy === 'scheduled_at' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-[#EAE0D5] transition-colors"
                onClick={() => handleSort('customer')}
              >
                <div className="flex items-center gap-2">
                  Customer
                  {sortBy === 'customer' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th>Pet</th>
              <th>Service</th>
              <th
                className="cursor-pointer hover:bg-[#EAE0D5] transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {sortBy === 'status' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <span className="loading loading-spinner loading-lg text-[#434E54]" />
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="text-[#6B7280]">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No appointments found</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-[#434E54] hover:underline text-sm"
                      >
                        Clear filters to see all appointments
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              appointments.map((apt) => (
                <tr
                  key={apt.id}
                  className="hover:bg-[#FFFBF7] cursor-pointer transition-colors"
                  onClick={() => onRowClick(apt.id)}
                >
                  <td>
                    <div className="font-medium text-[#434E54]">
                      {format(new Date(apt.scheduled_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      {format(new Date(apt.scheduled_at), 'h:mm a')}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium text-[#434E54]">
                      {apt.customer
                        ? `${apt.customer.first_name} ${apt.customer.last_name}`
                        : 'Unknown'}
                    </div>
                    <div className="text-sm text-[#6B7280]">{apt.customer?.email}</div>
                  </td>
                  <td className="text-[#434E54]">{apt.pet?.name || 'Unknown'}</td>
                  <td className="text-[#434E54]">{apt.service?.name || 'Unknown'}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(apt.id);
                      }}
                      className="btn btn-sm btn-ghost text-[#434E54] hover:bg-[#EAE0D5]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-[#6B7280]">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] disabled:bg-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] disabled:bg-gray-300"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
