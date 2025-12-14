'use client';

/**
 * PhotoUpload Component
 * Single photo upload with drag-drop, preview, and compression
 * Tablet-optimized with large touch targets
 */

import { useState, useRef, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage, createPreviewUrl, revokePreviewUrl, validateImageForReportCard } from '@/lib/utils/image-compression';

interface PhotoUploadProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  className?: string;
}

export function PhotoUpload({
  label,
  required = false,
  value,
  onChange,
  onUpload,
  className = '',
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setError('');

    // Validate file
    const validation = validateImageForReportCard(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);

    try {
      // Compress image
      const compressedFile = await compressImage(file);

      // Create local preview
      const preview = createPreviewUrl(compressedFile);
      setPreviewUrl(preview);

      // Upload to storage
      const uploadedUrl = await onUpload(compressedFile);

      // Update form state
      onChange(uploadedUrl);

      // Clean up preview URL (optional, as we'll use the uploaded URL)
      // We keep it for immediate visual feedback
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      // Revert preview on error
      setPreviewUrl(value);
    } finally {
      setIsUploading(false);
    }
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
    handleFileSelect(file);
  };

  const handleRemove = () => {
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
    }
    setPreviewUrl('');
    onChange('');
    setError('');
  };

  return (
    <div className={className}>
      {/* Label */}
      <label className="block text-sm font-semibold text-[#434E54] mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Upload Area or Preview */}
      {!previewUrl ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            min-h-[200px] flex flex-col items-center justify-center
            ${
              isDragging
                ? 'border-[#434E54] bg-[#F8EEE5]'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
            ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-12 h-12 text-[#434E54] mb-3 animate-spin" />
              <p className="text-[#434E54] font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <Upload
                className={`w-12 h-12 mb-3 ${
                  isDragging ? 'text-[#434E54]' : 'text-gray-400'
                }`}
              />
              <p className="text-[#434E54] font-medium mb-1">
                Drop photo here or tap to browse
              </p>
              <p className="text-sm text-gray-500">
                JPEG, PNG, WebP up to 10MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      ) : (
        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-64 object-cover"
          />
          {/* Remove button - Large touch target */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            disabled={isUploading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
