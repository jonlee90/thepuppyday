'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Search, Grid3x3, List, Plus, Star, MoreVertical, PawPrint, Pencil, Trash2, Mail, Scissors, Shield } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { motion, AnimatePresence } from 'framer-motion';
import type { StaffMemberWithStats, StaffDirectoryFilters, StaffViewMode } from '@/types/staff';
import { StaffForm } from './StaffForm';
import { toast } from '@/hooks/use-toast';

const EMPTY_STAFF: StaffMemberWithStats[] = [];

interface StaffDirectoryProps {
  initialStaff?: StaffMemberWithStats[];
  onStaffCountChange?: (count: number) => void;
}

export function StaffDirectory({ initialStaff = EMPTY_STAFF, onStaffCountChange }: StaffDirectoryProps) {
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
  const [editStaffId, setEditStaffId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<StaffMemberWithStats | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchStaff();
  }, [filters.role, filters.status, filters.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role !== 'all') params.set('role', filters.role);
      if (filters.status !== 'all') params.set('status', filters.status);

      const response = await fetch(`/api/admin/settings/staff?${params}`);
      const result = await response.json();

      if (response.ok) {
        setStaff(result.data);
        onStaffCountChange?.(result.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleEditStaff = useCallback((staffId: string) => {
    setEditStaffId(staffId);
    setShowStaffForm(true);
  }, []);

  const handleDeleteStaff = useCallback((member: StaffMemberWithStats) => {
    setDeleteTarget(member);
  }, []);

  const handleCreateStaff = () => {
    setEditStaffId(undefined);
    setShowStaffForm(true);
  };

  const handleCloseForm = () => {
    setShowStaffForm(false);
    setEditStaffId(undefined);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/settings/staff/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to deactivate');
      }
      toast.success(`${deleteTarget.first_name} ${deleteTarget.last_name} deactivated`);
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      console.error('[StaffDirectory] delete error:', err);
      toast.error('Failed to deactivate staff member');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="border-b border-[#E5E5E5] pb-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="input input-bordered w-full pl-10 bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="join">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
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
                aria-label="List view"
                className={`btn join-item ${
                  viewMode === 'list'
                    ? 'btn-active bg-[#434E54] text-white'
                    : 'bg-white border-[#E5E5E5]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <AdminButton
              variant="primary"
              onClick={handleCreateStaff}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Staff Member</span>
            </AdminButton>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="form-control">
            <label className="label py-0 mb-1">
              <span className="label-text text-sm font-medium text-[#434E54]">Role</span>
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as StaffDirectoryFilters['role'] }))}
              className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="groomer">Groomer</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label py-0 mb-1">
              <span className="label-text text-sm font-medium text-[#434E54]">Status</span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as StaffDirectoryFilters['status'] }))}
              className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:flex-1 text-sm text-[#6B7280] sm:self-end sm:pb-2">
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
        <StaffGridView
          staff={filteredStaff}
          onEdit={handleEditStaff}
          onDelete={handleDeleteStaff}
        />
      ) : (
        <StaffListView
          staff={filteredStaff}
          onEdit={handleEditStaff}
          onDelete={handleDeleteStaff}
        />
      )}

      {showStaffForm && (
        <StaffForm
          staffId={editStaffId}
          isOpen={showStaffForm}
          onClose={handleCloseForm}
          onSuccess={() => {
            handleCloseForm();
            fetchStaff();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          member={deleteTarget}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Action Menu Component (list view)
// ============================================

function StaffActionMenu({
  member,
  onEdit,
  onDelete,
}: {
  member: StaffMemberWithStats;
  onEdit: (id: string) => void;
  onDelete: (member: StaffMemberWithStats) => void;
}) {
  return (
    <div className="dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
      <button
        tabIndex={0}
        aria-label={`Actions for ${member.first_name} ${member.last_name}`}
        className="btn btn-ghost btn-xs btn-circle focus-visible:ring-2 focus-visible:ring-[#434E54] focus-visible:ring-offset-2 outline-none"
      >
        <MoreVertical className="w-4 h-4 text-[#6B7280]" />
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-1 shadow-md bg-white rounded-lg border border-[#E5E5E5] w-36 z-10"
      >
        <li>
          <button
            onClick={() => onEdit(member.id)}
            className="flex items-center gap-2 text-sm text-[#434E54] hover:bg-[#F8EEE5] rounded-md px-3 py-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </li>
        <li>
          <button
            onClick={() => onDelete(member)}
            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 rounded-md px-3 py-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Deactivate
          </button>
        </li>
      </ul>
    </div>
  );
}

// ============================================
// Grid View Component
// ============================================

const StaffGridView = memo(function StaffGridView({
  staff,
  onEdit,
  onDelete,
}: {
  staff: StaffMemberWithStats[];
  onEdit: (id: string) => void;
  onDelete: (member: StaffMemberWithStats) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {staff.map((member, index) => (
          <StaffCard
            key={member.id}
            member={member}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

// ============================================
// Staff Card Component
// ============================================

const StaffCard = memo(function StaffCard({
  member,
  index,
  onEdit,
  onDelete,
}: {
  member: StaffMemberWithStats;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (member: StaffMemberWithStats) => void;
}) {
  const isAdmin = member.role === 'admin';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="group relative rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      aria-label={`${member.first_name} ${member.last_name}, ${member.role}`}
      onClick={() => onEdit(member.id)}
    >
      {/* Role accent strip */}
      <div className={`h-1.5 w-full ${
        isAdmin
          ? 'bg-gradient-to-r from-[#434E54] to-[#5A6970]'
          : 'bg-gradient-to-r from-[#D4A574] to-[#E8C49A]'
      }`} />

      {/* Live status dot */}
      <div className="absolute top-4 right-4">
        {member.is_active ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        ) : (
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-gray-300 opacity-40" />
        )}
      </div>

      <div className="p-5">
        {/* Avatar + Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#EAE0D5] to-[#D4C4B4] shadow-inner flex items-center justify-center">
              <span className="text-lg font-semibold text-[#434E54]">
                {member.first_name[0]}{member.last_name[0]}
              </span>
            </div>
            {/* Role icon badge */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${
              isAdmin ? 'bg-[#434E54]' : 'bg-[#D4A574]'
            }`}>
              {isAdmin
                ? <Shield className="w-2.5 h-2.5 text-white" />
                : <Scissors className="w-2.5 h-2.5 text-white" />
              }
            </div>
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-semibold text-[#434E54] truncate">
              {member.first_name} {member.last_name}
            </h3>
            <p className={`text-xs font-medium mt-0.5 ${isAdmin ? 'text-[#5A6970]' : 'text-[#8B7355]'}`}>
              {isAdmin ? 'Administrator' : 'Groomer'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Mail className="w-3 h-3 text-[#9CA3AF] shrink-0" />
              <p className="text-xs text-[#9CA3AF] truncate">{member.email}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center border-t border-[#F0EAE0] pt-4 mt-1">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-[#434E54]">{member.appointment_count}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mt-0.5">Grooms</div>
          </div>

          <div className="w-px h-8 bg-[#F0EAE0]" />

          <div className="flex-1 text-center">
            {member.avg_rating ? (
              <>
                <div className="text-2xl font-bold text-[#434E54] flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-[#FFB347] text-[#FFB347]" />
                  {member.avg_rating.toFixed(1)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mt-0.5">Rating</div>
              </>
            ) : (
              <>
                <div className="text-sm text-[#9CA3AF]">—</div>
                <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mt-0.5">Rating</div>
              </>
            )}
          </div>

          {member.upcoming_appointments > 0 && (
            <>
              <div className="w-px h-8 bg-[#F0EAE0]" />
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-[#434E54]">{member.upcoming_appointments}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mt-0.5">Upcoming</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-[#F0EAE0]">
        <div className="flex">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(member.id); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[#434E54] hover:bg-[#F8EEE5] active:bg-[#F8EEE5] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <div className="w-px bg-[#F0EAE0]" />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(member); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-400 hover:bg-red-50 active:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Deactivate
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// List View Component
// ============================================

const StaffListView = memo(function StaffListView({
  staff,
  onEdit,
  onDelete,
}: {
  staff: StaffMemberWithStats[];
  onEdit: (id: string) => void;
  onDelete: (member: StaffMemberWithStats) => void;
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
              <th className="text-[#434E54]"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const isAdmin = member.role === 'admin';
              return (
                <tr
                  key={member.id}
                  className="hover:bg-[#F8EEE5]/50 transition-colors"
                  aria-label={`${member.first_name} ${member.last_name}, ${member.role}`}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="avatar placeholder">
                          <div className="w-10 h-10 rounded-full bg-[#EAE0D5]">
                            <span className="text-sm font-semibold text-[#434E54]">
                              {member.first_name[0]}{member.last_name[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                          isAdmin ? 'bg-[#434E54]' : 'bg-[#D4A574]'
                        }`} />
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
                    <StatusDot active={member.is_active} />
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
                  <td>
                    <StaffActionMenu member={member} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ============================================
// Badge / Indicator Components
// ============================================

function RoleBadge({ role }: { role: 'admin' | 'groomer' }) {
  const isAdmin = role === 'admin';
  return (
    <span className={`inline-flex items-center gap-1 badge badge-sm border ${
      isAdmin
        ? 'bg-[#EAE0D5] text-[#434E54] border-[#D4C4B4]'
        : 'bg-[#F0EAE0] text-[#8B7355] border-[#D4C4B4]'
    }`}>
      {isAdmin
        ? <Shield className="w-2.5 h-2.5" />
        : <Scissors className="w-2.5 h-2.5" />
      }
      {isAdmin ? 'Admin' : 'Groomer'}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {active ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      ) : (
        <span className="inline-flex rounded-full h-2 w-2 bg-gray-300" />
      )}
      <span className={`text-xs ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}

// ============================================
// Delete Confirmation Modal
// ============================================

function DeleteConfirmModal({
  member,
  deleting,
  onConfirm,
  onCancel,
}: {
  member: StaffMemberWithStats;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-white">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#434E54] mb-2">Deactivate Staff Member?</h3>
            <p className="text-sm text-[#6B7280]">
              <strong>{member.first_name} {member.last_name}</strong> will be marked as inactive and
              won&#39;t be available for new appointments.
              {member.upcoming_appointments > 0 && (
                <> They have <strong>{member.upcoming_appointments} upcoming appointment{member.upcoming_appointments !== 1 ? 's' : ''}</strong> that will not be cancelled.</>
              )}
            </p>
          </div>
        </div>
        <div className="modal-action">
          <AdminButton variant="ghost" onClick={onCancel} disabled={deleting}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="danger"
            onClick={onConfirm}
            disabled={deleting}
            isLoading={deleting}
            loadingText="Deactivating..."
          >
            Deactivate
          </AdminButton>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onCancel}></div>
    </div>
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
          <PawPrint className="w-8 h-8 text-[#434E54]" />
        </div>
        <h3 className="text-lg font-semibold text-[#434E54] mb-2">
          {hasSearch ? 'No matches found in the kennel' : 'No groomers in the pack yet'}
        </h3>
        <p className="text-sm text-[#6B7280] mb-6">
          {hasSearch
            ? 'Try adjusting your search or filters to find staff members.'
            : 'Add your first staff member to get started with team management.'}
        </p>
        {hasSearch && (
          <AdminButton variant="secondary" size="sm" onClick={onClearSearch}>
            Clear Search
          </AdminButton>
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
          <div key={i} className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="skeleton h-1.5 w-full rounded-none" />
            <div className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="skeleton w-14 h-14 rounded-xl shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-3 w-20"></div>
                  <div className="skeleton h-3 w-40"></div>
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-[#F0EAE0]">
                <div className="skeleton h-10 flex-1 rounded-lg"></div>
                <div className="skeleton h-10 flex-1 rounded-lg"></div>
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
              <th></th>
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
                <td><div className="skeleton h-6 w-6 rounded-full"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
