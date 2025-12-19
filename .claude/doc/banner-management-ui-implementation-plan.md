# Banner Management UI Implementation Plan
## Tasks 0173-0176: Promotional Banner Management Components

**Created:** 2025-12-18
**Agent:** @daisyui-expert
**Phase:** 8 - Notifications & Admin Settings
**Design System:** Clean & Elegant Professional

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [File Structure](#file-structure)
4. [Task 0173: Banner List Component](#task-0173-banner-list-component-with-status-badges)
5. [Task 0174: Drag-Drop Reordering](#task-0174-banner-drag-drop-reordering)
6. [Task 0175: Banner Editor Modal](#task-0175-banner-editor-modal-createedit)
7. [Task 0176: Banner Scheduling](#task-0176-banner-scheduling-with-date-pickers)
8. [Additional Components](#additional-components)
9. [API Integration Points](#api-integration-points)
10. [Testing Checklist](#testing-checklist)

---

## Overview

This implementation plan details the creation of a complete promotional banner management interface using DaisyUI components, following The Puppy Day's Clean & Elegant Professional design system. The interface will support full CRUD operations, drag-drop reordering, scheduling, and responsive layouts.

### Key Technologies
- **DaisyUI Components:** `badge`, `btn`, `modal`, `card`, `input`, `toggle`, `textarea`
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable` (already installed)
- **Date Handling:** `date-fns`, `date-fns-tz` (already installed)
- **Animations:** Framer Motion (already installed)
- **State Management:** React hooks with optimistic UI updates

### Design System Colors
```typescript
// From project design system
const COLORS = {
  background: '#F8EEE5',      // Warm cream background
  primary: '#434E54',         // Charcoal
  primaryHover: '#363F44',    // Darker charcoal
  secondary: '#EAE0D5',       // Lighter cream
  textPrimary: '#434E54',     // Same as primary
  textSecondary: '#6B7280',   // Gray
  white: '#FFFFFF',
  lightCream: '#FFFBF7'
};
```

---

## Prerequisites

### Already Available
✅ **Packages:**
- `@dnd-kit/core`: ^6.3.1
- `@dnd-kit/sortable`: ^10.0.0
- `@dnd-kit/utilities`: ^3.2.2
- `date-fns`: ^4.1.0
- `date-fns-tz`: ^3.2.0
- `framer-motion`: ^12.23.25
- `daisyui`: ^5.5.8

✅ **Types:**
- `src/types/banner.ts` - Complete banner types and schemas
- `src/types/database.ts` - `PromoBanner` interface

✅ **Utilities:**
- `src/lib/utils.ts` - `cn()` for class merging
- `src/lib/utils/validation.ts` - `validateImageFile()`
- `src/lib/utils/timezone.ts` - `BUSINESS_TIMEZONE`

✅ **Existing Components:**
- `src/components/admin/ErrorState.tsx` - Error handling
- `src/components/ui/skeletons/Skeleton.tsx` - Loading states
- `src/components/admin/gallery/GalleryUploadModal.tsx` - Upload reference

### Needs Creation
❌ Banner API endpoints (Tasks 0169-0172, likely already implemented)
❌ Banner management components (Tasks 0173-0176)

---

## File Structure

```
src/
├── components/
│   └── admin/
│       └── settings/
│           └── banners/
│               ├── BannerList.tsx              # Task 0173 + 0174
│               ├── BannerEditor.tsx            # Task 0175 + 0176
│               ├── BannerImageUpload.tsx       # Reusable upload component
│               ├── BannerSkeleton.tsx          # Loading skeleton
│               └── BannerEmptyState.tsx        # Empty state component
├── app/
│   └── admin/
│       └── settings/
│           └── banners/
│               └── page.tsx                    # Main page (update existing)
└── lib/
    └── utils/
        └── banner-helpers.ts                   # Helper functions
```

---

## Task 0173: Banner List Component with Status Badges

### File: `src/components/admin/settings/banners/BannerList.tsx`

#### Component Architecture

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { BannerWithStatus } from '@/types/banner';
import { computeBannerStatus } from '@/types/banner';
import { cn } from '@/lib/utils';
import { BannerSkeleton } from './BannerSkeleton';
import { BannerEmptyState } from './BannerEmptyState';
import { ErrorState } from '@/components/admin/ErrorState';

interface BannerListProps {
  onEdit: (bannerId: string) => void;
  onDelete: (bannerId: string) => void;
  onReorder: (banners: Array<{ id: string; display_order: number }>) => void;
  refreshTrigger?: number; // External trigger to refetch
}

export function BannerList({ onEdit, onDelete, onReorder, refreshTrigger }: BannerListProps) {
  const [banners, setBanners] = useState<BannerWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch banners on mount and when refreshTrigger changes
  useEffect(() => {
    fetchBanners();
  }, [refreshTrigger]);

  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/banners');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch banners');
      }

      // Add computed status to each banner
      const bannersWithStatus: BannerWithStatus[] = data.banners.map((banner: any) => ({
        ...banner,
        status: computeBannerStatus(banner.is_active, banner.start_date, banner.end_date)
      }));

      setBanners(bannersWithStatus);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError(err instanceof Error ? err.message : 'Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (bannerId: string, currentState: boolean) => {
    setTogglingId(bannerId);

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle banner status');
      }

      // Optimistically update local state
      setBanners(prev => prev.map(b =>
        b.id === bannerId
          ? {
              ...b,
              is_active: !currentState,
              status: computeBannerStatus(!currentState, b.start_date, b.end_date)
            }
          : b
      ));
    } catch (err) {
      console.error('Error toggling banner:', err);
      alert('Failed to toggle banner status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      return;
    }

    setDeletingId(bannerId);

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete banner');
      }

      setBanners(prev => prev.filter(b => b.id !== bannerId));
      onDelete(bannerId);
    } catch (err) {
      console.error('Error deleting banner:', err);
      alert('Failed to delete banner. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return <BannerSkeleton count={3} />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        type="server"
        message={error}
        onRetry={fetchBanners}
      />
    );
  }

  // Empty state
  if (banners.length === 0) {
    return <BannerEmptyState onCreate={() => onEdit('new')} />;
  }

  return (
    <div className="space-y-4">
      {/* Desktop: Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#EAE0D5]/30 border-b border-[#434E54]/10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Preview</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Alt Text</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Click URL</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Clicks</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-[#434E54]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#434E54]/10">
            {banners.map((banner, index) => (
              <BannerTableRow
                key={banner.id}
                banner={banner}
                onEdit={() => onEdit(banner.id)}
                onDelete={() => handleDelete(banner.id)}
                onToggleActive={() => handleToggleActive(banner.id, banner.is_active)}
                isDeleting={deletingId === banner.id}
                isToggling={togglingId === banner.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {banners.map((banner) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            onEdit={() => onEdit(banner.id)}
            onDelete={() => handleDelete(banner.id)}
            onToggleActive={() => handleToggleActive(banner.id, banner.is_active)}
            isDeleting={deletingId === banner.id}
            isToggling={togglingId === banner.id}
          />
        ))}
      </div>
    </div>
  );
}

// Desktop Table Row Component
interface BannerRowProps {
  banner: BannerWithStatus;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  isDeleting: boolean;
  isToggling: boolean;
}

function BannerTableRow({ banner, onEdit, onDelete, onToggleActive, isDeleting, isToggling }: BannerRowProps) {
  return (
    <tr className="hover:bg-[#EAE0D5]/10 transition-colors">
      {/* Thumbnail Preview */}
      <td className="px-6 py-4">
        <img
          src={banner.image_url}
          alt={banner.alt_text || 'Banner'}
          className="w-24 h-12 object-cover rounded-lg border border-[#434E54]/10"
        />
      </td>

      {/* Alt Text */}
      <td className="px-6 py-4">
        <p className="text-sm text-[#434E54] line-clamp-2 max-w-xs">
          {banner.alt_text || <span className="text-[#6B7280] italic">No alt text</span>}
        </p>
      </td>

      {/* Click URL */}
      <td className="px-6 py-4">
        {banner.click_url ? (
          <a
            href={banner.click_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline line-clamp-1 max-w-xs block"
          >
            {banner.click_url}
          </a>
        ) : (
          <span className="text-sm text-[#6B7280] italic">No URL</span>
        )}
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4">
        <BannerStatusBadge status={banner.status} />
      </td>

      {/* Click Count */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-[#434E54]">
          {banner.click_count.toLocaleString()}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {/* Toggle Active */}
          <button
            onClick={onToggleActive}
            disabled={isToggling}
            className={cn(
              "p-2 rounded-lg transition-colors",
              banner.is_active
                ? "text-green-600 hover:bg-green-50"
                : "text-gray-400 hover:bg-gray-50",
              isToggling && "opacity-50 cursor-not-allowed"
            )}
            title={banner.is_active ? "Active - Click to deactivate" : "Inactive - Click to activate"}
          >
            {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Edit */}
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit banner"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className={cn(
              "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
              isDeleting && "opacity-50 cursor-not-allowed"
            )}
            title="Delete banner"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Mobile Card Component
function BannerCard({ banner, onEdit, onDelete, onToggleActive, isDeleting, isToggling }: BannerRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-4 space-y-3"
    >
      {/* Image Preview */}
      <img
        src={banner.image_url}
        alt={banner.alt_text || 'Banner'}
        className="w-full h-32 object-cover rounded-lg border border-[#434E54]/10"
      />

      {/* Alt Text */}
      <div>
        <p className="text-xs text-[#6B7280] mb-1">Alt Text</p>
        <p className="text-sm text-[#434E54] line-clamp-2">
          {banner.alt_text || <span className="italic">No alt text</span>}
        </p>
      </div>

      {/* Status and Clicks */}
      <div className="flex items-center justify-between">
        <BannerStatusBadge status={banner.status} />
        <span className="text-sm text-[#6B7280]">
          {banner.click_count} clicks
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-[#434E54]/10">
        <button
          onClick={onToggleActive}
          disabled={isToggling}
          className={cn(
            "flex-1 btn btn-sm",
            banner.is_active ? "btn-success" : "btn-ghost"
          )}
        >
          {banner.is_active ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
          {banner.is_active ? 'Active' : 'Inactive'}
        </button>
        <button onClick={onEdit} className="btn btn-sm btn-primary">
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="btn btn-sm btn-error"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'draft' | 'scheduled' | 'active' | 'expired';
}

function BannerStatusBadge({ status }: StatusBadgeProps) {
  const config = {
    draft: {
      label: 'Draft',
      className: 'badge-ghost text-gray-600'
    },
    scheduled: {
      label: 'Scheduled',
      className: 'badge-info'
    },
    active: {
      label: 'Active',
      className: 'badge-success'
    },
    expired: {
      label: 'Expired',
      className: 'badge-error'
    }
  };

  const { label, className } = config[status];

  return (
    <span className={cn('badge badge-sm', className)}>
      {label}
    </span>
  );
}
```

#### Key Implementation Notes

1. **DaisyUI Components Used:**
   - `badge` - For status indicators with semantic colors
   - `btn` - For action buttons with consistent styling
   - DaisyUI color modifiers: `btn-primary`, `btn-success`, `btn-error`, `btn-ghost`

2. **Responsive Strategy:**
   - Desktop (md+): HTML `<table>` with full data columns
   - Mobile: Card-based layout with stacked information
   - Uses Tailwind's `hidden md:block` and `md:hidden` utilities

3. **Status Badge Logic:**
   - Draft: Gray `badge-ghost` - not active, no dates set
   - Scheduled: Blue `badge-info` - future start_date
   - Active: Green `badge-success` - is_active and within dates
   - Expired: Red `badge-error` - end_date has passed
   - Computed using `computeBannerStatus()` from `src/types/banner.ts`

4. **Optimistic UI:**
   - Toggle active state immediately updates local state
   - Rollback handled via error alerts (could be improved with toast)

5. **Accessibility:**
   - Semantic HTML (`<table>`, `<button>`)
   - Meaningful `title` attributes for icon-only buttons
   - Disabled states properly communicated

---

## Task 0174: Banner Drag-Drop Reordering

### Update: `src/components/admin/settings/banners/BannerList.tsx`

#### Add DnD Kit Integration

```typescript
// Add these imports at the top
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

// Update BannerList component
export function BannerList({ onEdit, onDelete, onReorder, refreshTrigger }: BannerListProps) {
  // ... existing state ...

  // DnD Kit sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update local state
    const newBanners = arrayMove(banners, oldIndex, newIndex).map((banner, index) => ({
      ...banner,
      display_order: index
    }));

    setBanners(newBanners);

    // Send to API
    try {
      const response = await fetch('/api/admin/banners/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banners: newBanners.map((b, index) => ({
            id: b.id,
            display_order: index
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder banners');
      }

      onReorder(newBanners.map((b, index) => ({ id: b.id, display_order: index })));
    } catch (err) {
      console.error('Error reordering banners:', err);
      // Rollback on error
      fetchBanners();
      alert('Failed to reorder banners. Please try again.');
    }
  };

  // Wrap table/cards in DndContext
  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={banners.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* Desktop: Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
            <table className="w-full">
              {/* ... thead ... */}
              <tbody className="divide-y divide-[#434E54]/10">
                {banners.map((banner) => (
                  <SortableBannerTableRow
                    key={banner.id}
                    banner={banner}
                    onEdit={() => onEdit(banner.id)}
                    onDelete={() => handleDelete(banner.id)}
                    onToggleActive={() => handleToggleActive(banner.id, banner.is_active)}
                    isDeleting={deletingId === banner.id}
                    isToggling={togglingId === banner.id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Card View with Up/Down Arrows */}
          <div className="md:hidden space-y-3">
            {banners.map((banner, index) => (
              <MobileBannerCard
                key={banner.id}
                banner={banner}
                index={index}
                totalCount={banners.length}
                onMoveUp={() => handleMobileMoveUp(index)}
                onMoveDown={() => handleMobileMoveDown(index)}
                onEdit={() => onEdit(banner.id)}
                onDelete={() => handleDelete(banner.id)}
                onToggleActive={() => handleToggleActive(banner.id, banner.is_active)}
                isDeleting={deletingId === banner.id}
                isToggling={togglingId === banner.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Sortable Table Row Component (Desktop)
function SortableBannerTableRow(props: BannerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover:bg-[#EAE0D5]/10 transition-colors",
        isDragging && "bg-[#EAE0D5]/20"
      )}
    >
      {/* Drag Handle Column */}
      <td className="px-4 py-4">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-[#434E54]/40 hover:text-[#434E54] cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      </td>

      {/* Existing columns */}
      <td className="px-6 py-4">
        <img
          src={props.banner.image_url}
          alt={props.banner.alt_text || 'Banner'}
          className="w-24 h-12 object-cover rounded-lg border border-[#434E54]/10"
        />
      </td>
      {/* ... rest of columns ... */}
    </tr>
  );
}

// Mobile Card with Up/Down Arrows
interface MobileBannerCardProps extends BannerRowProps {
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function MobileBannerCard({
  banner,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
  isToggling
}: MobileBannerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-4 space-y-3"
    >
      {/* Header with reorder buttons */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B7280]">Position {index + 1}</span>
        <div className="flex gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className={cn(
              "btn btn-xs btn-ghost",
              index === 0 && "opacity-30 cursor-not-allowed"
            )}
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            className={cn(
              "btn btn-xs btn-ghost",
              index === totalCount - 1 && "opacity-30 cursor-not-allowed"
            )}
            title="Move down"
          >
            ↓
          </button>
        </div>
      </div>

      {/* Rest of card content */}
      {/* ... existing card content ... */}
    </motion.div>
  );
}

// Mobile reordering handlers
const handleMobileMoveUp = async (index: number) => {
  if (index === 0) return;

  const newBanners = arrayMove(banners, index, index - 1).map((banner, i) => ({
    ...banner,
    display_order: i
  }));

  setBanners(newBanners);
  await saveReorder(newBanners);
};

const handleMobileMoveDown = async (index: number) => {
  if (index === banners.length - 1) return;

  const newBanners = arrayMove(banners, index, index + 1).map((banner, i) => ({
    ...banner,
    display_order: i
  }));

  setBanners(newBanners);
  await saveReorder(newBanners);
};

const saveReorder = async (newBanners: BannerWithStatus[]) => {
  try {
    const response = await fetch('/api/admin/banners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        banners: newBanners.map((b, index) => ({
          id: b.id,
          display_order: index
        }))
      })
    });

    if (!response.ok) {
      throw new Error('Failed to reorder banners');
    }

    onReorder(newBanners.map((b, index) => ({ id: b.id, display_order: index })));
  } catch (err) {
    console.error('Error reordering banners:', err);
    fetchBanners(); // Rollback
    alert('Failed to reorder banners. Please try again.');
  }
};
```

#### Update Table Header

Add drag handle column header:

```typescript
<thead className="bg-[#EAE0D5]/30 border-b border-[#434E54]/10">
  <tr>
    <th className="px-4 py-4 w-12"></th> {/* Drag handle column */}
    <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Preview</th>
    {/* ... rest of headers ... */}
  </tr>
</thead>
```

#### Key Implementation Notes

1. **@dnd-kit Configuration:**
   - `PointerSensor` with 8px activation distance prevents accidental drags
   - `KeyboardSensor` for accessibility (arrow keys to reorder)
   - `closestCenter` collision detection for smooth dragging
   - `verticalListSortingStrategy` for vertical list sorting

2. **Desktop Drag & Drop:**
   - Drag handle (`GripVertical` icon) in first column
   - Visual feedback: opacity change during drag
   - Cursor changes: `grab` → `grabbing`
   - Smooth animations via CSS transforms

3. **Mobile Alternative:**
   - Up/Down arrow buttons instead of drag handles
   - First item disables "Move Up", last item disables "Move Down"
   - Same API calls as drag & drop

4. **Optimistic Updates:**
   - UI updates immediately on drag end
   - API call happens in background
   - Rollback to original order on API failure

5. **Accessibility:**
   - Keyboard navigation support (Space to pick up, Arrow keys to move, Space to drop)
   - Screen reader friendly with proper ARIA attributes (handled by @dnd-kit)
   - Mobile buttons clearly labeled with title attributes

---

## Task 0175: Banner Editor Modal (Create/Edit)

### File: `src/components/admin/settings/banners/BannerEditor.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, Upload, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PromoBanner } from '@/types/database';
import { CreateBannerSchema } from '@/types/banner';
import { cn } from '@/lib/utils';
import { BannerImageUpload } from './BannerImageUpload';

interface BannerEditorProps {
  bannerId: string | null; // null = create mode, string = edit mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  image_url: string;
  alt_text: string;
  click_url: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  image_url?: string;
  alt_text?: string;
  click_url?: string;
  start_date?: string;
  end_date?: string;
}

export function BannerEditor({ bannerId, isOpen, onClose, onSuccess }: BannerEditorProps) {
  const isEditMode = bannerId !== null && bannerId !== 'new';

  const [formData, setFormData] = useState<FormData>({
    image_url: '',
    alt_text: '',
    click_url: '',
    is_active: false,
    start_date: '',
    end_date: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  // Fetch banner data in edit mode
  useEffect(() => {
    if (isOpen && isEditMode) {
      fetchBanner();
    } else if (isOpen && !isEditMode) {
      // Reset form for create mode
      setFormData({
        image_url: '',
        alt_text: '',
        click_url: '',
        is_active: false,
        start_date: '',
        end_date: ''
      });
      setErrors({});
      setHasUnsavedChanges(false);
    }
  }, [isOpen, bannerId]);

  const fetchBanner = async () => {
    if (!bannerId || bannerId === 'new') return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch banner');
      }

      const banner: PromoBanner = data.banner;
      setFormData({
        image_url: banner.image_url,
        alt_text: banner.alt_text || '',
        click_url: banner.click_url || '',
        is_active: banner.is_active,
        start_date: banner.start_date || '',
        end_date: banner.end_date || ''
      });
    } catch (err) {
      console.error('Error fetching banner:', err);
      alert('Failed to load banner. Please try again.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Image URL required
    if (!formData.image_url) {
      newErrors.image_url = 'Banner image is required';
    }

    // Alt text required
    if (!formData.alt_text.trim()) {
      newErrors.alt_text = 'Alt text is required';
    } else if (formData.alt_text.length > 200) {
      newErrors.alt_text = 'Alt text must be 200 characters or less';
    }

    // Click URL optional but must be valid if provided
    if (formData.click_url && !isValidUrl(formData.click_url)) {
      newErrors.click_url = 'Please enter a valid URL';
    }

    // Date validation
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = isEditMode
        ? `/api/admin/banners/${bannerId}`
        : '/api/admin/banners';

      const method = isEditMode ? 'PATCH' : 'POST';

      // Prepare payload
      const payload = {
        image_url: formData.image_url,
        alt_text: formData.alt_text,
        click_url: formData.click_url || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save banner');
      }

      setHasUnsavedChanges(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving banner:', err);
      alert(err instanceof Error ? err.message : 'Failed to save banner. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  const handleImageUploaded = (imageUrl: string) => {
    handleInputChange('image_url', imageUrl);
    setShowImageUpload(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#434E54]/10">
          <h2 className="text-xl font-semibold text-[#434E54]">
            {isEditMode ? 'Edit Banner' : 'Create New Banner'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#434E54] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-[#434E54] mb-2">
                  Banner Image <span className="text-red-500">*</span>
                </label>

                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-[#434E54]/10"
                    />
                    <button
                      onClick={() => setShowImageUpload(true)}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-[#434E54] hover:bg-white transition-colors shadow-md"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="w-full border-2 border-dashed border-[#434E54]/30 rounded-lg p-8 hover:border-[#434E54]/50 transition-colors"
                  >
                    <Upload className="w-12 h-12 mx-auto mb-3 text-[#434E54]/40" />
                    <p className="text-sm font-medium text-[#434E54]">Click to upload image</p>
                    <p className="text-xs text-[#6B7280] mt-1">JPEG, PNG, WebP, GIF (max 2MB)</p>
                  </button>
                )}

                {errors.image_url && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.image_url}
                  </p>
                )}
              </div>

              {/* Alt Text */}
              <div>
                <label htmlFor="alt-text" className="block text-sm font-semibold text-[#434E54] mb-2">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  id="alt-text"
                  type="text"
                  value={formData.alt_text}
                  onChange={(e) => handleInputChange('alt_text', e.target.value)}
                  className={cn(
                    "input input-bordered w-full",
                    errors.alt_text && "input-error"
                  )}
                  placeholder="Describe the banner for accessibility"
                  maxLength={200}
                />
                <div className="flex items-center justify-between mt-1">
                  <div>
                    {errors.alt_text && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.alt_text}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {formData.alt_text.length}/200
                  </p>
                </div>
              </div>

              {/* Click URL */}
              <div>
                <label htmlFor="click-url" className="block text-sm font-semibold text-[#434E54] mb-2">
                  Click URL (Optional)
                </label>
                <input
                  id="click-url"
                  type="url"
                  value={formData.click_url}
                  onChange={(e) => handleInputChange('click_url', e.target.value)}
                  className={cn(
                    "input input-bordered w-full",
                    errors.click_url && "input-error"
                  )}
                  placeholder="https://example.com/promotion"
                />
                {errors.click_url && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.click_url}
                  </p>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#EAE0D5]/30 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-[#434E54]">Banner Active</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Enable to show banner on site (respects scheduling dates)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="toggle toggle-success"
                />
              </div>

              {/* Scheduling Section - Task 0176 content will be added here */}
              {/* Preview Section */}
              <div className="bg-[#F8EEE5] rounded-lg p-4 border border-[#434E54]/10">
                <p className="text-xs font-semibold text-[#434E54] mb-2">Preview</p>
                {formData.image_url ? (
                  <div className="bg-white rounded-lg overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt={formData.alt_text || 'Banner preview'}
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-sm text-[#6B7280] italic">Upload an image to see preview</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#434E54]/10">
          <button
            onClick={handleClose}
            className="btn btn-ghost"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="btn btn-primary"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {isEditMode ? 'Update Banner' : 'Create Banner'}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Image Upload Modal */}
      <AnimatePresence>
        {showImageUpload && (
          <BannerImageUpload
            isOpen={showImageUpload}
            onClose={() => setShowImageUpload(false)}
            onSuccess={handleImageUploaded}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// URL validation helper
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

#### Key Implementation Notes

1. **DaisyUI Components Used:**
   - `input input-bordered` - Text inputs with DaisyUI styling
   - `input-error` - Error state styling
   - `toggle toggle-success` - Green toggle switch for active state
   - `btn btn-primary` / `btn btn-ghost` - Action buttons

2. **Modal Pattern:**
   - Fixed positioning with centered flex layout
   - Dark overlay (`bg-black/50`)
   - Framer Motion for enter/exit animations
   - Max width and max height constraints for responsiveness

3. **Form Validation:**
   - Real-time validation on input change
   - Comprehensive error messages with icon indicators
   - Character counter for alt text (200 char limit)
   - URL format validation for click_url
   - Date range validation (end > start)

4. **Unsaved Changes Protection:**
   - Tracks `hasUnsavedChanges` state
   - Confirmation dialog on close with unsaved changes
   - Resets on successful save

5. **Image Upload Integration:**
   - Separate `BannerImageUpload` component (modal-in-modal)
   - Preview of current image
   - "Change Image" button overlay on preview
   - Callback to update form data with uploaded URL

---

## Task 0176: Banner Scheduling with Date Pickers

### Update: `src/components/admin/settings/banners/BannerEditor.tsx`

Add this section after the "Active Toggle" section in the form:

```typescript
{/* Scheduling Section */}
<div className="space-y-4 p-4 bg-[#F8EEE5] rounded-lg border border-[#434E54]/10">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-semibold text-[#434E54]">Schedule (Optional)</h3>
    <span className="text-xs text-[#6B7280]">Pacific Time (PT)</span>
  </div>

  <p className="text-xs text-[#6B7280]">
    Leave dates empty for immediate activation (when banner is active) or indefinite duration.
  </p>

  {/* Start Date */}
  <div>
    <label htmlFor="start-date" className="block text-sm font-medium text-[#434E54] mb-2">
      Start Date & Time
    </label>
    <input
      id="start-date"
      type="datetime-local"
      value={formData.start_date}
      onChange={(e) => handleInputChange('start_date', e.target.value)}
      className={cn(
        "input input-bordered w-full",
        errors.start_date && "input-error"
      )}
    />
    {errors.start_date && (
      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {errors.start_date}
      </p>
    )}
  </div>

  {/* End Date */}
  <div>
    <label htmlFor="end-date" className="block text-sm font-medium text-[#434E54] mb-2">
      End Date & Time
    </label>
    <input
      id="end-date"
      type="datetime-local"
      value={formData.end_date}
      onChange={(e) => handleInputChange('end_date', e.target.value)}
      className={cn(
        "input input-bordered w-full",
        errors.end_date && "input-error"
      )}
    />
    {errors.end_date && (
      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {errors.end_date}
      </p>
    )}
  </div>

  {/* Scheduling Status Preview */}
  <SchedulingStatusPreview
    isActive={formData.is_active}
    startDate={formData.start_date}
    endDate={formData.end_date}
  />
</div>
```

### New Component: Scheduling Status Preview

Add this component within `BannerEditor.tsx`:

```typescript
interface SchedulingStatusPreviewProps {
  isActive: boolean;
  startDate: string;
  endDate: string;
}

function SchedulingStatusPreview({ isActive, startDate, endDate }: SchedulingStatusPreviewProps) {
  const { statusText, statusColor, statusBadge } = getSchedulingStatus(isActive, startDate, endDate);

  return (
    <div className={cn(
      "p-3 rounded-lg border",
      statusColor === 'green' && "bg-green-50 border-green-200",
      statusColor === 'blue' && "bg-blue-50 border-blue-200",
      statusColor === 'gray' && "bg-gray-50 border-gray-200",
      statusColor === 'red' && "bg-red-50 border-red-200"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#434E54]">Scheduling Status</span>
        <span className={cn(
          "badge badge-sm",
          statusColor === 'green' && "badge-success",
          statusColor === 'blue' && "badge-info",
          statusColor === 'gray' && "badge-ghost",
          statusColor === 'red' && "badge-error"
        )}>
          {statusBadge}
        </span>
      </div>
      <p className="text-xs text-[#434E54]/70">{statusText}</p>
    </div>
  );
}

function getSchedulingStatus(
  isActive: boolean,
  startDate: string,
  endDate: string
): { statusText: string; statusColor: string; statusBadge: string } {
  const now = new Date();

  // Draft: not active and no dates
  if (!isActive && !startDate && !endDate) {
    return {
      statusText: 'This banner is saved as a draft and will not be shown on the site.',
      statusColor: 'gray',
      statusBadge: 'Draft'
    };
  }

  // Check expiration
  if (endDate) {
    const end = new Date(endDate);
    if (now > end) {
      return {
        statusText: `This banner expired on ${formatDateTime(end)} and will not be shown.`,
        statusColor: 'red',
        statusBadge: 'Expired'
      };
    }
  }

  // Check scheduled
  if (startDate) {
    const start = new Date(startDate);
    if (now < start) {
      return {
        statusText: `This banner is scheduled to go live on ${formatDateTime(start)}.`,
        statusColor: 'blue',
        statusBadge: 'Scheduled'
      };
    }
  }

  // Active
  if (isActive) {
    if (startDate && endDate) {
      return {
        statusText: `This banner is active from ${formatDateTime(new Date(startDate))} to ${formatDateTime(new Date(endDate))}.`,
        statusColor: 'green',
        statusBadge: 'Active'
      };
    } else if (startDate) {
      return {
        statusText: `This banner has been active since ${formatDateTime(new Date(startDate))} with no end date.`,
        statusColor: 'green',
        statusBadge: 'Active'
      };
    } else if (endDate) {
      return {
        statusText: `This banner is active and will expire on ${formatDateTime(new Date(endDate))}.`,
        statusColor: 'green',
        statusBadge: 'Active'
      };
    } else {
      return {
        statusText: 'This banner is active with no scheduling restrictions.',
        statusColor: 'green',
        statusBadge: 'Active'
      };
    }
  }

  // Inactive
  return {
    statusText: 'This banner is inactive and will not be shown on the site.',
    statusColor: 'gray',
    statusBadge: 'Inactive'
  };
}

// Helper to format date/time in Pacific timezone
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
```

### Timezone Handling Notes

#### Important: `datetime-local` Input Type

The HTML5 `datetime-local` input returns values in the format:
```
2025-12-18T14:30
```

This is a **local time** without timezone information. Since the business operates in Pacific Time (America/Los_Angeles), you need to:

1. **When sending to API:**
   - Convert the local datetime string to Pacific timezone
   - Store in database as UTC

2. **When receiving from API:**
   - Convert UTC datetime from database to Pacific timezone
   - Display in `datetime-local` format

#### Update FormData Type

```typescript
interface FormData {
  image_url: string;
  alt_text: string;
  click_url: string;
  is_active: boolean;
  start_date: string; // Format: "YYYY-MM-DDTHH:mm" (datetime-local format)
  end_date: string;   // Format: "YYYY-MM-DDTHH:mm" (datetime-local format)
}
```

#### Timezone Conversion Helpers

Create `src/lib/utils/banner-helpers.ts`:

```typescript
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { BUSINESS_TIMEZONE } from './timezone';

/**
 * Convert datetime-local string (in Pacific Time) to ISO UTC string for API
 * Input: "2025-12-18T14:30" (Pacific Time)
 * Output: "2025-12-18T22:30:00.000Z" (UTC)
 */
export function localDateTimeToUTC(localDateTime: string): string | null {
  if (!localDateTime) return null;

  // Parse as Pacific Time
  const date = new Date(localDateTime);

  // Convert to UTC
  const utcDate = fromZonedTime(date, BUSINESS_TIMEZONE);

  return utcDate.toISOString();
}

/**
 * Convert ISO UTC string from API to datetime-local format (Pacific Time)
 * Input: "2025-12-18T22:30:00.000Z" (UTC)
 * Output: "2025-12-18T14:30" (Pacific Time, datetime-local format)
 */
export function utcToLocalDateTime(isoString: string): string {
  if (!isoString) return '';

  const date = new Date(isoString);

  // Convert to Pacific Time
  const pacificDate = toZonedTime(date, BUSINESS_TIMEZONE);

  // Format as datetime-local input value
  return format(pacificDate, "yyyy-MM-dd'T'HH:mm", { timeZone: BUSINESS_TIMEZONE });
}

/**
 * Format date for display with timezone indicator
 */
export function formatDateTimeWithTZ(isoString: string): string {
  const date = new Date(isoString);
  const pacificDate = toZonedTime(date, BUSINESS_TIMEZONE);

  return format(pacificDate, 'PPp', { timeZone: BUSINESS_TIMEZONE }) + ' PT';
}
```

#### Update BannerEditor to Use Timezone Helpers

```typescript
import { utcToLocalDateTime, localDateTimeToUTC } from '@/lib/utils/banner-helpers';

// In fetchBanner()
const banner: PromoBanner = data.banner;
setFormData({
  image_url: banner.image_url,
  alt_text: banner.alt_text || '',
  click_url: banner.click_url || '',
  is_active: banner.is_active,
  start_date: banner.start_date ? utcToLocalDateTime(banner.start_date) : '',
  end_date: banner.end_date ? utcToLocalDateTime(banner.end_date) : ''
});

// In handleSave()
const payload = {
  image_url: formData.image_url,
  alt_text: formData.alt_text,
  click_url: formData.click_url || null,
  start_date: localDateTimeToUTC(formData.start_date),
  end_date: localDateTimeToUTC(formData.end_date),
  is_active: formData.is_active
};
```

#### Key Implementation Notes for Task 0176

1. **DaisyUI Components:**
   - `input input-bordered` for datetime-local inputs
   - `badge badge-success/info/error/ghost` for status indicators
   - Color-coded status preview backgrounds

2. **Timezone Awareness:**
   - All inputs are in Pacific Time (business timezone)
   - Clear "Pacific Time (PT)" label
   - Timezone conversion helpers handle UTC ↔ Pacific conversion

3. **Date Validation:**
   - End date must be after start date
   - Validation happens on both client (immediate feedback) and server
   - Clear error messages with AlertCircle icons

4. **Scheduling Status Preview:**
   - Real-time preview of computed banner status
   - Color-coded by status (green=active, blue=scheduled, red=expired, gray=draft/inactive)
   - Helpful explanatory text for each status

5. **Optional Dates:**
   - Empty dates = immediate/indefinite
   - Status computation handles all combinations:
     - No dates: Draft or Active (indefinite)
     - Start only: Active from date, no end
     - End only: Active until date
     - Both: Active between dates

---

## Additional Components

### File: `src/components/admin/settings/banners/BannerImageUpload.tsx`

```typescript
'use client';

import { useState, useRef, DragEvent } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { validateImageFile } from '@/lib/utils/validation';

interface BannerImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (imageUrl: string) => void;
}

export function BannerImageUpload({ isOpen, onClose, onSuccess }: BannerImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setError('');

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Check max size for banners (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be 2MB or less');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/banners/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Clean up preview
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      onSuccess(data.image_url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(null);
    setPreview('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#434E54]/10">
          <h3 className="text-lg font-semibold text-[#434E54]">Upload Banner Image</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Dropzone or Preview */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-[#434E54] bg-[#F8EEE5]"
                  : "border-[#434E54]/30 hover:border-[#434E54]/50 hover:bg-gray-50"
              )}
            >
              <Upload className={cn(
                "w-12 h-12 mx-auto mb-3",
                isDragging ? "text-[#434E54]" : "text-[#434E54]/40"
              )} />
              <p className="text-sm font-medium text-[#434E54] mb-1">
                Drop image here or click to browse
              </p>
              <p className="text-xs text-[#6B7280]">
                JPEG, PNG, WebP, GIF • Max 2MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview */}
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border-2 border-[#434E54]/10"
                />
                <button
                  onClick={() => {
                    if (preview) URL.revokeObjectURL(preview);
                    setSelectedFile(null);
                    setPreview('');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* File Info */}
              <div className="text-sm text-[#6B7280]">
                <p className="font-medium text-[#434E54]">{selectedFile.name}</p>
                <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#434E54]/10">
          <button
            onClick={handleClose}
            className="btn btn-ghost"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="btn btn-primary"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
```

### File: `src/components/admin/settings/banners/BannerSkeleton.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeletons/Skeleton';

interface BannerSkeletonProps {
  count?: number;
}

export function BannerSkeleton({ count = 3 }: BannerSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Desktop: Table Skeleton */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#434E54]/10 bg-[#EAE0D5]/30">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2"><Skeleton className="h-4 w-20" /></div>
            <div className="col-span-3"><Skeleton className="h-4 w-24" /></div>
            <div className="col-span-3"><Skeleton className="h-4 w-20" /></div>
            <div className="col-span-2"><Skeleton className="h-4 w-16" /></div>
            <div className="col-span-1"><Skeleton className="h-4 w-12" /></div>
            <div className="col-span-1"><Skeleton className="h-4 w-16" /></div>
          </div>
        </div>

        <div className="divide-y divide-[#434E54]/10">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <Skeleton className="h-12 w-24 rounded-lg" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="col-span-1">
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="col-span-1 flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Card Skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-4 space-y-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### File: `src/components/admin/settings/banners/BannerEmptyState.tsx`

```typescript
import { motion } from 'framer-motion';
import { ImageOff, Plus } from 'lucide-react';

interface BannerEmptyStateProps {
  onCreate: () => void;
}

export function BannerEmptyState({ onCreate }: BannerEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-12 text-center"
    >
      <div className="w-20 h-20 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-6">
        <ImageOff className="w-10 h-10 text-[#434E54]/40" />
      </div>

      <h3 className="text-xl font-semibold text-[#434E54] mb-2">
        No Banners Yet
      </h3>

      <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
        Create your first promotional banner to highlight special offers, events, or announcements to your customers.
      </p>

      <button
        onClick={onCreate}
        className="btn btn-primary"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create First Banner
      </button>
    </motion.div>
  );
}
```

### File: `src/lib/utils/banner-helpers.ts`

(Already covered in Task 0176 section above)

---

## Update Main Page

### File: `src/app/admin/settings/banners/page.tsx`

```typescript
'use client';

/**
 * Promo Banners Settings Page
 * Tasks 0173-0176: Banner management UI
 */

import { useState } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { Plus } from 'lucide-react';
import { BannerList } from '@/components/admin/settings/banners/BannerList';
import { BannerEditor } from '@/components/admin/settings/banners/BannerEditor';

export default function BannersPage() {
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreate = () => {
    setSelectedBannerId('new');
    setIsEditorOpen(true);
  };

  const handleEdit = (bannerId: string) => {
    setSelectedBannerId(bannerId);
    setIsEditorOpen(true);
  };

  const handleDelete = () => {
    // Trigger refresh after deletion
    setRefreshTrigger(prev => prev + 1);
  };

  const handleReorder = () => {
    // Optional: Add toast notification for reorder success
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedBannerId(null);
  };

  const handleEditorSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#434E54]">Promo Banners</h1>
          <p className="mt-2 text-[#434E54]/60">
            Create and manage promotional banners for your marketing site
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Banner
        </button>
      </div>

      {/* Banner List */}
      <BannerList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        refreshTrigger={refreshTrigger}
      />

      {/* Banner Editor Modal */}
      <BannerEditor
        bannerId={selectedBannerId}
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        onSuccess={handleEditorSuccess}
      />
    </div>
  );
}
```

**Important Note:** This is a client component because it manages local state. However, you should still keep the admin authentication check. Consider creating a separate server component wrapper or using middleware for auth.

Alternative server-safe pattern:

```typescript
// src/app/admin/settings/banners/page.tsx (Server Component)
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { BannersClient } from './BannersClient';

export default async function BannersPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return <BannersClient />;
}

// src/app/admin/settings/banners/BannersClient.tsx ('use client')
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { BannerList } from '@/components/admin/settings/banners/BannerList';
import { BannerEditor } from '@/components/admin/settings/banners/BannerEditor';

export function BannersClient() {
  // ... all the state and handlers ...

  return (
    <div className="space-y-6">
      {/* ... JSX ... */}
    </div>
  );
}
```

---

## API Integration Points

### Expected API Endpoints (Tasks 0169-0172)

1. **GET /api/admin/banners**
   - Fetch all banners
   - Response: `{ banners: PromoBanner[] }`

2. **GET /api/admin/banners/[id]**
   - Fetch single banner
   - Response: `{ banner: PromoBanner }`

3. **POST /api/admin/banners**
   - Create new banner
   - Body: `CreateBannerRequest`
   - Response: `{ banner: PromoBanner }`

4. **PATCH /api/admin/banners/[id]**
   - Update banner
   - Body: `UpdateBannerRequest`
   - Response: `{ banner: PromoBanner }`

5. **DELETE /api/admin/banners/[id]**
   - Delete banner
   - Response: `{ success: true }`

6. **POST /api/admin/banners/reorder**
   - Reorder banners
   - Body: `ReorderBannersRequest`
   - Response: `{ success: true }`

7. **POST /api/admin/banners/upload**
   - Upload banner image
   - Body: FormData with 'file' field
   - Response: `{ image_url: string }`

---

## Testing Checklist

### Functional Testing

#### Task 0173: Banner List
- [ ] Banners load correctly on page load
- [ ] Loading skeleton displays during fetch
- [ ] Error state displays with retry button on fetch failure
- [ ] Empty state displays when no banners exist
- [ ] Status badges show correct colors and labels:
  - [ ] Draft (gray) - not active, no dates
  - [ ] Scheduled (blue) - future start_date
  - [ ] Active (green) - is_active and within dates
  - [ ] Expired (red) - past end_date
- [ ] Click count displays correctly
- [ ] Toggle active/inactive works with optimistic UI
- [ ] Edit button opens editor modal
- [ ] Delete button shows confirmation and removes banner
- [ ] Desktop table view displays correctly
- [ ] Mobile card view displays correctly

#### Task 0174: Drag & Drop
- [ ] Drag handles visible in desktop table
- [ ] Drag gesture starts only after 8px movement
- [ ] Visual feedback during drag (opacity, cursor)
- [ ] Banner reorders correctly on drop
- [ ] API call updates display_order
- [ ] Rollback works on API failure
- [ ] Keyboard navigation works (Space, Arrow keys)
- [ ] Mobile up/down arrows work correctly
- [ ] First item disables "Move Up"
- [ ] Last item disables "Move Down"

#### Task 0175: Banner Editor
- [ ] Modal opens in create mode (bannerId = 'new')
- [ ] Modal opens in edit mode with pre-filled data
- [ ] Image upload modal opens on "Upload" click
- [ ] Image preview displays after upload
- [ ] Alt text input validates (required, max 200 chars)
- [ ] Character counter updates correctly
- [ ] Click URL validates (optional, must be valid URL)
- [ ] Active toggle works correctly
- [ ] Form validation shows inline errors
- [ ] Unsaved changes warning works
- [ ] Save button creates/updates banner
- [ ] Success closes modal and refreshes list
- [ ] Preview section shows banner correctly

#### Task 0176: Scheduling
- [ ] datetime-local inputs display correctly
- [ ] Start date/time saves correctly
- [ ] End date/time saves correctly
- [ ] End date validation (must be after start)
- [ ] Empty dates allowed (immediate/indefinite)
- [ ] Timezone label shows "Pacific Time (PT)"
- [ ] Scheduling status preview updates in real-time
- [ ] Status preview shows correct badge color
- [ ] UTC ↔ Pacific conversion works correctly
- [ ] Scheduled banner shows blue badge
- [ ] Expired banner shows red badge

### Responsive Design Testing
- [ ] Desktop (≥1024px): Table layout displays correctly
- [ ] Tablet (768px-1023px): Table layout displays correctly
- [ ] Mobile (<768px): Card layout displays correctly
- [ ] Modal fits on all screen sizes
- [ ] Form inputs are touch-friendly on mobile
- [ ] Drag handles work on touch devices (or hidden)
- [ ] Up/down arrows work on mobile

### Accessibility Testing
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible and logical order
- [ ] Screen reader labels on icon-only buttons
- [ ] Form errors announced to screen readers
- [ ] Modal traps focus correctly
- [ ] Escape key closes modals
- [ ] ARIA attributes correct for status badges
- [ ] Color contrast meets WCAG AA standards

### Performance Testing
- [ ] Image uploads compress large files
- [ ] Optimistic UI updates feel instant
- [ ] No unnecessary re-renders
- [ ] Smooth animations (60fps)
- [ ] Large banner lists scroll smoothly

### Edge Cases
- [ ] Very long alt text truncates correctly
- [ ] Very long URLs truncate/wrap correctly
- [ ] Banner with no image URL shows placeholder
- [ ] Banner with no click URL shows "No URL"
- [ ] Invalid image files rejected with error
- [ ] Oversized files rejected (>2MB)
- [ ] Network errors handled gracefully
- [ ] Concurrent edits handled (last write wins)

---

## Important Notes for Implementation

### DaisyUI Theme Configuration

Ensure `tailwind.config.js` has DaisyUI properly configured:

```javascript
module.exports = {
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        puppyday: {
          'primary': '#434E54',
          'primary-focus': '#363F44',
          'secondary': '#EAE0D5',
          'accent': '#6BCB77',
          'neutral': '#6B7280',
          'base-100': '#FFFFFF',
          'info': '#74B9FF',
          'success': '#6BCB77',
          'warning': '#FFB347',
          'error': '#EF4444',
        },
      },
    ],
  },
};
```

### State Management Strategy

This implementation uses **local component state** with prop drilling for simplicity. For a larger application, consider:

- **Zustand store** for global banner state
- **React Query** for server state management with automatic cache invalidation
- **SWR** for data fetching with revalidation

### API Error Handling

The current implementation uses `alert()` for errors. Consider implementing:

- Toast notification system (react-hot-toast, sonner)
- Consistent error UI component
- Error boundary for graceful fallbacks

### Image Optimization

For production, consider:

- Next.js Image component for automatic optimization
- Image compression on upload (browser-image-compression library already installed)
- Responsive image srcsets for different screen sizes
- WebP format conversion

### Security Considerations

1. **Server-side validation:** Always validate on API endpoints, not just client
2. **File upload security:** Check file types, sizes, and scan for malware
3. **URL validation:** Sanitize click URLs to prevent XSS
4. **CSRF protection:** Ensure API routes have CSRF tokens
5. **Rate limiting:** Prevent abuse of upload endpoints

### Timezone Edge Cases

1. **Daylight Saving Time:** Pacific Time switches between PST and PDT
   - `date-fns-tz` handles this automatically
   - Always store UTC in database
   - Convert to Pacific only for display

2. **Date boundaries:** Be careful with date-only comparisons
   - Use start of day (00:00) for date-only scheduling
   - Account for timezone when comparing "today"

3. **Server vs Client timezone:**
   - Server may be in different timezone (e.g., Vercel servers are UTC)
   - Always use `BUSINESS_TIMEZONE` constant for conversions

### Performance Optimizations

1. **Debounce reorder API calls:** If dragging multiple times, wait before saving
2. **Memoize banner status computation:** Use `useMemo` for expensive calculations
3. **Virtual scrolling:** If banner list grows large (>100 items), use react-window
4. **Image lazy loading:** Use Next.js Image with priority for above-fold images

---

## Summary

This implementation plan provides:

✅ **Complete component architecture** for Tasks 0173-0176
✅ **DaisyUI-first approach** with semantic class names and modifiers
✅ **Clean & Elegant Professional design** with project color palette
✅ **Responsive layouts** (table for desktop, cards for mobile)
✅ **Full CRUD operations** with optimistic UI updates
✅ **Drag & drop reordering** with keyboard accessibility
✅ **Comprehensive scheduling** with Pacific timezone support
✅ **Robust error handling** with inline validation and user feedback
✅ **Accessibility** with semantic HTML and ARIA attributes
✅ **Smooth animations** using Framer Motion

The implementation follows existing patterns from the project (GalleryUploadModal, CustomerTable, etc.) and integrates seamlessly with the current tech stack.
