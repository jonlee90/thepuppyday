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
import {
  GripVertical,
  Edit,
  Loader2,
  Plus,
  ImageIcon,
} from 'lucide-react';
import { ServiceForm } from './ServiceForm';
import type { Service, ServicePrice, PetSize } from '@/types/database';

interface ServiceWithPrices extends Service {
  prices: ServicePrice[];
}

const SIZE_LABELS: Record<PetSize, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
  xlarge: 'XL',
};

interface SortableServiceRowProps {
  service: ServiceWithPrices;
  onEdit: (service: ServiceWithPrices) => void;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

function SortableServiceRow({
  service,
  onEdit,
  onToggleActive,
}: SortableServiceRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const handleToggleActive = async () => {
    setIsTogglingActive(true);
    await onToggleActive(service.id, !service.is_active);
    setIsTogglingActive(false);
  };

  // Sort prices by size order
  const sortedPrices = [...service.prices].sort((a, b) => {
    const order: PetSize[] = ['small', 'medium', 'large', 'xlarge'];
    return order.indexOf(a.size) - order.indexOf(b.size);
  });

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors
        ${!service.is_active ? 'opacity-50' : ''}
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

      {/* Image */}
      <td className="px-4 py-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {service.image_url ? (
            <img
              src={service.image_url}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </td>

      {/* Name & Description */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <p className="font-semibold text-[#434E54]">{service.name}</p>
          {service.description && (
            <p className="text-sm text-[#6B7280] line-clamp-2">
              {service.description.length > 100
                ? `${service.description.substring(0, 100)}...`
                : service.description}
            </p>
          )}
        </div>
      </td>

      {/* Duration */}
      <td className="px-4 py-3 text-sm text-[#6B7280]">
        {service.duration_minutes} min
      </td>

      {/* Prices Grid */}
      <td className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {sortedPrices.map((price) => (
            <div
              key={price.id}
              className="text-sm bg-[#EAE0D5] px-2 py-1 rounded text-center"
            >
              <span className="font-semibold text-[#434E54]">
                {SIZE_LABELS[price.size]}:
              </span>{' '}
              <span className="text-[#6B7280]">${price.price}</span>
            </div>
          ))}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={service.is_active}
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
        {!service.is_active && (
          <span className="ml-2 text-xs text-[#6B7280]">Inactive</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button
          onClick={() => onEdit(service)}
          className="p-2 hover:bg-[#EAE0D5] rounded-lg transition-colors"
          title="Edit service"
        >
          <Edit className="w-4 h-4 text-[#434E54]" />
        </button>
      </td>
    </tr>
  );
}

export function ServicesList() {
  const [services, setServices] = useState<ServiceWithPrices[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<ServiceWithPrices | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/services');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch services');
      }

      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);

    const reorderedServices = arrayMove(services, oldIndex, newIndex);

    // Update local state immediately for smooth UX
    setServices(reorderedServices);

    // Update display_order on server
    try {
      await Promise.all(
        reorderedServices.map((service, index) =>
          fetch(`/api/admin/services/${service.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_order: index + 1 }),
          })
        )
      );
    } catch (error) {
      console.error('Error updating display order:', error);
      // Revert on error
      fetchServices();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service status');
      }

      // Update local state
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s))
      );
    } catch (error) {
      console.error('Error toggling service status:', error);
      alert('Failed to update service status');
    }
  };

  const handleEdit = (service: ServiceWithPrices) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  const handleFormSuccess = () => {
    fetchServices();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#434E54]" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">
            No Services Yet
          </h3>
          <p className="text-[#6B7280] mb-6">
            Add your first service to get started
          </p>
          <button
            onClick={handleAddNew}
            className="bg-[#434E54] text-white font-medium py-2.5 px-6 rounded-lg
              hover:bg-[#363F44] transition-colors duration-200 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Service
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase w-20">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase w-24">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#434E54] uppercase w-48">
                    Pricing
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
                  items={services.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {services.map((service) => (
                    <SortableServiceRow
                      key={service.id}
                      service={service}
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
        <ServiceForm
          service={editingService || undefined}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
