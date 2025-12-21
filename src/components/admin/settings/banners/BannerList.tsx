/**
 * Banner list component with table/card views and drag-drop reordering
 * Tasks 0173-0174: Banner list and drag-drop
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import type { BannerWithStatus } from '@/types/banner';
import { computeBannerStatus } from '@/types/banner';
import { cn } from '@/lib/utils';
import { BannerSkeleton } from './BannerSkeleton';
import { BannerEmptyState } from './BannerEmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
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

interface BannerListProps {
  onEdit: (bannerId: string) => void;
  onDelete: (bannerId: string) => void;
  onReorder: (banners: Array<{ id: string; display_order: number }>) => void;
  refreshTrigger?: number;
}

export function BannerList({ onEdit, onDelete, onReorder, refreshTrigger }: BannerListProps) {
  const [banners, setBanners] = useState<BannerWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  // Fetch banners on mount and when refreshTrigger changes
  useEffect(() => {
    fetchBanners();
  }, [refreshTrigger]);

  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/banners');
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
      const response = await fetch(`/api/admin/settings/banners/${bannerId}`, {
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
      const response = await fetch(`/api/admin/settings/banners/${bannerId}`, {
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
    await saveReorder(newBanners);
  };

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
      const response = await fetch('/api/admin/settings/banners/reorder', {
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
              <thead className="bg-[#EAE0D5]/30 border-b border-[#434E54]/10">
                <tr>
                  <th className="px-4 py-4 w-12"></th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Preview</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Alt Text</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Click URL</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#434E54]">Clicks</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#434E54]">Actions</th>
                </tr>
              </thead>
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

          {/* Mobile: Card View */}
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

// Desktop Table Row Component
interface BannerRowProps {
  banner: BannerWithStatus;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  isDeleting: boolean;
  isToggling: boolean;
}

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

      {/* Thumbnail Preview */}
      <td className="px-6 py-4">
        <img
          src={props.banner.image_url}
          alt={props.banner.alt_text || 'Banner'}
          className="w-24 h-12 object-cover rounded-lg border border-[#434E54]/10"
        />
      </td>

      {/* Alt Text */}
      <td className="px-6 py-4">
        <p className="text-sm text-[#434E54] line-clamp-2 max-w-xs">
          {props.banner.alt_text || <span className="text-[#6B7280] italic">No alt text</span>}
        </p>
      </td>

      {/* Click URL */}
      <td className="px-6 py-4">
        {props.banner.click_url ? (
          <a
            href={props.banner.click_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline line-clamp-1 max-w-xs block"
          >
            {props.banner.click_url}
          </a>
        ) : (
          <span className="text-sm text-[#6B7280] italic">No URL</span>
        )}
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4">
        <BannerStatusBadge status={props.banner.status} />
      </td>

      {/* Click Count */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-[#434E54]">
          {props.banner.click_count.toLocaleString()}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {/* Toggle Active */}
          <button
            onClick={props.onToggleActive}
            disabled={props.isToggling}
            className={cn(
              "p-2 rounded-lg transition-colors",
              props.banner.is_active
                ? "text-green-600 hover:bg-green-50"
                : "text-gray-400 hover:bg-gray-50",
              props.isToggling && "opacity-50 cursor-not-allowed"
            )}
            title={props.banner.is_active ? "Active - Click to deactivate" : "Inactive - Click to activate"}
          >
            {props.banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Edit */}
          <button
            onClick={props.onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit banner"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={props.onDelete}
            disabled={props.isDeleting}
            className={cn(
              "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
              props.isDeleting && "opacity-50 cursor-not-allowed"
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
            <ChevronUp className="w-4 h-4" />
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
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

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
            "flex-1 btn btn-sm border-none",
            banner.is_active
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-[#434E54]",
            isToggling && "opacity-50 cursor-not-allowed"
          )}
        >
          {banner.is_active ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
          {banner.is_active ? 'Active' : 'Inactive'}
        </button>
        <button
          onClick={onEdit}
          className="btn btn-sm bg-[#434E54] hover:bg-[#363F44] text-white border-none"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className={cn(
            "btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none",
            isDeleting && "opacity-50 cursor-not-allowed"
          )}
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
