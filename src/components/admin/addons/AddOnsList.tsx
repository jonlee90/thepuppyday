'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Loader2, Plus, Tag } from 'lucide-react';
import { AddOnForm } from './AddOnForm';
import type { Addon } from '@/types/database';

interface SortableAddonRowProps {
  addon: Addon;
  onEdit: (addon: Addon) => void;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

function SortableAddonRow({
  addon,
  onEdit,
  onToggleActive,
}: SortableAddonRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: addon.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const handleToggleActive = async () => {
    setIsTogglingActive(true);
    await onToggleActive(addon.id, !addon.is_active);
    setIsTogglingActive(false);
  };

  const hasBreedUpsell = addon.upsell_breeds && addon.upsell_breeds.length > 0;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors
        ${!addon.is_active ? 'opacity-50' : ''}
      `}
    >
      {/* Drag Handle */}
      <td className="px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
        >
          <GripVertical className="w-5 h-5 text-[#6B7280]" />
        </button>
      </td>

      {/* Name & Description */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <p className="font-semibold text-[#434E54]">{addon.name}</p>
          {addon.description && (
            <p className="text-sm text-[#6B7280] line-clamp-2">
              {addon.description}
            </p>
          )}
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <span className="font-semibold text-[#434E54]">
          ${addon.price.toFixed(2)}
        </span>
      </td>

      {/* Breed Upsell Indicator */}
      <td className="px-4 py-3">
        {hasBreedUpsell ? (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
              bg-[#EAE0D5] text-sm"
            title={`Recommended for: ${addon.upsell_breeds.join(', ')}`}
          >
            <Tag className="w-4 h-4 text-[#434E54]" />
            <span className="text-[#434E54] font-medium">
              {addon.upsell_breeds.length} {addon.upsell_breeds.length === 1 ? 'breed' : 'breeds'}
            </span>
          </div>
        ) : (
          <span className="text-sm text-[#9CA3AF]">None</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={addon.is_active}
            onChange={handleToggleActive}
            disabled={isTogglingActive}
            className="sr-only peer"
          />
          <div
            className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2
              peer-focus:ring-[#434E54]/20 rounded-full peer peer-checked:after:translate-x-full
              peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px]
              after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full
              after:h-5 after:w-5 after:transition-all peer-checked:bg-[#434E54]"
          />
        </label>
        {!addon.is_active && (
          <span className="ml-2 text-xs text-[#6B7280]">Inactive</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button
          onClick={() => onEdit(addon)}
          className="p-2 hover:bg-[#EAE0D5] rounded-lg transition-colors"
          title="Edit add-on"
        >
          <Edit className="w-4 h-4 text-[#434E54]" />
        </button>
      </td>
    </tr>
  );
}

export function AddOnsList() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/addons');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch add-ons');
      }

      setAddons(data.addons || []);
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      alert('Failed to load add-ons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = addons.findIndex((a) => a.id === active.id);
    const newIndex = addons.findIndex((a) => a.id === over.id);

    const reorderedAddons = arrayMove(addons, oldIndex, newIndex);

    // Update local state immediately for smooth UX
    setAddons(reorderedAddons);

    // Update display_order on server
    try {
      await Promise.all(
        reorderedAddons.map((addon, index) =>
          fetch(`/api/admin/addons/${addon.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_order: index + 1 }),
          })
        )
      );
    } catch (error) {
      console.error('Error updating display order:', error);
      // Revert on error
      fetchAddons();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/addons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update add-on status');
      }

      // Update local state
      setAddons((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: isActive } : a))
      );
    } catch (error) {
      console.error('Error toggling add-on status:', error);
      alert('Failed to update add-on status');
    }
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddon(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAddon(null);
  };

  const handleFormSuccess = () => {
    fetchAddons();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#434E54]" />
      </div>
    );
  }

  if (addons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">
            No Add-Ons Yet
          </h3>
          <p className="text-[#6B7280] mb-6">
            Add your first add-on to get started
          </p>
          <button
            onClick={handleAddNew}
            className="bg-[#434E54] text-white font-medium py-2.5 px-6 rounded-lg
              hover:bg-[#363F44] transition-colors duration-200 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Add-On
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#EAE0D5] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase w-12">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase">
                    Add-On
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase w-32">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase w-40">
                    Breed Upsell
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase w-32">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={addons.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {addons.map((addon) => (
                    <SortableAddonRow
                      key={addon.id}
                      addon={addon}
                      onEdit={handleEdit}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <AddOnForm
          addon={editingAddon || undefined}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
