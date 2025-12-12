'use client';

/**
 * GalleryImageEditModal Component
 * Edit modal for gallery image metadata
 */

import { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import type { GalleryImage, Breed } from '@/types/database';

interface GalleryImageEditModalProps {
  imageId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
}

interface GalleryImageWithBreed extends GalleryImage {
  breed_name?: string | null;
}

export function GalleryImageEditModal({
  imageId,
  isOpen,
  onClose,
  onSuccess,
  onDelete,
}: GalleryImageEditModalProps) {
  const [image, setImage] = useState<GalleryImageWithBreed | null>(null);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form state
  const [petName, setPetName] = useState('');
  const [breedId, setBreedId] = useState('');
  const [caption, setCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (isOpen && imageId) {
      fetchImage();
      fetchBreeds();
    }
  }, [isOpen, imageId]);

  const fetchImage = async () => {
    if (!imageId) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/gallery/${imageId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch image');
      }

      const img = data.image as GalleryImageWithBreed;
      setImage(img);
      setPetName(img.dog_name || '');
      setBreedId(img.breed || '');
      setCaption(img.caption || '');
      setTagsInput(img.tags ? img.tags.join(', ') : '');
      setIsPublished(img.is_published);
    } catch (err) {
      console.error('Error fetching image:', err);
      setError(err instanceof Error ? err.message : 'Failed to load image');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBreeds = async () => {
    try {
      const response = await fetch('/api/admin/breeds');
      const data = await response.json();

      if (response.ok && data.breeds) {
        setBreeds(data.breeds);
      }
    } catch (err) {
      console.error('Error fetching breeds:', err);
    }
  };

  const handleSave = async () => {
    if (!imageId) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Parse tags from comma-separated input
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await fetch(`/api/admin/gallery/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dog_name: petName || null,
          breed_id: breedId || null,
          caption: caption || null,
          tags,
          is_published: isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update image');
      }

      setSuccessMessage('Image updated successfully!');

      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving image:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!imageId) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/gallery/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete image');
      }

      onDelete();
      onClose();
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setImage(null);
    setError('');
    setSuccessMessage('');
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  const captionLength = caption.length;
  const captionLimit = 200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#434E54]">Edit Gallery Photo</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving || isDeleting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="loading loading-spinner loading-lg text-[#434E54]"></div>
                <p className="mt-4 text-gray-500">Loading image...</p>
              </div>
            </div>
          ) : image ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Image Preview */}
              <div>
                <img
                  src={image.image_url}
                  alt={image.dog_name || 'Gallery image'}
                  className="w-full rounded-lg shadow-md"
                />
                {!image.is_published && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                    Unpublished
                  </div>
                )}
              </div>

              {/* Right: Edit Form */}
              <div className="space-y-4">
                {/* Pet Name */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Pet Name
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             placeholder:text-gray-400 transition-colors"
                  />
                </div>

                {/* Breed */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Breed
                  </label>
                  <select
                    value={breedId}
                    onChange={(e) => setBreedId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             transition-colors"
                  >
                    <option value="">Select breed (optional)</option>
                    {breeds.map((breed) => (
                      <option key={breed.id} value={breed.id}>
                        {breed.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Caption
                    <span className="ml-2 text-xs text-gray-500">
                      {captionLength}/{captionLimit}
                    </span>
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, captionLimit))}
                    placeholder="Add a caption for this photo..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             placeholder:text-gray-400 transition-colors resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Tags
                    <span className="ml-2 text-xs text-gray-500">
                      Comma-separated
                    </span>
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g., grooming, before-after, goldendoodle"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             placeholder:text-gray-400 transition-colors"
                  />
                </div>

                {/* Published Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="published"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#434E54]
                             focus:ring-2 focus:ring-[#434E54]/20"
                  />
                  <label htmlFor="published" className="text-sm font-medium text-[#434E54]">
                    Published (visible on public gallery)
                  </label>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          {/* Delete Button */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              disabled={isSaving || isDeleting}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-600 font-medium">Are you sure?</p>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Save/Close Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-[#434E54] font-medium rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isSaving || isDeleting}
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="
                px-6 py-2 bg-[#434E54] text-white font-medium rounded-lg
                hover:bg-[#363F44] transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
