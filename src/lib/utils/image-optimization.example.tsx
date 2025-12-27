/**
 * Image Optimization Usage Examples
 * Demonstrates how to use the image-optimization utility
 */

'use client';

import { useState } from 'react';
import {
  optimizeImage,
  optimizeImages,
  validateImageFile,
  validateReportCardImage,
  getImageDimensions,
  createPreviewUrl,
  revokePreviewUrl,
  formatFileSize,
  IMAGE_CONFIGS,
  type OptimizationResult,
} from './image-optimization';

/**
 * Example 1: Single Image Upload with Optimization
 */
export function SingleImageUpload() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      // Validate file first
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // Optimize for gallery
      const optimizationResult = await optimizeImage(file, 'gallery');
      setResult(optimizationResult);

      // Use the optimized file for upload
      // await uploadToStorage(optimizationResult.file);

      console.log('Optimization complete:', {
        originalSize: formatFileSize(optimizationResult.originalSize),
        compressedSize: formatFileSize(optimizationResult.compressedSize),
        dimensions: optimizationResult.dimensions,
        compressionRatio: `${optimizationResult.compressionRatio.toFixed(1)}%`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-[#434E54] mb-4">Upload Gallery Image</h3>

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleImageUpload}
        disabled={loading}
        className="mb-4"
      />

      {loading && <p className="text-[#6B7280]">Optimizing image...</p>}

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {result && (
        <div className="mt-4 p-4 bg-[#F8EEE5] rounded-lg">
          <p className="text-sm text-[#434E54]">
            <strong>Original:</strong> {formatFileSize(result.originalSize)}
          </p>
          <p className="text-sm text-[#434E54]">
            <strong>Compressed:</strong> {formatFileSize(result.compressedSize)}
          </p>
          <p className="text-sm text-[#434E54]">
            <strong>Dimensions:</strong> {result.dimensions.width}x{result.dimensions.height}
          </p>
          <p className="text-sm text-[#6BCB77]">
            <strong>Saved:</strong> {result.compressionRatio.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Report Card Image Upload
 */
export function ReportCardImageUpload() {
  const [preview, setPreview] = useState<string>('');
  const [optimizedFile, setOptimizedFile] = useState<File | null>(null);

  const handleReportCardImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate for report card specifically
      const validation = await validateReportCardImage(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      // Optimize for report card (600x800, 80% quality, target 200KB)
      const result = await optimizeImage(file, 'reportCard');

      // Verify final size is under 200KB
      if (result.compressedSize > 200 * 1024) {
        console.warn('Report card image exceeds 200KB target');
      }

      setOptimizedFile(result.file);

      // Create preview
      const previewUrl = createPreviewUrl(result.file);
      setPreview(previewUrl);

      // Clean up old preview
      return () => {
        if (preview) revokePreviewUrl(preview);
      };
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-[#434E54] mb-4">
        Upload Report Card Photo
      </h3>

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleReportCardImage}
        className="mb-4"
      />

      {preview && (
        <div className="mt-4">
          <img
            src={preview}
            alt="Report card preview"
            className="w-full max-w-sm rounded-lg shadow-md"
          />
          {optimizedFile && (
            <p className="mt-2 text-sm text-[#6B7280]">
              Size: {formatFileSize(optimizedFile.size)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Batch Image Upload (Gallery)
 */
export function BatchImageUpload() {
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setLoading(true);

    try {
      // Validate all files first
      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          alert(`${file.name}: ${validation.error}`);
          setLoading(false);
          return;
        }
      }

      // Optimize all images in parallel
      const optimizationResults = await optimizeImages(files, 'gallery');
      setResults(optimizationResults);

      console.log(`Optimized ${optimizationResults.length} images`);
    } catch (err) {
      alert('Batch optimization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-[#434E54] mb-4">
        Upload Multiple Gallery Images
      </h3>

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleBatchUpload}
        disabled={loading}
        className="mb-4"
      />

      {loading && <p className="text-[#6B7280]">Optimizing {results.length} images...</p>}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((result, index) => (
            <div key={index} className="p-3 bg-[#F8EEE5] rounded-lg flex justify-between">
              <span className="text-sm text-[#434E54]">{result.file.name}</span>
              <span className="text-sm text-[#6BCB77]">
                {formatFileSize(result.compressedSize)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Getting Image Dimensions
 */
export async function checkImageDimensions(file: File) {
  try {
    const dimensions = await getImageDimensions(file);
    console.log(`Image dimensions: ${dimensions.width}x${dimensions.height}`);

    // Check if image meets minimum requirements
    if (dimensions.width < 400 || dimensions.height < 400) {
      throw new Error('Image too small. Minimum 400x400 required.');
    }

    return dimensions;
  } catch (err) {
    console.error('Failed to get dimensions:', err);
    throw err;
  }
}

/**
 * Example 5: Using Different Presets
 */
export async function optimizeForDifferentUses(file: File) {
  // Hero image for homepage
  const heroResult = await optimizeImage(file, 'hero');
  console.log('Hero image:', heroResult);

  // Avatar for user profile
  const avatarResult = await optimizeImage(file, 'avatar');
  console.log('Avatar:', avatarResult);

  // Pet photo for booking
  const petPhotoResult = await optimizeImage(file, 'petPhoto');
  console.log('Pet photo:', petPhotoResult);

  // Banner for promotions
  const bannerResult = await optimizeImage(file, 'banner');
  console.log('Banner:', bannerResult);

  return {
    hero: heroResult,
    avatar: avatarResult,
    petPhoto: petPhotoResult,
    banner: bannerResult,
  };
}

/**
 * Example 6: Available Configurations
 */
export function ConfigurationReference() {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-[#434E54] mb-4">
        Image Optimization Presets
      </h3>

      <div className="space-y-3">
        {Object.entries(IMAGE_CONFIGS).map(([name, config]) => (
          <div key={name} className="p-4 bg-[#F8EEE5] rounded-lg">
            <h4 className="font-semibold text-[#434E54] mb-2">{name}</h4>
            <ul className="text-sm text-[#6B7280] space-y-1">
              <li>Max Dimensions: {config.maxWidth}x{config.maxHeight}px</li>
              <li>Quality: {(config.quality * 100).toFixed(0)}%</li>
              <li>Target Size: {config.targetSizeKB}KB</li>
              <li>Format: {config.format}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
