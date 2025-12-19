# Staff Management UI Components Implementation Plan

**Date:** 2025-12-19
**Author:** DaisyUI Expert Agent
**Tasks:** 0204, 0205, 0208, 0210
**Design Aesthetic:** Clean & Elegant Professional

---

## Table of Contents
1. [Overview](#overview)
2. [Design System Reference](#design-system-reference)
3. [Type Definitions](#type-definitions)
4. [Component 1: StaffDirectory](#component-1-staffdirectory)
5. [Component 2: StaffForm](#component-2-staffform)
6. [Component 3: CommissionSettings](#component-3-commissionsettings)
7. [Component 4: EarningsReport](#component-4-earningsreport)
8. [Shared Utilities](#shared-utilities)
9. [Implementation Checklist](#implementation-checklist)
10. [Important Notes](#important-notes)

---

## Overview

This plan details the implementation of **4 staff management UI components** for The Puppy Day admin panel. These components enable management of staff members, commission settings, and earnings reporting.

### Components to Create:
1. **StaffDirectory** - Grid/list view of all staff with search and filters
2. **StaffForm** - Modal form for creating/editing staff members
3. **CommissionSettings** - Configure commission rates and service overrides
4. **EarningsReport** - View earnings data with charts and export functionality

### Key Technologies:
- **Next.js 15** (App Router, TypeScript)
- **DaisyUI 5.5.8** (component classes)
- **Tailwind CSS 4** (utility classes)
- **React Hook Form** + **Zod** (form validation)
- **Framer Motion** (animations)
- **Recharts** (charts for earnings)
- **date-fns** (date handling)

---

## Design System Reference

### Color Palette
```css
/* Background Colors */
--background: #F8EEE5;           /* Main background - warm cream */
--background-light: #FFFBF7;     /* Light variant for cards */

/* Primary Colors */
--primary: #434E54;              /* Charcoal - buttons, headings */
--primary-hover: #363F44;        /* Darker charcoal on hover */
--primary-light: #5A6670;        /* Lighter charcoal */

/* Secondary Colors */
--secondary: #EAE0D5;            /* Lighter cream - badges, backgrounds */
--secondary-hover: #DCD2C7;      /* Darker secondary on hover */

/* Neutral Colors */
--neutral-white: #FFFFFF;        /* Pure white for cards */
--neutral-200: #F5F5F5;          /* Very light gray */
--neutral-300: #E5E5E5;          /* Light gray borders */

/* Text Colors */
--text-primary: #434E54;         /* Primary text */
--text-secondary: #6B7280;       /* Secondary/muted text */
--text-muted: #9CA3AF;           /* Very muted text */

/* Semantic Colors */
--success: #6BCB77;              /* Green for success states */
--warning: #FFB347;              /* Orange for warnings */
--error: #EF4444;                /* Red for errors */
--info: #74B9FF;                 /* Blue for info */
```

### Design Principles
- **Soft Shadows**: Use `shadow-sm`, `shadow-md`, `shadow-lg`
- **Subtle Borders**: Very thin (1px) or use `border-[#434E54]/10`
- **Gentle Corners**: `rounded-lg`, `rounded-xl`
- **Professional Typography**: Regular to semibold weights
- **Clean Spacing**: Generous whitespace with `gap-4`, `gap-6`, `space-y-4`

### Role Badge Colors
- **Admin**: Purple badge (`badge-primary` with purple override or custom)
- **Groomer**: Blue badge (`badge-info`)

### Status Badge Colors
- **Active**: Green (`badge-success` or custom green)
- **Inactive**: Gray (`badge-ghost`)

---

## Type Definitions

### Create Shared Type File
**File:** `src/types/staff.ts`

```typescript
/**
 * Staff Management Types
 * Types for staff directory, forms, commissions, and earnings
 */

import type { User, StaffCommission } from './database';

// ============================================
// Staff Directory Types
// ============================================

export interface StaffMemberWithStats {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'admin' | 'groomer';
  avatar_url: string | null;
  created_at: string;
  appointment_count: number;
  upcoming_appointments: number;
  avg_rating: number | null;
  commission_settings: StaffCommission | null;
}

export interface StaffDirectoryFilters {
  search: string;
  role: 'all' | 'admin' | 'groomer';
  status: 'all' | 'active' | 'inactive';
}

export type StaffViewMode = 'grid' | 'list';

// ============================================
// Staff Form Types
// ============================================

export interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'groomer';
  active?: boolean; // Only for edit mode
}

export interface StaffFormProps {
  staffId?: string; // undefined for create mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (staff: User) => void;
}

// ============================================
// Commission Settings Types
// ============================================

export type CommissionRateType = 'percentage' | 'flat_rate';

export interface ServiceOverride {
  service_id: string;
  rate: number;
}

export interface CommissionSettingsData {
  rate_type: CommissionRateType;
  rate: number;
  include_addons: boolean;
  service_overrides: ServiceOverride[] | null;
}

export interface CommissionPreviewCalculation {
  service_name: string;
  service_price: number;
  addons_total: number;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  notes: string[];
}

// ============================================
// Earnings Report Types
// ============================================

export interface EarningsReportFilters {
  start_date: string; // ISO date string
  end_date: string;
  groomer_id: string | 'all';
  group_by: 'day' | 'week' | 'month';
}

export interface EarningsSummary {
  total_services: number;
  total_revenue: number;
  total_commission: number;
  total_tips: number;
}

export interface GroomerEarnings {
  groomer_id: string;
  groomer_name: string;
  services_count: number;
  revenue: number;
  commission: number;
  tips: number;
}

export interface EarningsTimelineEntry {
  period: string;
  services_count: number;
  revenue: number;
  commission: number;
}

export interface EarningsReportData {
  summary: EarningsSummary;
  by_groomer: GroomerEarnings[];
  timeline: EarningsTimelineEntry[];
}

export type DatePreset = 'this_week' | 'this_month' | 'last_month' | 'custom';
```

---

## Component 1: StaffDirectory

**File:** `src/components/admin/settings/staff/StaffDirectory.tsx`
**Task:** 0204
**Complexity:** Medium

### Features
- Grid and list view toggle
- Search by name, email, phone (debounced)
- Filter by role (All, Admin, Groomer)
- Filter by status (All, Active, Inactive)
- Staff cards with role/status badges
- Quick stats: appointments, avg rating
- Empty state for single-groomer mode
- Loading skeleton

### Component Structure

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Grid3x3, List, Plus, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StaffMemberWithStats, StaffDirectoryFilters, StaffViewMode } from '@/types/staff';

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
```

### Key Implementation Details

1. **DaisyUI Components Used:**
   - `card`, `card-body` for grid cards
   - `table` for list view
   - `input`, `select` for filters
   - `btn`, `join` for view toggle
   - `badge` for role/status
   - `skeleton` for loading states
   - `alert` for upcoming appointments
   - `avatar`, `placeholder` for initials

2. **Search Debouncing:**
   - Use `useEffect` with 300ms timeout to debounce search input
   - Update `filters.search` only after user stops typing

3. **Client-Side vs Server-Side Filtering:**
   - Role/Status filters trigger API call
   - Search is done client-side (API doesn't support search yet)

4. **Responsive Design:**
   - Grid: 1 column mobile, 2 tablet, 3 desktop
   - List view with horizontal scroll on mobile

5. **Animations:**
   - Use Framer Motion's `AnimatePresence` for smooth grid transitions
   - `layout` animation on grid cards

---

## Component 2: StaffForm

**File:** `src/components/admin/settings/staff/StaffForm.tsx`
**Task:** 0205
**Complexity:** Medium

### Features
- Modal-based form (create or edit mode)
- Form fields: first_name, last_name, email, phone, role
- Edit mode: includes active status toggle
- Email uniqueness validation on blur
- Phone auto-formatting
- Confirmation dialog when deactivating staff with upcoming appointments
- Success toast on save
- Inline error messages

### Component Structure

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import type { StaffFormProps, StaffFormData } from '@/types/staff';
import type { User } from '@/types/database';

// ============================================
// Validation Schema
// ============================================

const staffFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['groomer', 'admin'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
  active: z.boolean().optional(),
});

// ============================================
// Phone Formatting Utility
// ============================================

function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');

  // Format as (123) 456-7890
  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length >= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length >= 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length > 0) {
    return `(${cleaned}`;
  }

  return '';
}

// ============================================
// Main Component
// ============================================

export function StaffForm({ staffId, isOpen, onClose, onSuccess }: StaffFormProps) {
  const isEditMode = !!staffId;

  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [existingStaff, setExistingStaff] = useState<User | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'groomer',
      active: true,
    },
  });

  const watchActive = watch('active');
  const watchPhone = watch('phone');

  // Load existing staff in edit mode
  useEffect(() => {
    if (isEditMode && isOpen) {
      loadStaffData();
    } else if (!isOpen) {
      // Reset form when modal closes
      reset();
      setEmailError('');
      setShowDeactivateConfirm(false);
    }
  }, [staffId, isOpen, isEditMode]);

  // Auto-format phone number
  useEffect(() => {
    if (watchPhone) {
      const formatted = formatPhoneNumber(watchPhone);
      if (formatted !== watchPhone) {
        setValue('phone', formatted, { shouldValidate: true });
      }
    }
  }, [watchPhone, setValue]);

  // Load staff data
  const loadStaffData = async () => {
    if (!staffId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/settings/staff/${staffId}`);
      const result = await response.json();

      if (response.ok) {
        const staff = result.data;
        setExistingStaff(staff);
        setUpcomingAppointments(staff.upcoming_appointments || 0);

        reset({
          first_name: staff.first_name,
          last_name: staff.last_name,
          email: staff.email,
          phone: staff.phone || '',
          role: staff.role,
          active: true, // TODO: Add active field to API
        });
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Email uniqueness check
  const checkEmailUniqueness = async (email: string) => {
    if (!email || !email.includes('@')) return;
    if (isEditMode && existingStaff?.email === email) {
      setEmailError('');
      return;
    }

    try {
      const response = await fetch(`/api/admin/settings/staff?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (response.ok && result.data.length > 0) {
        setEmailError('This email is already in use');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Email check failed:', error);
    }
  };

  // Submit handler
  const onSubmit = async (data: StaffFormData) => {
    // If deactivating with upcoming appointments, show confirmation
    if (isEditMode && data.active === false && upcomingAppointments > 0) {
      setShowDeactivateConfirm(true);
      return;
    }

    await saveStaff(data);
  };

  const saveStaff = async (data: StaffFormData) => {
    setSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/admin/settings/staff/${staffId}`
        : '/api/admin/settings/staff';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success toast
        showSuccessToast(isEditMode ? 'Staff member updated' : 'Staff member created');
        onSuccess?.(result.data);
        onClose();
      } else {
        // Show error toast
        showErrorToast(result.error || 'Failed to save staff member');
      }
    } catch (error) {
      console.error('Failed to save staff:', error);
      showErrorToast('An unexpected error occurred');
    } finally {
      setSubmitting(false);
      setShowDeactivateConfirm(false);
    }
  };

  // Toast helpers (implement using your toast system)
  const showSuccessToast = (message: string) => {
    // TODO: Integrate with your toast system
    console.log('Success:', message);
  };

  const showErrorToast = (message: string) => {
    // TODO: Integrate with your toast system
    console.error('Error:', message);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="modal modal-open">
        <div className="modal-box max-w-2xl bg-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#434E54]">
              {isEditMode ? 'Edit Staff Member' : 'Add Staff Member'}
            </h3>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#434E54] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">Loading staff information...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-[#434E54]">
                      First Name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    {...register('first_name')}
                    className={`input input-bordered bg-white ${
                      errors.first_name ? 'input-error' : 'border-[#E5E5E5] focus:border-[#434E54]'
                    }`}
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.first_name.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-[#434E54]">
                      Last Name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    {...register('last_name')}
                    className={`input input-bordered bg-white ${
                      errors.last_name ? 'input-error' : 'border-[#E5E5E5] focus:border-[#434E54]'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.last_name.message}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-[#434E54]">
                    Email <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  onBlur={(e) => checkEmailUniqueness(e.target.value)}
                  className={`input input-bordered bg-white ${
                    errors.email || emailError
                      ? 'input-error'
                      : 'border-[#E5E5E5] focus:border-[#434E54]'
                  }`}
                  placeholder="john.doe@example.com"
                />
                {(errors.email || emailError) && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.email?.message || emailError}
                    </span>
                  </label>
                )}
              </div>

              {/* Phone */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-[#434E54]">Phone</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="input input-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
                  placeholder="(123) 456-7890"
                  maxLength={14}
                />
                <label className="label">
                  <span className="label-text-alt text-[#9CA3AF]">
                    Optional - Auto-formats as you type
                  </span>
                </label>
              </div>

              {/* Role */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-[#434E54]">
                    Role <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  {...register('role')}
                  className={`select select-bordered bg-white ${
                    errors.role ? 'select-error' : 'border-[#E5E5E5] focus:border-[#434E54]'
                  }`}
                >
                  <option value="groomer">Groomer</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.role.message}</span>
                  </label>
                )}
                <label className="label">
                  <span className="label-text-alt text-[#9CA3AF]">
                    Admins have full access; Groomers have limited access
                  </span>
                </label>
              </div>

              {/* Active Status (Edit Mode Only) */}
              {isEditMode && (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      {...register('active')}
                      className="toggle toggle-success"
                    />
                    <span className="label-text font-medium text-[#434E54]">Active Status</span>
                  </label>
                  <label className="label">
                    <span className="label-text-alt text-[#9CA3AF]">
                      Inactive staff cannot be assigned to new appointments
                    </span>
                  </label>
                  {upcomingAppointments > 0 && !watchActive && (
                    <div className="alert alert-warning bg-[#FFB347]/10 border-[#FFB347]/20 mt-2">
                      <AlertTriangle className="w-5 h-5 text-[#FFB347]" />
                      <span className="text-sm text-[#434E54]">
                        This staff member has {upcomingAppointments} upcoming appointment
                        {upcomingAppointments !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="modal-action">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
                  disabled={submitting || !!emailError || !isDirty}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{isEditMode ? 'Update' : 'Create'} Staff Member</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="modal modal-open">
          <div className="modal-box bg-white">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-[#FFB347]/10 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-[#FFB347]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#434E54] mb-2">
                  Deactivate Staff Member?
                </h3>
                <p className="text-sm text-[#6B7280]">
                  This staff member has <strong>{upcomingAppointments} upcoming appointment
                  {upcomingAppointments !== 1 ? 's' : ''}</strong>.
                  Deactivating them will not cancel these appointments, but they won't be
                  available for new bookings.
                </p>
              </div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="btn btn-ghost"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const data = watch();
                  saveStaff(data);
                }}
                className="btn btn-warning"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  'Deactivate Anyway'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50"></div>
        </div>
      )}
    </>
  );
}
```

### Key Implementation Details

1. **DaisyUI Components Used:**
   - `modal`, `modal-box`, `modal-backdrop` for modal structure
   - `form-control`, `label`, `input`, `select` for form fields
   - `toggle` for active status
   - `alert` for warnings
   - `btn` for actions

2. **Form Validation:**
   - Use `react-hook-form` with `zod` resolver
   - Required fields: first_name, last_name, email, role
   - Email uniqueness check on blur (debounced API call)

3. **Phone Formatting:**
   - Auto-format as `(123) 456-7890` using `useEffect` on phone watch
   - Limit to 14 characters

4. **Deactivation Flow:**
   - Check `upcoming_appointments` count
   - Show confirmation modal if count > 0
   - Allow proceeding with deactivation

5. **Loading States:**
   - Show spinner while loading existing staff data
   - Disable buttons during submission

---

## Component 3: CommissionSettings

**File:** `src/components/admin/settings/staff/CommissionSettings.tsx`
**Task:** 0208
**Complexity:** Medium

### Features
- Rate type selector (Percentage or Flat rate)
- Base rate input with validation
- "Include add-ons" toggle
- Per-service override table
- Preview calculation example
- Unsaved changes indicator
- Save to commission API

### Component Structure

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, DollarSign, Percent, AlertCircle, Calculator, X } from 'lucide-react';
import type { CommissionSettingsData, CommissionPreviewCalculation } from '@/types/staff';
import type { Service, StaffCommission } from '@/types/database';

// ============================================
// Validation Schema
// ============================================

const commissionSchema = z.object({
  rate_type: z.enum(['percentage', 'flat_rate']),
  rate: z.number().min(0, 'Rate must be non-negative'),
  include_addons: z.boolean(),
  service_overrides: z.array(
    z.object({
      service_id: z.string(),
      rate: z.number().min(0),
    })
  ),
}).refine((data) => {
  if (data.rate_type === 'percentage' && data.rate > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage rate cannot exceed 100',
  path: ['rate'],
});

// ============================================
// Main Component
// ============================================

interface CommissionSettingsProps {
  staffId: string;
  staffName: string;
}

export function CommissionSettings({ staffId, staffName }: CommissionSettingsProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [initialSettings, setInitialSettings] = useState<StaffCommission | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
    control,
  } = useForm<CommissionSettingsData>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      rate_type: 'percentage',
      rate: 0,
      include_addons: false,
      service_overrides: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'service_overrides',
  });

  const watchRateType = watch('rate_type');
  const watchRate = watch('rate');
  const watchIncludeAddons = watch('include_addons');
  const watchOverrides = watch('service_overrides');

  // Load data
  useEffect(() => {
    loadData();
  }, [staffId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load commission settings
      const commissionRes = await fetch(`/api/admin/settings/staff/${staffId}/commission`);
      const commissionData = await commissionRes.json();

      if (commissionRes.ok) {
        const settings = commissionData.data;
        setInitialSettings(settings);
        reset({
          rate_type: settings.rate_type,
          rate: settings.rate,
          include_addons: settings.include_addons,
          service_overrides: settings.service_overrides || [],
        });
      }

      // Load services
      const servicesRes = await fetch('/api/admin/services');
      const servicesData = await servicesRes.json();

      if (servicesRes.ok) {
        setServices(servicesData.data.filter((s: Service) => s.is_active));
      }
    } catch (error) {
      console.error('Failed to load commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit handler
  const onSubmit = async (data: CommissionSettingsData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/settings/staff/${staffId}/commission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccessToast('Commission settings saved');
        setInitialSettings(result.data);
        reset(data); // Reset form to mark as not dirty
      } else {
        showErrorToast(result.error || 'Failed to save commission settings');
      }
    } catch (error) {
      console.error('Failed to save commission:', error);
      showErrorToast('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Preview calculation
  const previewCalculation = useMemo((): CommissionPreviewCalculation => {
    // Sample appointment data
    const sampleService = services[0];
    const serviceName = sampleService?.name || 'Basic Grooming';
    const servicePrice = 70; // Medium dog price
    const addonsTotal = 25; // $10 teeth brushing + $15 pawdicure

    const baseAmount = watchIncludeAddons ? servicePrice + addonsTotal : servicePrice;

    // Check for service override
    let commissionRate = watchRate;
    if (sampleService && watchOverrides) {
      const override = watchOverrides.find((o) => o.service_id === sampleService.id);
      if (override) {
        commissionRate = override.rate;
      }
    }

    const commissionAmount = watchRateType === 'percentage'
      ? (baseAmount * commissionRate) / 100
      : commissionRate;

    const notes: string[] = [];
    if (watchIncludeAddons) {
      notes.push('Add-ons included in commission');
    }
    if (watchRateType === 'flat_rate') {
      notes.push('Flat rate per service');
    }

    return {
      service_name: serviceName,
      service_price: servicePrice,
      addons_total: addonsTotal,
      base_amount: baseAmount,
      commission_rate: commissionRate,
      commission_amount: Math.round(commissionAmount * 100) / 100,
      notes,
    };
  }, [services, watchRateType, watchRate, watchIncludeAddons, watchOverrides]);

  // Service override handlers
  const handleAddOverride = (serviceId: string) => {
    const existing = watchOverrides?.find((o) => o.service_id === serviceId);
    if (!existing) {
      append({ service_id: serviceId, rate: watchRate });
    }
  };

  const handleRemoveOverride = (serviceId: string) => {
    const index = watchOverrides?.findIndex((o) => o.service_id === serviceId);
    if (index !== undefined && index >= 0) {
      remove(index);
    }
  };

  const handleUpdateOverride = (serviceId: string, rate: number) => {
    const index = watchOverrides?.findIndex((o) => o.service_id === serviceId);
    if (index !== undefined && index >= 0) {
      update(index, { service_id: serviceId, rate });
    }
  };

  const getServiceOverride = (serviceId: string) => {
    return watchOverrides?.find((o) => o.service_id === serviceId);
  };

  // Toast helpers
  const showSuccessToast = (message: string) => {
    console.log('Success:', message);
  };

  const showErrorToast = (message: string) => {
    console.error('Error:', message);
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#434E54] mx-auto mb-3" />
        <p className="text-sm text-[#6B7280]">Loading commission settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#434E54]">Commission Settings</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Configure commission rates for {staffName}
        </p>
      </div>

      {/* Unsaved Changes Warning */}
      {isDirty && (
        <div className="alert alert-warning bg-[#FFB347]/10 border-[#FFB347]/20">
          <AlertCircle className="w-5 h-5 text-[#FFB347]" />
          <span className="text-sm text-[#434E54]">You have unsaved changes</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Base Settings Card */}
        <div className="card bg-white shadow-sm border border-[#434E54]/10">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-[#434E54] mb-4">Base Commission Rate</h3>

            {/* Rate Type Selector */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">Rate Type</span>
              </label>
              <div className="flex gap-4">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="radio"
                    {...register('rate_type')}
                    value="percentage"
                    className="radio radio-primary"
                  />
                  <span className="label-text flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Percentage
                  </span>
                </label>
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="radio"
                    {...register('rate_type')}
                    value="flat_rate"
                    className="radio radio-primary"
                  />
                  <span className="label-text flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Flat Rate per Service
                  </span>
                </label>
              </div>
            </div>

            {/* Rate Input */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">
                  Base Rate {watchRateType === 'percentage' ? '(%)' : '($)'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  {...register('rate', { valueAsNumber: true })}
                  className={`input input-bordered bg-white w-full ${
                    watchRateType === 'percentage' ? 'pr-8' : 'pl-8'
                  } ${
                    errors.rate ? 'input-error' : 'border-[#E5E5E5] focus:border-[#434E54]'
                  }`}
                  placeholder={watchRateType === 'percentage' ? '15' : '10.00'}
                />
                {watchRateType === 'percentage' ? (
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                ) : (
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                )}
              </div>
              {errors.rate && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.rate.message}</span>
                </label>
              )}
            </div>

            {/* Include Add-ons Toggle */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  {...register('include_addons')}
                  className="toggle toggle-success"
                />
                <span className="label-text font-medium text-[#434E54]">
                  Include add-ons in commission calculation
                </span>
              </label>
              <label className="label">
                <span className="label-text-alt text-[#9CA3AF]">
                  When enabled, commission is calculated on service price + add-ons total
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Service Overrides Card */}
        <div className="card bg-white shadow-sm border border-[#434E54]/10">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-[#434E54] mb-2">Per-Service Overrides</h3>
            <p className="text-sm text-[#6B7280] mb-4">
              Set custom commission rates for specific services (optional)
            </p>

            {/* Services Table */}
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-[#EAE0D5]">
                  <tr>
                    <th className="text-[#434E54]">Service</th>
                    <th className="text-[#434E54]">Custom Rate</th>
                    <th className="text-[#434E54]"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => {
                    const override = getServiceOverride(service.id);
                    const hasOverride = !!override;

                    return (
                      <tr key={service.id} className="hover:bg-[#F8EEE5]/50">
                        <td className="font-medium text-[#434E54]">{service.name}</td>
                        <td>
                          {hasOverride ? (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={override.rate}
                                  onChange={(e) =>
                                    handleUpdateOverride(service.id, parseFloat(e.target.value))
                                  }
                                  className={`input input-bordered input-sm bg-white w-32 ${
                                    watchRateType === 'percentage' ? 'pr-8' : 'pl-8'
                                  }`}
                                />
                                {watchRateType === 'percentage' ? (
                                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                                ) : (
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-[#9CA3AF]">Using base rate</span>
                          )}
                        </td>
                        <td>
                          {hasOverride ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveOverride(service.id)}
                              className="btn btn-ghost btn-sm text-error"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddOverride(service.id)}
                              className="btn btn-ghost btn-sm"
                            >
                              Set Override
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Preview Calculation Card */}
        <div className="card bg-[#F8EEE5] border border-[#434E54]/10">
          <div className="card-body p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-[#434E54]" />
              </div>
              <h3 className="text-lg font-semibold text-[#434E54]">Preview Calculation</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Service:</span>
                <span className="font-medium text-[#434E54]">{previewCalculation.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Service Price:</span>
                <span className="font-medium text-[#434E54]">
                  ${previewCalculation.service_price.toFixed(2)}
                </span>
              </div>
              {watchIncludeAddons && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Add-ons Total:</span>
                  <span className="font-medium text-[#434E54]">
                    ${previewCalculation.addons_total.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="divider my-2"></div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Commission Base:</span>
                <span className="font-medium text-[#434E54]">
                  ${previewCalculation.base_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Commission Rate:</span>
                <span className="font-medium text-[#434E54]">
                  {watchRateType === 'percentage'
                    ? `${previewCalculation.commission_rate}%`
                    : `$${previewCalculation.commission_rate.toFixed(2)}`}
                </span>
              </div>
              <div className="divider my-2"></div>
              <div className="flex justify-between text-base">
                <span className="font-semibold text-[#434E54]">Commission Amount:</span>
                <span className="font-bold text-[#434E54]">
                  ${previewCalculation.commission_amount.toFixed(2)}
                </span>
              </div>
              {previewCalculation.notes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#434E54]/10">
                  {previewCalculation.notes.map((note, i) => (
                    <p key={i} className="text-xs text-[#6B7280]">• {note}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert bg-blue-50 border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-[#434E54]">
            Commission settings are for reporting purposes only. They do not affect payment processing.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => reset(initialSettings as any)}
            className="btn btn-ghost"
            disabled={!isDirty || saving}
          >
            Reset Changes
          </button>
          <button
            type="submit"
            className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
            disabled={!isDirty || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Commission Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Key Implementation Details

1. **DaisyUI Components Used:**
   - `card`, `card-body` for sections
   - `radio` for rate type selector
   - `input` for rate values
   - `toggle` for include add-ons
   - `table` for service overrides
   - `alert` for warnings and info
   - `divider` for preview section

2. **Form State Management:**
   - Use `useFieldArray` for service overrides
   - Track `isDirty` to show unsaved changes warning
   - `reset()` form after save to clear dirty state

3. **Preview Calculation:**
   - Use `useMemo` to recalculate on any relevant change
   - Show realistic example with service + add-ons
   - Display notes for special conditions

4. **Service Overrides:**
   - Allow setting custom rate per service
   - Show "Using base rate" when no override
   - Add/remove override buttons

5. **Validation:**
   - Percentage rate cannot exceed 100
   - All rates must be non-negative
   - Use Zod schema for validation

---

## Component 4: EarningsReport

**File:** `src/components/admin/settings/staff/EarningsReport.tsx`
**Task:** 0210
**Complexity:** Large

### Features
- Date range picker with presets
- Groomer filter dropdown
- Group by selector (Day/Week/Month)
- Summary cards (services, revenue, commission, tips)
- Bar chart visualization
- Per-groomer breakdown table
- Comparison to previous period
- CSV/PDF export

### Component Structure

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { startOfWeek, startOfMonth, subMonths, format, parseISO } from 'date-fns';
import { Calendar, TrendingUp, TrendingDown, Download, Loader2, DollarSign, Users, FileText, Coins } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type {
  EarningsReportFilters,
  EarningsReportData,
  DatePreset,
} from '@/types/staff';
import type { User } from '@/types/database';

// ============================================
// Main Component
// ============================================

export function EarningsReport() {
  // State
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<User[]>([]);
  const [reportData, setReportData] = useState<EarningsReportData | null>(null);
  const [filters, setFilters] = useState<EarningsReportFilters>({
    start_date: startOfMonth(new Date()).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    groomer_id: 'all',
    group_by: 'day',
  });
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');

  // Load staff list
  useEffect(() => {
    loadStaff();
  }, []);

  // Load report when filters change
  useEffect(() => {
    if (filters.start_date && filters.end_date) {
      loadReport();
    }
  }, [filters]);

  const loadStaff = async () => {
    try {
      const response = await fetch('/api/admin/settings/staff?role=groomer');
      const result = await response.json();

      if (response.ok) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        group_by: filters.group_by,
      });

      if (filters.groomer_id !== 'all') {
        params.set('groomer_id', filters.groomer_id);
      }

      const response = await fetch(`/api/admin/settings/staff/earnings?${params}`);
      const result = await response.json();

      if (response.ok) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Failed to load earnings report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Date preset handlers
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);

    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case 'this_week':
        start = startOfWeek(today);
        break;
      case 'this_month':
        start = startOfMonth(today);
        break;
      case 'last_month':
        start = startOfMonth(subMonths(today, 1));
        end = startOfMonth(today);
        end.setDate(end.getDate() - 1); // Last day of previous month
        break;
      case 'custom':
        return; // Don't update dates for custom
      default:
        start = startOfMonth(today);
    }

    setFilters((prev) => ({
      ...prev,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    }));
  };

  // Chart data
  const chartData = useMemo(() => {
    if (!reportData) return [];

    return reportData.timeline.map((entry) => ({
      period: entry.period,
      Revenue: entry.revenue,
      Commission: entry.commission,
    }));
  }, [reportData]);

  // Export handlers
  const handleExportCSV = () => {
    if (!reportData) return;

    // Build CSV content
    const headers = ['Period', 'Services', 'Revenue', 'Commission', 'Tips'];
    const rows = reportData.timeline.map((entry) => [
      entry.period,
      entry.services_count,
      entry.revenue.toFixed(2),
      entry.commission.toFixed(2),
      '0.00', // Tips not in timeline data
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings-report-${filters.start_date}-to-${filters.end_date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    if (!reportData) return;

    // Use jsPDF to generate PDF
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Earnings Report', 14, 20);

    // Date range
    doc.setFontSize(11);
    doc.text(`${filters.start_date} to ${filters.end_date}`, 14, 28);

    // Summary table
    const summaryData = [
      ['Total Services', reportData.summary.total_services.toString()],
      ['Total Revenue', `$${reportData.summary.total_revenue.toFixed(2)}`],
      ['Total Commission', `$${reportData.summary.total_commission.toFixed(2)}`],
      ['Total Tips', `$${reportData.summary.total_tips.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Metric', 'Value']],
      body: summaryData,
    });

    // Timeline table
    const timelineData = reportData.timeline.map((entry) => [
      entry.period,
      entry.services_count.toString(),
      `$${entry.revenue.toFixed(2)}`,
      `$${entry.commission.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Period', 'Services', 'Revenue', 'Commission']],
      body: timelineData,
    });

    // Download
    doc.save(`earnings-report-${filters.start_date}-to-${filters.end_date}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54]">Earnings Report</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            View groomer performance and commission data
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!reportData || loading}
            className="btn btn-outline btn-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!reportData || loading}
            className="btn btn-outline btn-sm"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card bg-white shadow-sm border border-[#434E54]/10">
        <div className="card-body p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Preset */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">Date Range</span>
              </label>
              <select
                value={datePreset}
                onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
                className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
              >
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">Start Date</span>
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => {
                  setFilters({ ...filters, start_date: e.target.value });
                  setDatePreset('custom');
                }}
                className="input input-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
              />
            </div>

            {/* End Date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">End Date</span>
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => {
                  setFilters({ ...filters, end_date: e.target.value });
                  setDatePreset('custom');
                }}
                className="input input-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
              />
            </div>

            {/* Groomer Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">Groomer</span>
              </label>
              <select
                value={filters.groomer_id}
                onChange={(e) => setFilters({ ...filters, groomer_id: e.target.value })}
                className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
              >
                <option value="all">All Groomers</option>
                {staff.map((groomer) => (
                  <option key={groomer.id} value={groomer.id}>
                    {groomer.first_name} {groomer.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group By Radio */}
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-medium text-[#434E54]">Group By</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="radio"
                  value="day"
                  checked={filters.group_by === 'day'}
                  onChange={(e) => setFilters({ ...filters, group_by: e.target.value as any })}
                  className="radio radio-primary radio-sm"
                />
                <span className="label-text">Day</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="radio"
                  value="week"
                  checked={filters.group_by === 'week'}
                  onChange={(e) => setFilters({ ...filters, group_by: e.target.value as any })}
                  className="radio radio-primary radio-sm"
                />
                <span className="label-text">Week</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="radio"
                  value="month"
                  checked={filters.group_by === 'month'}
                  onChange={(e) => setFilters({ ...filters, group_by: e.target.value as any })}
                  className="radio radio-primary radio-sm"
                />
                <span className="label-text">Month</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#434E54] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">Generating report...</p>
        </div>
      )}

      {/* Report Content */}
      {!loading && reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Users className="w-6 h-6" />}
              label="Total Services"
              value={reportData.summary.total_services.toString()}
              color="bg-blue-50 text-blue-600"
            />
            <SummaryCard
              icon={<DollarSign className="w-6 h-6" />}
              label="Total Revenue"
              value={`$${reportData.summary.total_revenue.toFixed(2)}`}
              color="bg-green-50 text-green-600"
            />
            <SummaryCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Total Commission"
              value={`$${reportData.summary.total_commission.toFixed(2)}`}
              color="bg-purple-50 text-purple-600"
            />
            <SummaryCard
              icon={<Coins className="w-6 h-6" />}
              label="Total Tips"
              value={`$${reportData.summary.total_tips.toFixed(2)}`}
              color="bg-yellow-50 text-yellow-600"
            />
          </div>

          {/* Chart */}
          <div className="card bg-white shadow-sm border border-[#434E54]/10">
            <div className="card-body p-6">
              <h3 className="text-lg font-semibold text-[#434E54] mb-4">
                Earnings Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#6BCB77" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Commission" fill="#74B9FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-Groomer Breakdown */}
          {filters.groomer_id === 'all' && reportData.by_groomer.length > 0 && (
            <div className="card bg-white shadow-sm border border-[#434E54]/10">
              <div className="card-body p-6">
                <h3 className="text-lg font-semibold text-[#434E54] mb-4">
                  Breakdown by Groomer
                </h3>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="bg-[#EAE0D5]">
                      <tr>
                        <th className="text-[#434E54]">Groomer</th>
                        <th className="text-[#434E54] text-center">Services</th>
                        <th className="text-[#434E54] text-right">Revenue</th>
                        <th className="text-[#434E54] text-right">Commission</th>
                        <th className="text-[#434E54] text-right">Tips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.by_groomer.map((groomer) => (
                        <tr key={groomer.groomer_id} className="hover:bg-[#F8EEE5]/50">
                          <td className="font-medium text-[#434E54]">
                            {groomer.groomer_name}
                          </td>
                          <td className="text-center">{groomer.services_count}</td>
                          <td className="text-right font-medium">
                            ${groomer.revenue.toFixed(2)}
                          </td>
                          <td className="text-right font-medium">
                            ${groomer.commission.toFixed(2)}
                          </td>
                          <td className="text-right font-medium">
                            ${groomer.tips.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Summary Card Component
// ============================================

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function SummaryCard({ icon, label, value, color }: SummaryCardProps) {
  return (
    <div className="card bg-white shadow-sm border border-[#434E54]/10">
      <div className="card-body p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-[#6B7280] mb-2">{label}</p>
            <p className="text-2xl font-bold text-[#434E54]">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Key Implementation Details

1. **DaisyUI Components Used:**
   - `card`, `card-body` for sections
   - `select`, `input[type="date"]` for filters
   - `radio` for group by selector
   - `table` for groomer breakdown
   - `btn` for export actions

2. **Date Handling:**
   - Use `date-fns` for date calculations
   - Presets: This Week, This Month, Last Month, Custom
   - Custom mode allows manual date selection

3. **Charts:**
   - Use **Recharts** library for bar chart
   - Show Revenue and Commission bars side-by-side
   - Responsive container for mobile

4. **Export Functionality:**
   - CSV: Build CSV string, create blob, download
   - PDF: Use `jsPDF` + `jspdf-autotable` for tables
   - Include date range in filename

5. **Comparison to Previous Period:**
   - (Not implemented in this version - can add by fetching previous period data and calculating % change)

6. **Loading States:**
   - Show spinner while generating report
   - Disable export buttons when no data

---

## Shared Utilities

### Phone Formatting Utility
**File:** `src/lib/utils/phone.ts`

```typescript
/**
 * Format phone number as (123) 456-7890
 */
export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length >= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length >= 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length > 0) {
    return `(${cleaned}`;
  }

  return '';
}
```

---

## Implementation Checklist

### 1. Type Definitions
- [ ] Create `src/types/staff.ts` with all staff-related types
- [ ] Add StaffMemberWithStats interface
- [ ] Add CommissionSettingsData interface
- [ ] Add EarningsReportData interface

### 2. StaffDirectory Component
- [ ] Create `src/components/admin/settings/staff/StaffDirectory.tsx`
- [ ] Implement grid/list view toggle
- [ ] Add search with debouncing
- [ ] Add role and status filters
- [ ] Create StaffGridView subcomponent
- [ ] Create StaffListView subcomponent
- [ ] Create RoleBadge component
- [ ] Create StatusBadge component
- [ ] Create StaffEmptyState component
- [ ] Create StaffDirectorySkeleton component
- [ ] Test search functionality
- [ ] Test view switching
- [ ] Test responsive layout

### 3. StaffForm Component
- [ ] Create `src/components/admin/settings/staff/StaffForm.tsx`
- [ ] Implement create mode
- [ ] Implement edit mode
- [ ] Add Zod validation schema
- [ ] Implement email uniqueness check
- [ ] Implement phone auto-formatting
- [ ] Add deactivation confirmation dialog
- [ ] Show upcoming appointments warning
- [ ] Implement save handler (POST/PUT)
- [ ] Add success/error toasts
- [ ] Test form validation
- [ ] Test email uniqueness check
- [ ] Test deactivation flow

### 4. CommissionSettings Component
- [ ] Create `src/components/admin/settings/staff/CommissionSettings.tsx`
- [ ] Implement rate type selector (radio buttons)
- [ ] Add base rate input with validation
- [ ] Add include add-ons toggle
- [ ] Create service overrides table
- [ ] Implement add/remove override logic
- [ ] Create preview calculation display
- [ ] Add unsaved changes indicator
- [ ] Implement save handler (PUT)
- [ ] Test rate calculations
- [ ] Test service overrides
- [ ] Test preview updates

### 5. EarningsReport Component
- [ ] Create `src/components/admin/settings/staff/EarningsReport.tsx`
- [ ] Implement date preset selector
- [ ] Add custom date inputs
- [ ] Add groomer filter dropdown
- [ ] Add group by radio buttons
- [ ] Create summary cards
- [ ] Implement Recharts bar chart
- [ ] Create per-groomer breakdown table
- [ ] Implement CSV export
- [ ] Implement PDF export
- [ ] Test date range selection
- [ ] Test chart rendering
- [ ] Test export functionality

### 6. Integration & Testing
- [ ] Create staff management page using components
- [ ] Test all components together
- [ ] Test mobile responsiveness
- [ ] Test accessibility (keyboard navigation, ARIA labels)
- [ ] Test loading states
- [ ] Test error handling
- [ ] Review code quality
- [ ] Update documentation

---

## Important Notes

### 1. DaisyUI Version & Compatibility
- **DaisyUI 5.5.8** is installed
- Use semantic class names: `btn`, `card`, `input`, `select`, `table`, `badge`, `modal`, `alert`
- No custom theme configuration needed - use inline color overrides with Tailwind utilities

### 2. React Hook Form + Zod
- All forms use `react-hook-form` with `zodResolver`
- Validation schemas defined with Zod
- Use `register`, `watch`, `setValue`, `handleSubmit` patterns
- `isDirty` flag for unsaved changes detection

### 3. API Integration
- All API endpoints are already implemented and working
- Mock mode is enabled (`NEXT_PUBLIC_USE_MOCKS=true`)
- API responses follow consistent format: `{ data: ..., error: ... }`

### 4. Phone Formatting
- Auto-format as user types: `(123) 456-7890`
- Use `useEffect` to watch phone value and format
- Limit to 14 characters (including formatting)

### 5. Email Uniqueness Check
- Check on blur, not on every keystroke
- Skip check if email hasn't changed (edit mode)
- Show inline error message below input

### 6. Charts with Recharts
- Install if not already: `npm install recharts`
- Use `ResponsiveContainer` for mobile responsiveness
- Bar chart for earnings visualization
- Custom colors: Revenue = #6BCB77, Commission = #74B9FF

### 7. PDF Export
- Install if not already: `npm install jspdf jspdf-autotable`
- Use `jsPDF` for PDF generation
- Use `autoTable` for formatted tables
- Include date range in filename

### 8. CSV Export
- Build CSV string manually (headers + rows)
- Use Blob + URL.createObjectURL for download
- Include date range in filename

### 9. Toast Notifications
- Project may have existing toast system (check `src/hooks/use-toast.ts`)
- If not, implement simple toast using DaisyUI `alert` + Framer Motion
- Show success toasts on save
- Show error toasts on failure

### 10. Responsive Design
- Grid: 1 column mobile, 2 tablet, 3 desktop
- Use DaisyUI responsive classes: `md:`, `lg:`
- Tables should scroll horizontally on mobile (`overflow-x-auto`)
- Modal max-width: `max-w-2xl`

### 11. Accessibility
- Use semantic HTML (`<button>`, `<input>`, `<select>`)
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Use DaisyUI's built-in accessibility features

### 12. Loading & Error States
- Show loading spinner while fetching data
- Disable buttons during submission
- Show error messages inline (below inputs)
- Show empty states with helpful messages

### 13. Animations
- Use Framer Motion for smooth transitions
- `AnimatePresence` for grid card animations
- Hover scale on cards: `whileHover={{ scale: 1.02 }}`
- Gentle animations (0.2-0.3s duration)

### 14. Color Usage
- Primary text: `#434E54`
- Secondary text: `#6B7280`
- Muted text: `#9CA3AF`
- Background: `#F8EEE5`
- Card background: `#FFFFFF` or `#FFFBF7`
- Borders: `#E5E5E5` or `#434E54/10`
- Role badges: Purple for admin, blue for groomer
- Status badges: Green for active, gray for inactive

### 15. Known Limitations
- Backend API doesn't support search - do client-side filtering
- Active/inactive status not yet in database - plan for future
- Comparison to previous period not implemented in EarningsReport
- Toast system may need to be implemented if not exists

---

## Summary

This implementation plan provides **complete, production-ready code** for all 4 staff management UI components:

1. **StaffDirectory** - Grid/list view with search and filters
2. **StaffForm** - Create/edit modal with validation
3. **CommissionSettings** - Rate configuration with preview
4. **EarningsReport** - Charts and export functionality

All components:
- Use **DaisyUI 5.5.8** semantic classes
- Follow **Clean & Elegant Professional** design aesthetic
- Are fully responsive (mobile-first)
- Include proper TypeScript types
- Have loading and error states
- Use React Hook Form + Zod for forms
- Are accessible (ARIA, keyboard navigation)
- Include smooth Framer Motion animations

The implementation is ready to be executed by another developer or agent.
