# Notification Center UI Components Implementation Plan

**Date**: 2025-12-14
**Tasks**: 0064-0067 - Notification Center UI Components
**Status**: Ready for Implementation

---

## Overview

This document outlines the implementation plan for creating 5 modular UI components for the Admin Notification Center feature. These components will be used in the existing `src/app/admin/notifications/page.tsx` to create a clean, modular architecture.

**Current State**: The page at `src/app/admin/notifications/page.tsx` exists with inline component logic. We need to extract this into reusable, well-designed components following The Puppy Day design system.

**Backend**: All APIs are already implemented:
- `GET /api/admin/notifications` - List with filters, stats, pagination
- `POST /api/admin/notifications/[id]/resend` - Resend single notification
- `POST /api/admin/notifications/bulk-resend` - Bulk resend failed notifications

---

## Design System Reference

### The Puppy Day Color Palette

```css
/* Background */
--background: #F8EEE5;
--background-light: #FFFBF7;

/* Primary/Buttons */
--primary: #434E54;
--primary-hover: #363F44;

/* Secondary */
--secondary: #EAE0D5;

/* Cards */
--card-bg: #FFFFFF or #FFFBF7;

/* Text */
--text-primary: #434E54;
--text-secondary: #6B7280;
--text-muted: #9CA3AF;

/* Semantic */
--success: #6BCB77;
--warning: #FFB347;
--error: #EF4444;
--info: #74B9FF;
```

### Design Principles
- **Soft Shadows**: Use `shadow-sm`, `shadow-md`, `shadow-lg` (blurred shadows)
- **Subtle Borders**: `border-gray-200` (1px, light)
- **Gentle Corners**: `rounded-lg`, `rounded-xl`
- **Professional Typography**: Semibold to bold headings, regular body text
- **Clean Spacing**: Purposeful whitespace, uncluttered layouts
- **Smooth Transitions**: `transition-shadow`, `hover:shadow-md`

---

## Component Architecture

### File Structure

```
src/components/admin/notifications/
├── NotificationStats.tsx         # KPI summary cards (Task 0065)
├── NotificationFilters.tsx       # Filter bar with search (Task 0064)
├── NotificationTable.tsx         # Main table with pagination (Task 0063)
├── NotificationDetailModal.tsx   # Detail modal with resend (Task 0066)
└── BulkActions.tsx               # Bulk operations bar (Task 0067)
```

---

## Component 1: NotificationStats.tsx

**Task**: 0065
**Purpose**: Display 4 KPI cards showing notification summary statistics

### Component Signature

```typescript
'use client';

import { Send, TrendingUp, MousePointer, DollarSign } from 'lucide-react';
import type { NotificationStats } from '@/types/notifications';

interface NotificationStatsProps {
  stats: NotificationStats | null;
  loading?: boolean;
}

export function NotificationStats({ stats, loading }: NotificationStatsProps) {
  // Implementation
}
```

### Layout & Structure

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Card 1: Total Sent */}
  {/* Card 2: Delivery Rate */}
  {/* Card 3: Click Rate */}
  {/* Card 4: Total Cost */}
</div>
```

### Individual Card Design

Each KPI card should follow this pattern (similar to existing `KPICard.tsx`):

```tsx
<div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600 mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-[#434E54] mb-2">
        {formattedValue}
      </p>
      <p className="text-xs text-gray-500">
        {subtitle}
      </p>
    </div>
    {icon}
  </div>
</div>
```

### Card Specifications

#### Card 1: Total Sent
- **Label**: "Total Sent"
- **Value**: `stats.totalSent.toLocaleString()`
- **Subtitle**: `${stats.emailCount} emails, ${stats.smsCount} SMS`
- **Icon**: `<Send className="w-8 h-8 text-blue-500 opacity-50" />`

#### Card 2: Delivery Rate
- **Label**: "Delivery Rate"
- **Value**: `${stats.deliveryRate}%`
- **Subtitle**: `${stats.totalDelivered.toLocaleString()} delivered`
- **Icon**: `<TrendingUp className="w-8 h-8 text-green-500 opacity-50" />`
- **Value Color**: `text-green-600` (semantic success color)

#### Card 3: Click Rate
- **Label**: "Click Rate"
- **Value**: `${stats.clickRate}%`
- **Subtitle**: `${stats.totalClicked.toLocaleString()} clicked`
- **Icon**: `<MousePointer className="w-4 h-4 text-blue-500 opacity-50" />`
- **Value Color**: `text-blue-600` (semantic info color)

#### Card 4: Total Cost (SMS)
- **Label**: "Total Cost"
- **Value**: `$${stats.totalCostDollars.toFixed(2)}`
- **Subtitle**: `${stats.totalFailed} failed`
- **Icon**: `<DollarSign className="w-8 h-8 text-gray-500 opacity-50" />`

### Loading State

When `loading === true`:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {[1, 2, 3, 4].map((i) => (
    <div key={i} className="card bg-white shadow-sm p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
    </div>
  ))}
</div>
```

---

## Component 2: NotificationFilters.tsx

**Task**: 0064
**Purpose**: Filter bar with search, channel, status, type, date range, and clear filters

### Component Signature

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { NotificationFilters as FilterValues } from '@/types/notifications';

interface NotificationFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export function NotificationFilters({
  onFilterChange,
  initialFilters = {}
}: NotificationFiltersProps) {
  // Implementation
}
```

### Layout & Structure

Similar to `WaitlistFilters.tsx`:

```tsx
<div className="space-y-4">
  {/* Search Bar Row */}
  <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1">
      {/* Search input with icon */}
    </div>
    <button onClick={() => setShowFilters(!showFilters)}>
      {/* Toggle Filters Button */}
    </button>
  </div>

  {/* Collapsible Filter Panel */}
  {showFilters && (
    <div className="card bg-white border border-gray-200 rounded-lg">
      <div className="card-body space-y-4">
        {/* Filter controls */}
      </div>
    </div>
  )}
</div>
```

### Search Input Design

```tsx
<div className="relative flex-1">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
  <input
    type="text"
    placeholder="Search by customer name, email, or phone..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
    className="input input-bordered w-full pl-10 pr-10"
  />
  {searchTerm && (
    <button
      onClick={() => clearSearch()}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      <X className="h-5 w-5" />
    </button>
  )}
</div>
```

### Filter Toggle Button

```tsx
<button
  onClick={() => setShowFilters(!showFilters)}
  className={`btn gap-2 ${
    hasActiveFilters
      ? 'btn-primary bg-[#434E54] hover:bg-[#363F44] text-white'
      : 'btn-outline'
  }`}
>
  <Filter className="h-5 w-5" />
  Filters
  {hasActiveFilters && (
    <span className="badge badge-sm badge-white">
      {activeFilterCount}
    </span>
  )}
</button>
```

### Filter Panel (Collapsible)

```tsx
{showFilters && (
  <div className="card bg-white border border-gray-200 rounded-lg shadow-sm">
    <div className="card-body space-y-4">
      {/* Header with Clear All */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-[#434E54]">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="btn btn-sm btn-ghost gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Channel Dropdown */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Channel</span>
          </label>
          <select
            value={filters.channel || ''}
            onChange={(e) => handleFilterChange('channel', e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Status</span>
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Type Dropdown */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Type</span>
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">All Types</option>
            <option value="appointment_booked">Appointment Booked</option>
            <option value="appointment_confirmed">Confirmed</option>
            <option value="appointment_reminder">Reminder</option>
            <option value="appointment_cancelled">Cancelled</option>
            <option value="appointment_completed">Completed</option>
            <option value="report_card_sent">Report Card</option>
            <option value="waitlist_slot_available">Slot Available</option>
            <option value="breed_reminder">Grooming Reminder</option>
            <option value="marketing_campaign">Marketing</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="label">
            <span className="label-text font-medium">From Date</span>
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="label">
            <span className="label-text font-medium">To Date</span>
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
      </div>
    </div>
  </div>
)}
```

### State Management

```typescript
const [filters, setFilters] = useState<FilterValues>(initialFilters);
const [searchTerm, setSearchTerm] = useState('');
const [showFilters, setShowFilters] = useState(false);

// Debounced filter change
useEffect(() => {
  const timer = setTimeout(() => {
    onFilterChange(filters);
  }, 300);
  return () => clearTimeout(timer);
}, [filters, onFilterChange]);

// Calculate active filter count
const hasActiveFilters =
  filters.channel ||
  filters.status ||
  filters.type ||
  filters.dateFrom ||
  filters.dateTo ||
  filters.search;

const activeFilterCount = [
  filters.channel,
  filters.status,
  filters.type,
  filters.dateFrom,
  filters.dateTo,
  filters.search,
].filter(Boolean).length;
```

---

## Component 3: NotificationTable.tsx

**Task**: 0063
**Purpose**: Main table displaying notification history with pagination

### Component Signature

```typescript
'use client';

import { Mail, MessageSquare, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { NotificationWithCustomer } from '@/types/notifications';
import { getNotificationTypeLabel } from '@/types/notifications';

interface NotificationTableProps {
  notifications: NotificationWithCustomer[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onRowClick: (notification: NotificationWithCustomer) => void;
}

export function NotificationTable({
  notifications,
  loading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
  onRowClick
}: NotificationTableProps) {
  // Implementation
}
```

### Table Structure

```tsx
<div className="card bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
  {loading ? (
    <LoadingState />
  ) : error ? (
    <ErrorState error={error} />
  ) : notifications.length === 0 ? (
    <EmptyState />
  ) : (
    <>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left">Type</th>
              <th className="text-left">Channel</th>
              <th className="text-left">Recipient</th>
              <th className="text-left">Status</th>
              <th className="text-left">Sent</th>
              <th className="text-left">Delivered</th>
              <th className="text-left">Clicked</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onClick={onRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
      />
    </>
  )}
</div>
```

### Table Row Design

```tsx
<tr
  className="hover:bg-gray-50 cursor-pointer transition-colors"
  onClick={() => onClick(notification)}
>
  {/* Type & Customer Name */}
  <td>
    <div className="flex flex-col">
      <span className="font-medium text-[#434E54]">
        {getNotificationTypeLabel(notification.type)}
      </span>
      {notification.customer_name && (
        <span className="text-sm text-gray-500">
          {notification.customer_name}
        </span>
      )}
    </div>
  </td>

  {/* Channel with Icon */}
  <td>
    <div className="flex items-center gap-2">
      {notification.channel === 'email' ? (
        <Mail className="w-4 h-4 text-blue-500" />
      ) : (
        <MessageSquare className="w-4 h-4 text-green-500" />
      )}
      <span className="capitalize text-sm">{notification.channel}</span>
    </div>
  </td>

  {/* Recipient */}
  <td className="text-sm text-gray-600">
    {notification.recipient}
  </td>

  {/* Status Badge */}
  <td>
    {notification.status === 'sent' ? (
      <span className="badge badge-success badge-sm">Sent</span>
    ) : notification.status === 'failed' ? (
      <span className="badge badge-error badge-sm">Failed</span>
    ) : (
      <span className="badge badge-warning badge-sm">Pending</span>
    )}
  </td>

  {/* Sent Timestamp */}
  <td className="text-sm text-gray-600">
    {notification.sent_at
      ? format(new Date(notification.sent_at), 'MMM d, h:mm a')
      : '-'}
  </td>

  {/* Delivered Indicator */}
  <td className="text-sm text-gray-600">
    {notification.delivered_at ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      '-'
    )}
  </td>

  {/* Clicked Indicator */}
  <td className="text-sm text-gray-600">
    {notification.clicked_at ? (
      <CheckCircle className="w-4 h-4 text-blue-500" />
    ) : (
      '-'
    )}
  </td>

  {/* Actions */}
  <td>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(notification);
      }}
      className="btn btn-ghost btn-sm gap-2"
    >
      <Eye className="w-4 h-4" />
      View
    </button>
  </td>
</tr>
```

### Pagination Component

Similar to `WaitlistTable.tsx`:

```tsx
{totalPages > 1 && (
  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
    <div className="text-sm text-gray-600">
      Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total} notifications
    </div>
    <div className="join">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="join-item btn btn-sm"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page Numbers */}
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const pageNum = calculatePageNumber(i, page, totalPages);
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`join-item btn btn-sm ${
              page === pageNum ? 'btn-active' : ''
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="join-item btn btn-sm"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
)}
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-16">
  <Mail className="w-16 h-16 text-gray-300 mb-4" />
  <h3 className="text-xl font-semibold text-gray-700">
    No notifications found
  </h3>
  <p className="text-gray-500 text-center max-w-md mt-2">
    Notifications will appear here as they are sent through the system.
  </p>
</div>
```

### Loading State

```tsx
<div className="flex items-center justify-center py-16">
  <div className="loading loading-spinner loading-lg text-[#434E54]"></div>
</div>
```

### Error State

```tsx
<div className="flex items-center justify-center py-12 text-red-600">
  <AlertCircle className="w-6 h-6 mr-2" />
  <span>{error}</span>
</div>
```

---

## Component 4: NotificationDetailModal.tsx

**Task**: 0066
**Purpose**: Modal showing full notification details with resend capability

### Component Signature

```typescript
'use client';

import { useState } from 'react';
import { X, Mail, MessageSquare, RefreshCw, User, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import type { NotificationWithCustomer } from '@/types/notifications';
import { getNotificationTypeLabel } from '@/types/notifications';

interface NotificationDetailModalProps {
  notification: NotificationWithCustomer | null;
  isOpen: boolean;
  onClose: () => void;
  onResend?: (id: string) => Promise<void>;
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onResend,
}: NotificationDetailModalProps) {
  // Implementation
}
```

### Modal Structure

Using DaisyUI modal pattern:

```tsx
{isOpen && notification && (
  <div className="modal modal-open">
    <div className="modal-box max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#434E54]">
          Notification Details
        </h3>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Type & Channel Row */}
        {/* Customer Info */}
        {/* Recipient */}
        {/* Subject (if email) */}
        {/* Message Content */}
        {/* Status & Error */}
        {/* Delivery Timeline */}
      </div>

      {/* Actions */}
      <div className="modal-action">
        <button onClick={onClose} className="btn btn-ghost">
          Close
        </button>
        {notification.customer_id && (
          <Link
            href={`/admin/customers/${notification.customer_id}`}
            className="btn btn-outline gap-2"
          >
            <User className="w-4 h-4" />
            View Customer
          </Link>
        )}
        {notification.status === 'failed' && onResend && (
          <button
            onClick={() => handleResend(notification.id)}
            disabled={resending}
            className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] text-white gap-2"
          >
            {resending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend
              </>
            )}
          </button>
        )}
      </div>
    </div>
    <div className="modal-backdrop" onClick={onClose}></div>
  </div>
)}
```

### Content Sections

#### Type & Channel

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium text-gray-600">Type</label>
    <p className="text-[#434E54] font-medium mt-1">
      {getNotificationTypeLabel(notification.type)}
    </p>
  </div>
  <div>
    <label className="text-sm font-medium text-gray-600">Channel</label>
    <div className="flex items-center gap-2 mt-1">
      {notification.channel === 'email' ? (
        <Mail className="w-4 h-4 text-blue-500" />
      ) : (
        <MessageSquare className="w-4 h-4 text-green-500" />
      )}
      <span className="capitalize text-[#434E54] font-medium">
        {notification.channel}
      </span>
    </div>
  </div>
</div>
```

#### Customer Info (if available)

```tsx
{notification.customer_name && (
  <div>
    <label className="text-sm font-medium text-gray-600">Customer</label>
    <p className="text-[#434E54] font-medium mt-1">
      {notification.customer_name}
    </p>
  </div>
)}
```

#### Recipient

```tsx
<div>
  <label className="text-sm font-medium text-gray-600">Recipient</label>
  <p className="text-[#434E54] font-medium mt-1">
    {notification.recipient}
  </p>
</div>
```

#### Subject (for email)

```tsx
{notification.subject && (
  <div>
    <label className="text-sm font-medium text-gray-600">Subject</label>
    <p className="text-[#434E54] font-medium mt-1">
      {notification.subject}
    </p>
  </div>
)}
```

#### Message Content

```tsx
<div>
  <label className="text-sm font-medium text-gray-600">Content</label>
  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <p className="text-sm text-gray-700 whitespace-pre-wrap">
      {notification.content}
    </p>
  </div>
</div>
```

#### Status & Error

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium text-gray-600">Status</label>
    <div className="mt-1">
      {notification.status === 'sent' ? (
        <span className="badge badge-success">Sent</span>
      ) : notification.status === 'failed' ? (
        <span className="badge badge-error">Failed</span>
      ) : (
        <span className="badge badge-warning">Pending</span>
      )}
    </div>
  </div>
  {notification.error_message && (
    <div>
      <label className="text-sm font-medium text-gray-600">Error</label>
      <p className="text-sm text-red-600 mt-1">
        {notification.error_message}
      </p>
    </div>
  )}
</div>
```

#### Delivery Timeline

```tsx
<div className="pt-4 border-t border-gray-200">
  <label className="text-sm font-medium text-gray-600 mb-3 block">
    Delivery Timeline
  </label>
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="text-xs font-medium text-gray-600">Sent</label>
      <p className="text-sm text-gray-700 mt-1">
        {notification.sent_at
          ? format(new Date(notification.sent_at), 'MMM d, h:mm a')
          : '-'}
      </p>
    </div>
    <div>
      <label className="text-xs font-medium text-gray-600">Delivered</label>
      <p className="text-sm text-gray-700 mt-1">
        {notification.delivered_at
          ? format(new Date(notification.delivered_at), 'MMM d, h:mm a')
          : '-'}
      </p>
    </div>
    <div>
      <label className="text-xs font-medium text-gray-600">Clicked</label>
      <p className="text-sm text-gray-700 mt-1">
        {notification.clicked_at
          ? format(new Date(notification.clicked_at), 'MMM d, h:mm a')
          : '-'}
      </p>
    </div>
  </div>
</div>
```

### Resend Functionality

```typescript
const [resending, setResending] = useState(false);

async function handleResend(id: string) {
  if (!onResend) return;

  try {
    setResending(true);
    await onResend(id);
    onClose();
  } catch (error) {
    console.error('Failed to resend notification:', error);
    alert('Failed to resend notification');
  } finally {
    setResending(false);
  }
}
```

---

## Component 5: BulkActions.tsx

**Task**: 0067
**Purpose**: Bulk operations bar for resending failed notifications

### Component Signature

```typescript
'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface BulkActionsProps {
  failedCount: number;
  onResendFailed: () => Promise<{ totalResent: number; totalFailed: number }>;
}

export function BulkActions({ failedCount, onResendFailed }: BulkActionsProps) {
  // Implementation
}
```

### Component Structure

```tsx
<div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
  <div className="flex items-center gap-4">
    <span className="text-sm font-medium text-gray-600">
      Bulk Actions
    </span>
    {failedCount > 0 && (
      <span className="badge badge-error badge-sm">
        {failedCount} failed
      </span>
    )}
  </div>

  <button
    onClick={handleResendFailed}
    disabled={resending || failedCount === 0}
    className="btn btn-outline gap-2"
  >
    <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
    {resending ? 'Resending...' : 'Resend Failed'}
  </button>

  {/* Confirmation Modal */}
  {showConfirmation && (
    <ConfirmationDialog />
  )}

  {/* Results Modal */}
  {showResults && (
    <ResultsDialog />
  )}
</div>
```

### Confirmation Dialog

```tsx
{showConfirmation && (
  <div className="modal modal-open">
    <div className="modal-box">
      <h3 className="font-bold text-lg text-[#434E54] mb-4">
        Confirm Bulk Resend
      </h3>
      <div className="flex items-start gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
        <div>
          <p className="text-gray-700">
            Are you sure you want to resend all {failedCount} failed notifications?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This action will attempt to resend all notifications that previously failed.
          </p>
        </div>
      </div>
      <div className="modal-action">
        <button
          onClick={() => setShowConfirmation(false)}
          className="btn btn-ghost"
        >
          Cancel
        </button>
        <button
          onClick={confirmResend}
          className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] text-white"
        >
          Confirm Resend
        </button>
      </div>
    </div>
    <div className="modal-backdrop" onClick={() => setShowConfirmation(false)}></div>
  </div>
)}
```

### Progress Indicator

While resending, show loading state:

```tsx
{resending && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 max-w-md">
      <div className="flex flex-col items-center gap-4">
        <div className="loading loading-spinner loading-lg text-[#434E54]"></div>
        <p className="text-gray-700 font-medium">
          Resending notifications...
        </p>
        <p className="text-sm text-gray-500">
          This may take a few moments.
        </p>
      </div>
    </div>
  </div>
)}
```

### Results Dialog

```tsx
{showResults && results && (
  <div className="modal modal-open">
    <div className="modal-box">
      <h3 className="font-bold text-lg text-[#434E54] mb-4">
        Resend Results
      </h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-success" />
          <div>
            <p className="font-medium text-gray-700">
              {results.totalResent} notifications resent successfully
            </p>
          </div>
        </div>
        {results.totalFailed > 0 && (
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-error" />
            <div>
              <p className="font-medium text-gray-700">
                {results.totalFailed} notifications failed to resend
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="modal-action">
        <button
          onClick={() => {
            setShowResults(false);
            setResults(null);
          }}
          className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] text-white"
        >
          Close
        </button>
      </div>
    </div>
    <div className="modal-backdrop" onClick={() => setShowResults(false)}></div>
  </div>
)}
```

### State Management

```typescript
const [resending, setResending] = useState(false);
const [showConfirmation, setShowConfirmation] = useState(false);
const [showResults, setShowResults] = useState(false);
const [results, setResults] = useState<{
  totalResent: number;
  totalFailed: number
} | null>(null);

async function handleResendFailed() {
  setShowConfirmation(true);
}

async function confirmResend() {
  setShowConfirmation(false);
  setResending(true);

  try {
    const result = await onResendFailed();
    setResults(result);
    setShowResults(true);
  } catch (error) {
    console.error('Bulk resend failed:', error);
    alert('Failed to resend notifications');
  } finally {
    setResending(false);
  }
}
```

---

## Integration into Page

### Update `src/app/admin/notifications/page.tsx`

Replace inline logic with components:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { NotificationStats } from '@/components/admin/notifications/NotificationStats';
import { NotificationFilters } from '@/components/admin/notifications/NotificationFilters';
import { NotificationTable } from '@/components/admin/notifications/NotificationTable';
import { NotificationDetailModal } from '@/components/admin/notifications/NotificationDetailModal';
import { BulkActions } from '@/components/admin/notifications/BulkActions';
import type {
  NotificationWithCustomer,
  NotificationFilters as FilterValues,
  NotificationStats as StatsData,
} from '@/types/notifications';

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<NotificationWithCustomer[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({});
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithCustomer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, [page, filters]);

  async function fetchNotifications() {
    // Implementation (already exists)
  }

  async function handleResendNotification(id: string) {
    // Implementation (already exists)
  }

  async function handleBulkResendFailed() {
    // Implementation (already exists)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#434E54] mb-2">
          Notification Center
        </h1>
        <p className="text-gray-600">
          View and manage all SMS and Email notifications sent through the system
        </p>
      </div>

      {/* Stats */}
      <NotificationStats stats={stats} loading={loading} />

      {/* Bulk Actions */}
      {stats && stats.totalFailed > 0 && (
        <div className="mt-6">
          <BulkActions
            failedCount={stats.totalFailed}
            onResendFailed={handleBulkResendFailed}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mt-6">
        <NotificationFilters
          onFilterChange={setFilters}
          initialFilters={filters}
        />
      </div>

      {/* Table */}
      <div className="mt-6">
        <NotificationTable
          notifications={notifications}
          loading={loading}
          error={error}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          onRowClick={(notification) => {
            setSelectedNotification(notification);
            setShowDetailModal(true);
          }}
        />
      </div>

      {/* Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={showDetailModal}
        onClose={() => {
          setSelectedNotification(null);
          setShowDetailModal(false);
        }}
        onResend={handleResendNotification}
      />
    </div>
  );
}
```

---

## Important Implementation Notes

### 1. DaisyUI Components to Use

- **Cards**: `card`, `card-body`
- **Buttons**: `btn`, `btn-primary`, `btn-outline`, `btn-ghost`, `btn-sm`
- **Badges**: `badge`, `badge-success`, `badge-error`, `badge-warning`, `badge-sm`
- **Tables**: `table`, `table-zebra`
- **Modals**: `modal`, `modal-open`, `modal-box`, `modal-action`, `modal-backdrop`
- **Inputs**: `input`, `input-bordered`, `select`, `select-bordered`
- **Pagination**: `join`, `join-item`
- **Loading**: `loading`, `loading-spinner`, `loading-lg`

### 2. Lucide React Icons

```typescript
import {
  Mail,           // Email icon
  MessageSquare,  // SMS icon
  Send,           // Total sent icon
  TrendingUp,     // Delivery rate icon
  MousePointer,   // Click rate icon
  DollarSign,     // Cost icon
  Search,         // Search input icon
  Filter,         // Filters toggle icon
  X,              // Close/clear icon
  CheckCircle,    // Delivered/clicked indicator
  Eye,            // View button icon
  RefreshCw,      // Resend icon
  AlertCircle,    // Error/warning icon
  User,           // Customer profile link icon
  ChevronLeft,    // Pagination prev
  ChevronRight,   // Pagination next
} from 'lucide-react';
```

### 3. Date Formatting

Use `date-fns` for consistent date formatting:

```typescript
import { format } from 'date-fns';

// Display format: "MMM d, h:mm a" -> "Dec 14, 2:30 PM"
format(new Date(timestamp), 'MMM d, h:mm a');
```

### 4. Type Safety

All components should use TypeScript with proper types from:
- `@/types/notifications.ts` - `NotificationWithCustomer`, `NotificationFilters`, `NotificationStats`
- `@/types/database.ts` - `NotificationChannel`, `NotificationStatus`

### 5. API Integration

Components should NOT call APIs directly. Instead, they should receive data and callbacks from the parent page component:

- **NotificationStats**: Receives `stats` prop
- **NotificationFilters**: Calls `onFilterChange` callback
- **NotificationTable**: Receives `notifications`, calls `onRowClick`, `onPageChange`
- **NotificationDetailModal**: Calls `onResend` callback
- **BulkActions**: Calls `onResendFailed` callback

### 6. Responsive Design

All components must be mobile-responsive:

```css
/* Grid breakpoints */
grid-cols-1           /* Mobile: 1 column */
md:grid-cols-2        /* Tablet: 2 columns */
lg:grid-cols-4        /* Desktop: 4 columns */

/* Flex direction */
flex-col              /* Mobile: vertical stack */
sm:flex-row           /* Tablet+: horizontal row */
```

### 7. Accessibility

- All interactive elements should have `aria-label` attributes
- Focus states should be visible (`focus:ring-2 focus:ring-[#434E54]`)
- Modal backdrop should close modal on click
- Keyboard navigation should work (Enter to search, Escape to close modals)

### 8. Error Handling

All components should handle edge cases:
- Empty states (no data)
- Loading states (skeleton loaders)
- Error states (error messages)
- Null/undefined props

---

## Testing Checklist

After implementing all components, verify:

- [ ] Stats cards display correct metrics
- [ ] Stats cards show loading skeleton when `loading === true`
- [ ] Filter toggles expand/collapse panel
- [ ] Search input triggers filter on Enter key
- [ ] Clear filters button resets all filters
- [ ] Active filters show badge count on Filters button
- [ ] Table displays all notification data correctly
- [ ] Table row hover state works
- [ ] Table row click opens detail modal
- [ ] Pagination buttons work correctly
- [ ] Pagination disables first/last buttons appropriately
- [ ] Empty state shows when no notifications
- [ ] Loading state shows during API calls
- [ ] Error state shows when API fails
- [ ] Detail modal opens/closes correctly
- [ ] Detail modal displays all notification metadata
- [ ] Detail modal shows resend button only for failed notifications
- [ ] Resend button in modal triggers API call
- [ ] Customer profile link navigates correctly
- [ ] Bulk Actions bar shows failed count
- [ ] Bulk resend shows confirmation dialog
- [ ] Bulk resend shows progress indicator
- [ ] Bulk resend shows results summary
- [ ] All components are mobile-responsive
- [ ] All components follow The Puppy Day design system

---

## Files Summary

### New Files to Create

1. `src/components/admin/notifications/NotificationStats.tsx` (Task 0065)
2. `src/components/admin/notifications/NotificationFilters.tsx` (Task 0064)
3. `src/components/admin/notifications/NotificationTable.tsx` (Task 0063)
4. `src/components/admin/notifications/NotificationDetailModal.tsx` (Task 0066)
5. `src/components/admin/notifications/BulkActions.tsx` (Task 0067)

### Files to Modify

1. `src/app/admin/notifications/page.tsx` - Replace inline logic with components

### Files Already Implemented (No Changes Needed)

1. `src/types/notifications.ts` - All types defined
2. `src/app/api/admin/notifications/route.ts` - List API
3. `src/app/api/admin/notifications/[id]/resend/route.ts` - Resend API
4. `src/app/api/admin/notifications/bulk-resend/route.ts` - Bulk resend API

---

## Next Steps

1. Create component files in order: Stats → Filters → Table → DetailModal → BulkActions
2. Update page.tsx to use new components
3. Test each component individually
4. Test full page integration
5. Verify mobile responsiveness
6. Verify accessibility
7. Mark tasks 0064-0067 as completed

---

**End of Implementation Plan**
