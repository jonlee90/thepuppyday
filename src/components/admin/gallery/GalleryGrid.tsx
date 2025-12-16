'use client';

/**
 * GalleryGrid Component
 * Displays gallery images in a responsive grid with drag-drop reordering
 */

import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GalleryImage } from '@/types/database';
import { GalleryUploadModal } from './GalleryUploadModal';
import { GalleryImageEditModal } from './GalleryImageEditModal';

interface GalleryImageWithBreed extends GalleryImage {
  breed_name?: string | null;
}

type FilterType = 'all' | 'published' | 'unpublished';

interface SortableImageCardProps {
  image: GalleryImageWithBreed;
  onClick: () => void;
}

function SortableImageCard({ image, onClick }: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Truncate caption to ~50 chars
  const truncatedCaption = image.caption
    ? image.caption.length > 50
      ? `${image.caption.substring(0, 50)}...`
      : image.caption
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={image.image_url}
          alt={image.dog_name || 'Gallery image'}
          loading="lazy"
          className="w-full h-full object-cover"
        />

        {/* Status Badge */}
        {!image.is_published && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-yellow-500 text-white text-xs font-semibold">
            Unpublished
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {image.dog_name && (
          <h3 className="font-semibold text-[#434E54] mb-1">{image.dog_name}</h3>
        )}

        {image.breed_name && (
          <p className="text-sm text-gray-500 mb-2">{image.breed_name}</p>
        )}

        {truncatedCaption && (
          <p className="text-sm text-gray-600 line-clamp-2">{truncatedCaption}</p>
        )}

        {!image.dog_name && !image.breed_name && !truncatedCaption && (
          <p className="text-sm text-gray-400 italic">No details added</p>
        )}
      </div>
    </div>
  );
}

interface GalleryGridProps {
  initialImages?: GalleryImageWithBreed[];
}

export function GalleryGrid({ initialImages = [] }: GalleryGridProps) {
  const [images, setImages] = useState<GalleryImageWithBreed[]>(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editImageId, setEditImageId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch images whenever filter changes
  useEffect(() => {
    fetchImages();
  }, [filter]);

  const fetchImages = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/gallery?filter=${filter}`);
      const data = await response.json();

      if (response.ok && data.images) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const reorderedImages = arrayMove(images, oldIndex, newIndex);

    // Update display_order for each image
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      display_order: index + 1,
    }));

    setImages(updatedImages);

    // Send update to server - update ALL images to maintain sequential ordering
    try {
      // Update all images in batch to prevent display_order conflicts
      const updatePromises = updatedImages.map((image) =>
        fetch(`/api/admin/gallery/${image.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_order: image.display_order,
          }),
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating display order:', error);
      // Revert on error
      fetchImages();
    }
  };

  const handleImageClick = (imageId: string) => {
    setEditImageId(imageId);
  };

  const handleUploadSuccess = () => {
    fetchImages();
  };

  const handleEditSuccess = () => {
    fetchImages();
  };

  const handleDeleteSuccess = () => {
    fetchImages();
  };

  return (
    <div>
      {/* Header with Filter Tabs and Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                filter === 'all'
                  ? 'bg-[#434E54] text-white'
                  : 'bg-white text-[#434E54] border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            All
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                filter === 'published'
                  ? 'bg-[#434E54] text-white'
                  : 'bg-white text-[#434E54] border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            Published
          </button>
          <button
            onClick={() => setFilter('unpublished')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                filter === 'unpublished'
                  ? 'bg-[#434E54] text-white'
                  : 'bg-white text-[#434E54] border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            Unpublished
          </button>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="
            px-5 py-2.5 bg-[#434E54] text-white font-medium rounded-lg
            hover:bg-[#363F44] transition-colors flex items-center gap-2
          "
        >
          <Plus className="w-5 h-5" />
          Add Photos
        </button>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-[#434E54]"></div>
            <p className="mt-4 text-gray-500">Loading gallery...</p>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#EAE0D5] rounded-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-[#434E54]" />
          </div>
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">
            {filter === 'all'
              ? 'No photos in gallery yet'
              : filter === 'published'
              ? 'No published photos'
              : 'No unpublished photos'}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all'
              ? 'Upload your first photo to get started'
              : 'Try switching to a different filter'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="
                px-6 py-2.5 bg-[#434E54] text-white font-medium rounded-lg
                hover:bg-[#363F44] transition-colors inline-flex items-center gap-2
              "
            >
              <Plus className="w-5 h-5" />
              Upload Your First Photo
            </button>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  onClick={() => handleImageClick(image.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload Modal */}
      <GalleryUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Edit Modal */}
      <GalleryImageEditModal
        imageId={editImageId}
        isOpen={editImageId !== null}
        onClose={() => setEditImageId(null)}
        onSuccess={handleEditSuccess}
        onDelete={handleDeleteSuccess}
      />
    </div>
  );
}
