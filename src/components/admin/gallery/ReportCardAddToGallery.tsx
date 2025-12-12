'use client';

/**
 * ReportCardAddToGallery Component
 * Button to add report card images to the public gallery
 */

import { useState } from 'react';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import type { Appointment } from '@/types/database';

interface ReportCardAddToGalleryProps {
  imageUrl: string;
  appointment: Appointment;
  isBeforeAfter?: boolean;
  onSuccess?: () => void;
}

export function ReportCardAddToGallery({
  imageUrl,
  appointment,
  isBeforeAfter = false,
  onSuccess,
}: ReportCardAddToGalleryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAddToGallery = async () => {
    setIsAdding(true);
    setError('');
    setSuccess(false);

    try {
      // Prepare tags
      const tags = ['report-card'];
      if (isBeforeAfter) {
        tags.push('before-after');
      }

      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          dog_name: appointment.pet?.name || null,
          breed_id: appointment.pet?.breed_id || null,
          caption: null,
          tags,
          category: isBeforeAfter ? 'before_after' : 'regular',
          is_before_after: isBeforeAfter,
          before_image_url: null,
          is_published: false, // Default to unpublished
          // Note: source_type and source_id fields might not exist yet in schema
          // source_type: 'report_card',
          // source_id: appointment.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to gallery');
      }

      setSuccess(true);

      // Auto-hide success message after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error adding to gallery:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to gallery');
    } finally {
      setIsAdding(false);
    }
  };

  if (success) {
    return (
      <button
        disabled
        className="
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-green-50 text-green-700 text-sm font-medium
          cursor-default
        "
      >
        <CheckCircle className="w-4 h-4" />
        Added to Gallery
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleAddToGallery}
        disabled={isAdding}
        className="
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-[#434E54] text-white text-sm font-medium
          hover:bg-[#363F44] transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Plus className="w-4 h-4" />
        {isAdding ? 'Adding...' : 'Add to Gallery'}
      </button>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
