'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Grid3x3, List, Plus, Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StaffMemberWithStats, StaffDirectoryFilters, StaffViewMode } from '@/types/staff';
import { StaffForm } from './StaffForm';

interface StaffDirectoryProps {
  initialStaff?: StaffMemberWithStats[];
}

export function StaffDirectory({ initialStaff = [] }: StaffDirectoryProps) {
  const router = useRouter();

  // State
  const [staff, setStaff] = useState<StaffMemberWithStats[]>(initialStaff);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<StaffViewMode>('grid');
  const [filters, setFilters] = useState<StaffDirectoryFilters>({
    search: '',
    role: 'all',
    status: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showStaffForm, setShowStaffForm] = useState(false);

  // Debounced search (update filters.search after 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch staff when filters change
  useEffect(() => {
    fetchStaff();
  }, [filters.role, filters.status, filters.search]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role !== 'all') params.set('role', filters.role);
      if (filters.status !== 'all') params.set('status', filters.status);
      // Note: Backend doesn't support search yet, do client-side filtering

      const response = await fetch(`/api/admin/settings/staff?${params}`);
      const result = await response.json();

      if (response.ok) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filtering
  const filteredStaff = useMemo(() => {
    if (!filters.search) return staff;

    const searchLower = filters.search.toLowerCase();
    return staff.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      const email = s.email.toLowerCase();
      const phone = s.phone?.toLowerCase() || '';

      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchLower);
    });
  }, [staff, filters.search]);

  // Handlers
  const handleStaffClick = (staffId: string) => {
    router.push(`/admin/settings/staff/${staffId}`);
  };

  const handleCreateStaff = () => {
    setShowStaffForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54]">Staff Directory</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage your team members and their settings
          </p>
        </div>
        <button
          onClick={handleCreateStaff}
          className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] text-white border-none"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        {/* Search + View Toggle */}
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="input input-bordered w-full pl-10 bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="join">
            <button
              onClick={() => setViewMode('grid')}
              className={`btn join-item ${
                viewMode === 'grid'
                  ? 'btn-active bg-[#434E54] text-white'
                  : 'bg-white border-[#E5E5E5]'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn join-item ${
                viewMode === 'list'
                  ? 'btn-active bg-[#434E54] text-white'
                  : 'bg-white border-[#E5E5E5]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-4">
          {/* Role Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-sm font-medium text-[#434E54]">Role</span>
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value as any })}
              className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="groomer">Groomer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-sm font-medium text-[#434E54]">Status</span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex-1 text-sm text-[#6B7280] self-end pb-3">
            Showing {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Staff Content */}
      {loading ? (
        <StaffDirectorySkeleton viewMode={viewMode} />
      ) : filteredStaff.length === 0 ? (
        <StaffEmptyState hasSearch={!!filters.search} onClearSearch={() => setSearchInput('')} />
      ) : viewMode === 'grid' ? (
        <StaffGridView staff={filteredStaff} onStaffClick={handleStaffClick} />
      ) : (
        <StaffListView staff={filteredStaff} onStaffClick={handleStaffClick} />
      )}

      {/* Staff Form Modal */}
      {showStaffForm && (
        <StaffForm
          isOpen={showStaffForm}
          onClose={() => setShowStaffForm(false)}
          onSuccess={() => {
            setShowStaffForm(false);
            fetchStaff();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// Grid View Component
// ============================================

function StaffGridView({
  staff,
  onStaffClick
}: {
  staff: StaffMemberWithStats[];
  onStaffClick: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {staff.map((member) => (
          <motion.div
            key={member.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => onStaffClick(member.id)}
            className="card bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-[#434E54]/10"
          >
            <div className="card-body p-6">
              {/* Avatar + Name */}
              <div className="flex items-start gap-4 mb-4">
                <div className="avatar placeholder">
                  <div className="w-12 h-12 rounded-full bg-[#EAE0D5]">
                    <span className="text-lg font-semibold text-[#434E54]">
                      {member.first_name[0]}{member.last_name[0]}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#434E54] truncate">
                    {member.first_name} {member.last_name}
                  </h3>
                  <p className="text-sm text-[#6B7280] truncate">{member.email}</p>
                  {member.phone && (
                    <p className="text-xs text-[#9CA3AF]">{member.phone}</p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                <RoleBadge role={member.role} />
                <StatusBadge active={true} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="stat bg-[#F8EEE5] rounded-lg p-3">
                  <div className="stat-title text-xs text-[#6B7280]">Appointments</div>
                  <div className="stat-value text-lg text-[#434E54]">{member.appointment_count}</div>
                </div>
                <div className="stat bg-[#F8EEE5] rounded-lg p-3">
                  <div className="stat-title text-xs text-[#6B7280]">Avg Rating</div>
                  <div className="stat-value text-lg text-[#434E54] flex items-center gap-1">
                    {member.avg_rating ? (
                      <>
                        <Star className="w-4 h-4 fill-[#FFB347] text-[#FFB347]" />
                        {member.avg_rating.toFixed(1)}
                      </>
                    ) : (
                      <span className="text-sm text-[#9CA3AF]">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Upcoming Appointments */}
              {member.upcoming_appointments > 0 && (
                <div className="alert alert-info bg-[#74B9FF]/10 border-[#74B9FF]/20 mt-3">
                  <span className="text-xs text-[#434E54]">
                    {member.upcoming_appointments} upcoming appointment{member.upcoming_appointments !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// List View Component
// ============================================

function StaffListView({
  staff,
  onStaffClick
}: {
  staff: StaffMemberWithStats[];
  onStaffClick: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="bg-[#EAE0D5]">
            <tr>
              <th className="text-[#434E54]">Name</th>
              <th className="text-[#434E54]">Contact</th>
              <th className="text-[#434E54]">Role</th>
              <th className="text-[#434E54]">Status</th>
              <th className="text-[#434E54] text-center">Appointments</th>
              <th className="text-[#434E54] text-center">Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr
                key={member.id}
                onClick={() => onStaffClick(member.id)}
                className="hover:bg-[#F8EEE5]/50 cursor-pointer transition-colors"
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="w-10 h-10 rounded-full bg-[#EAE0D5]">
                        <span className="text-sm font-semibold text-[#434E54]">
                          {member.first_name[0]}{member.last_name[0]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-[#434E54]">
                        {member.first_name} {member.last_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="text-sm text-[#6B7280]">{member.email}</div>
                  {member.phone && (
                    <div className="text-xs text-[#9CA3AF]">{member.phone}</div>
                  )}
                </td>
                <td>
                  <RoleBadge role={member.role} />
                </td>
                <td>
                  <StatusBadge active={true} />
                </td>
                <td className="text-center">
                  <span className="font-medium text-[#434E54]">{member.appointment_count}</span>
                </td>
                <td className="text-center">
                  {member.avg_rating ? (
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-[#FFB347] text-[#FFB347]" />
                      <span className="font-medium text-[#434E54]">{member.avg_rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Badge Components
// ============================================

function RoleBadge({ role }: { role: 'admin' | 'groomer' }) {
  const config = {
    admin: {
      label: 'Admin',
      className: 'badge badge-primary bg-purple-100 text-purple-700 border-purple-200',
    },
    groomer: {
      label: 'Groomer',
      className: 'badge badge-info bg-blue-100 text-blue-700 border-blue-200',
    },
  };

  const { label, className } = config[role];

  return <span className={`${className} badge-sm`}>{label}</span>;
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="badge badge-success bg-green-100 text-green-700 border-green-200 badge-sm">
      Active
    </span>
  ) : (
    <span className="badge badge-ghost bg-gray-100 text-gray-600 border-gray-200 badge-sm">
      Inactive
    </span>
  );
}

// ============================================
// Empty State Component
// ============================================

function StaffEmptyState({
  hasSearch,
  onClearSearch
}: {
  hasSearch: boolean;
  onClearSearch: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-[#434E54]" />
        </div>
        <h3 className="text-lg font-semibold text-[#434E54] mb-2">
          {hasSearch ? 'No staff members found' : 'No staff members yet'}
        </h3>
        <p className="text-sm text-[#6B7280] mb-6">
          {hasSearch
            ? 'Try adjusting your search or filters to find staff members.'
            : 'Add your first staff member to get started with team management.'}
        </p>
        {hasSearch && (
          <button onClick={onClearSearch} className="btn btn-outline btn-sm">
            Clear Search
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Loading Skeleton Component
// ============================================

function StaffDirectorySkeleton({ viewMode }: { viewMode: StaffViewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card bg-white shadow-sm">
            <div className="card-body p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="skeleton w-12 h-12 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-3 w-48"></div>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="skeleton h-6 w-16"></div>
                <div className="skeleton h-6 w-16"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton h-16 rounded-lg"></div>
                <div className="skeleton h-16 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="bg-[#EAE0D5]">
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Appointments</th>
              <th>Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-full shrink-0"></div>
                    <div className="skeleton h-4 w-32"></div>
                  </div>
                </td>
                <td><div className="skeleton h-3 w-40"></div></td>
                <td><div className="skeleton h-6 w-16"></div></td>
                <td><div className="skeleton h-6 w-16"></div></td>
                <td><div className="skeleton h-4 w-8 mx-auto"></div></td>
                <td><div className="skeleton h-4 w-8 mx-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
