/**
 * Image Compression Utilities
 * Compresses images for report card photo uploads
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

/**
 * Compress an image file to reduce size and dimensions
 * Default: max 1200px width, optimized for web delivery
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image. Please try a different file.');
  }
}

/**
 * Create a data URL preview from a file
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Validate image file before compression
 */
export function validateImageForReportCard(
  file: File
): { valid: boolean; error?: string } {
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size must be 10MB or less.',
    };
  }

  return { valid: true };
}
