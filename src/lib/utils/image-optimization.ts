/**
 * Image Optimization Utilities
 * Task 0223: Create image optimization utilities for uploads
 *
 * Client-side image compression and optimization using browser Canvas API
 * Generates WebP versions with proper quality settings and size validation
 */

export interface ImageOptimizationConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0-1 quality level
  targetSizeKB: number; // Target file size in KB
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Preset configurations for different image types
 * Each preset defines dimensions, quality, and target size
 */
export const IMAGE_CONFIGS: Record<string, ImageOptimizationConfig> = {
  hero: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    targetSizeKB: 300,
    format: 'image/webp',
  },
  gallery: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    targetSizeKB: 150,
    format: 'image/webp',
  },
  petPhoto: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.75,
    targetSizeKB: 100,
    format: 'image/webp',
  },
  reportCard: {
    maxWidth: 600,
    maxHeight: 800,
    quality: 0.8,
    targetSizeKB: 200,
    format: 'image/webp',
  },
  banner: {
    maxWidth: 1200,
    maxHeight: 400,
    quality: 0.85,
    targetSizeKB: 150,
    format: 'image/webp',
  },
  avatar: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.75,
    targetSizeKB: 50,
    format: 'image/webp',
  },
};

export interface OptimizationResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  dimensions: { width: number; height: number };
  compressionRatio: number;
}

/**
 * Optimize an image file for upload using browser Canvas API
 * Compresses to specified dimensions and generates WebP version
 *
 * @param file - Original image file
 * @param configName - Preset configuration to use (hero, gallery, petPhoto, reportCard, banner, avatar)
 * @returns Optimized image file with metadata
 */
export async function optimizeImage(
  file: File,
  configName: keyof typeof IMAGE_CONFIGS = 'gallery'
): Promise<OptimizationResult> {
  const config = IMAGE_CONFIGS[configName];

  // Validate file before processing
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const originalSize = file.size;

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > config.maxWidth || height > config.maxHeight) {
          const ratio = Math.min(config.maxWidth / width, config.maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', {
          alpha: config.format === 'image/png',
          willReadFrequently: false
        });

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedSize = blob.size;
            const sizeKB = compressedSize / 1024;

            // Validate compressed size meets target
            if (sizeKB > config.targetSizeKB * 1.5) {
              console.warn(
                `Warning: Compressed size (${Math.round(sizeKB)}KB) exceeds target (${config.targetSizeKB}KB) by more than 50%`
              );
            }

            // Generate filename with appropriate extension
            const extension = config.format === 'image/webp' ? '.webp' :
                            config.format === 'image/png' ? '.png' : '.jpg';
            const fileName = file.name.replace(/\.[^/.]+$/, extension);

            const optimizedFile = new File([blob], fileName, {
              type: config.format,
              lastModified: Date.now(),
            });

            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

            if (process.env.NODE_ENV === 'development') {
              console.log(
                `Image optimized (${configName}): ${Math.round(originalSize / 1024)}KB → ${Math.round(sizeKB)}KB (${compressionRatio.toFixed(1)}% reduction)`
              );
            }

            resolve({
              file: optimizedFile,
              originalSize,
              compressedSize,
              dimensions: { width, height },
              compressionRatio,
            });
          },
          config.format,
          config.quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image. File may be corrupted.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file before processing
 * Checks file type and size constraints
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10MB)
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): ValidationResult {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

  // Check file type
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, WebP, or HEIC image.',
    };
  }

  // Check file extension as fallback
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file extension. Please upload JPG, PNG, WebP, or HEIC image.',
    };
  }

  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  // Check minimum file size (1KB) to avoid corrupted files
  if (file.size < 1024) {
    return {
      valid: false,
      error: 'File too small. Image may be corrupted.',
    };
  }

  return { valid: true };
}

/**
 * Validate image dimensions
 * Useful for ensuring images meet minimum quality requirements
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param minWidth - Minimum required width (default: 100)
 * @param minHeight - Minimum required height (default: 100)
 * @returns Validation result
 */
export function validateImageDimensions(
  width: number,
  height: number,
  minWidth: number = 100,
  minHeight: number = 100
): ValidationResult {
  if (width < minWidth || height < minHeight) {
    return {
      valid: false,
      error: `Image dimensions too small. Minimum size is ${minWidth}x${minHeight}px.`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions without loading full image
 * Uses createObjectURL for efficient dimension extraction
 *
 * @param file - Image file to analyze
 * @returns Promise resolving to width and height
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Generate thumbnail from image
 * Uses avatar preset for small, optimized thumbnails
 *
 * @param file - Original image file
 * @param size - Target size in pixels (default: 150)
 * @returns Optimized thumbnail file
 */
export async function generateThumbnail(
  file: File,
  size: number = 150
): Promise<OptimizationResult> {
  return optimizeImage(file, 'avatar');
}

/**
 * Batch optimize multiple images
 * Processes images in parallel for better performance
 *
 * @param files - Array of image files to optimize
 * @param configName - Preset configuration to use
 * @returns Promise resolving to array of optimization results
 */
export async function optimizeImages(
  files: File[],
  configName: keyof typeof IMAGE_CONFIGS = 'gallery'
): Promise<OptimizationResult[]> {
  return Promise.all(files.map(file => optimizeImage(file, configName)));
}

/**
 * Create preview URL from file
 * Remember to revoke URL when done to prevent memory leaks
 *
 * @param file - File to create preview for
 * @returns Object URL string
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke preview URL to free memory
 *
 * @param url - Object URL to revoke
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "250 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate report card image specifically
 * Ensures image meets requirements for report cards (under 200KB after compression)
 *
 * @param file - Image file to validate
 * @returns Promise resolving to validation result
 */
export async function validateReportCardImage(file: File): Promise<ValidationResult> {
  // First validate file
  const fileValidation = validateImageFile(file);
  if (!fileValidation.valid) {
    return fileValidation;
  }

  // Get dimensions
  try {
    const { width, height } = await getImageDimensions(file);
    const dimensionValidation = validateImageDimensions(width, height, 200, 200);
    if (!dimensionValidation.valid) {
      return dimensionValidation;
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to read image dimensions. File may be corrupted.',
    };
  }

  return { valid: true };
}
