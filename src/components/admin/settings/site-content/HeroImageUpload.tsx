/**
 * HeroImageUpload Component
 * Task 0161: Upload hero background image with drag-drop support
 *
 * Features:
 * - Drag-and-drop file upload
 * - Client-side validation (type, size, dimensions)
 * - Upload progress indicator
 * - Preview thumbnail
 * - Clean & Elegant Professional design
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, X, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';

interface HeroImageUploadProps {
  currentImageUrl: string | null;
  onUploadComplete: (imageUrl: string) => void;
  disabled?: boolean;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

/**
 * Validate image file
 */
async function validateImage(file: File): Promise<{
  valid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
}> {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    };
  }

  // Check file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File size exceeds 5MB.',
    };
  }

  // Check dimensions
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < 1920 || dimensions.height < 800) {
      return {
        valid: false,
        error: `Image dimensions (${dimensions.width}x${dimensions.height}) are too small. Minimum: 1920x800px.`,
      };
    }

    return { valid: true, dimensions };
  } catch {
    return {
      valid: false,
      error: 'Failed to load image. Please try another file.',
    };
  }
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Clean up
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl); // Clean up
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Upload image to server
 */
async function uploadImage(file: File, onProgress: (percent: number) => void): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        resolve(result.url);
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', '/api/admin/settings/site-content/upload');
    xhr.send(formData);
  });
}

export function HeroImageUpload({
  currentImageUrl,
  onUploadComplete,
  disabled = false,
}: HeroImageUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      // Reset state
      setError(null);
      setState('idle');
      setProgress(0);

      // Validate file
      const validation = await validateImage(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setState('error');
        return;
      }

      // Upload file
      setState('uploading');
      try {
        const url = await uploadImage(file, setProgress);
        setState('success');
        onUploadComplete(url);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [disabled, onUploadComplete]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];
      await handleFile(file);
    },
    [disabled, handleFile]
  );

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      await handleFile(file);

      // Reset input
      e.target.value = '';
    },
    [handleFile]
  );

  /**
   * Open file picker
   */
  const handleClickUpload = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  /**
   * Remove uploaded image
   */
  const handleRemove = useCallback(() => {
    if (disabled) return;
    onUploadComplete('');
    setState('idle');
    setProgress(0);
    setError(null);
  }, [disabled, onUploadComplete]);

  /**
   * Retry upload
   */
  const handleRetry = useCallback(() => {
    setState('idle');
    setError(null);
    setProgress(0);
  }, []);

  /**
   * Copy URL to clipboard
   */
  const handleCopyUrl = useCallback(async () => {
    if (!currentImageUrl) return;

    try {
      await navigator.clipboard.writeText(currentImageUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Silently fail
    }
  }, [currentImageUrl]);

  const hasImage = Boolean(currentImageUrl);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Hero Background Image
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Upload a high-quality background image for the hero section
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Zone or Preview */}
      {!hasImage && state !== 'uploading' ? (
        /* Upload Zone */
        <div
          onClick={handleClickUpload}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 cursor-pointer
                   transition-all duration-200
                   ${
                     isDragActive
                       ? 'border-[#434E54] bg-[#EAE0D5]/30'
                       : state === 'error'
                       ? 'border-red-300 bg-red-50/30'
                       : 'border-[#434E54]/30 hover:border-[#434E54] hover:bg-[#EAE0D5]/20'
                   }
                   ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            {state === 'error' ? (
              <>
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">Upload Failed</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                  className="btn btn-sm bg-red-600 text-white border-none hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#434E54]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#434E54]">
                    Drag & drop an image here, or click to browse
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    JPEG, PNG, or WebP • Max 5MB • Min 1920x800px
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : state === 'uploading' ? (
        /* Upload Progress */
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
              <span className="loading loading-spinner loading-sm text-[#434E54]"></span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#434E54]">Uploading...</p>
              <p className="text-xs text-[#6B7280]">{progress}% complete</p>
            </div>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={progress}
            max="100"
          ></progress>
        </div>
      ) : (
        /* Image Preview */
        <div className="space-y-3">
          <div className="relative aspect-[12/5] rounded-lg overflow-hidden bg-gray-100 group">
            <img
              src={currentImageUrl || ''}
              alt="Hero background"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23EAE0D5" width="100" height="100"/%3E%3C/svg%3E';
              }}
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <button
                onClick={handleClickUpload}
                disabled={disabled}
                className="btn btn-sm bg-white text-[#434E54] border-none hover:bg-gray-100
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                Replace
              </button>
              <button
                onClick={handleRemove}
                disabled={disabled}
                className="btn btn-sm bg-red-600 text-white border-none hover:bg-red-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>

          {/* Image URL */}
          <div className="flex items-center gap-2 p-2 bg-[#FFFBF7] rounded-lg border border-[#434E54]/10">
            <p className="text-xs text-[#6B7280] flex-1 truncate font-mono">
              {currentImageUrl}
            </p>
            <button
              onClick={handleCopyUrl}
              className="btn btn-xs bg-transparent text-[#434E54] border-[#434E54]/20
                       hover:bg-[#EAE0D5] hover:border-[#434E54]/30"
            >
              {copiedUrl ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="text-xs text-[#6B7280] space-y-1">
        <p className="font-medium">Image Requirements:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-2">
          <li>File type: JPEG, PNG, or WebP</li>
          <li>Maximum file size: 5MB</li>
          <li>Minimum dimensions: 1920x800 pixels</li>
          <li>Recommended aspect ratio: 12:5 (landscape)</li>
        </ul>
      </div>
    </div>
  );
}
