# Image Optimization Utility

**Task 0223**: Client-side image compression and optimization for The Puppy Day

## Overview

This utility provides client-side image compression using the browser Canvas API. It compresses images to specified dimensions, generates WebP versions, and validates file sizes—all without requiring external dependencies or server-side processing.

## Features

- **6 Preset Configurations**: hero, gallery, petPhoto, reportCard, banner, avatar
- **Browser Canvas Compression**: Pure client-side processing using Canvas API
- **WebP Generation**: Automatic WebP conversion with quality control
- **Size Validation**: Ensures images meet target file size requirements
- **Batch Processing**: Optimize multiple images in parallel
- **Dimension Extraction**: Get image dimensions without full loading
- **Preview Management**: Create and revoke object URLs for memory efficiency
- **TypeScript Support**: Full type safety and IntelliSense

## Installation

No external dependencies required. The utility uses native browser APIs:
- Canvas API for image compression
- FileReader API for file handling
- Blob API for file generation

## Preset Configurations

### Hero Image
```typescript
{
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,  // 85%
  targetSizeKB: 300,
  format: 'image/webp',
}
```
**Use case**: Homepage hero sections, large promotional banners

### Gallery
```typescript
{
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.8,  // 80%
  targetSizeKB: 150,
  format: 'image/webp',
}
```
**Use case**: Gallery images, before/after photos, portfolio

### Pet Photo
```typescript
{
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.75,  // 75%
  targetSizeKB: 100,
  format: 'image/webp',
}
```
**Use case**: Pet profiles, booking widget pet photos

### Report Card
```typescript
{
  maxWidth: 600,
  maxHeight: 800,
  quality: 0.8,  // 80%
  targetSizeKB: 200,
  format: 'image/webp',
}
```
**Use case**: Report card before/after photos (must be under 200KB)

### Banner
```typescript
{
  maxWidth: 1200,
  maxHeight: 400,
  quality: 0.85,  // 85%
  targetSizeKB: 150,
  format: 'image/webp',
}
```
**Use case**: Promotional banners, announcement bars

### Avatar
```typescript
{
  maxWidth: 200,
  maxHeight: 200,
  quality: 0.75,  // 75%
  targetSizeKB: 50,
  format: 'image/webp',
}
```
**Use case**: User avatars, thumbnails, profile pictures

## Usage

### Basic Image Optimization

```typescript
import { optimizeImage } from '@/lib/utils/image-optimization';

async function handleImageUpload(file: File) {
  try {
    const result = await optimizeImage(file, 'gallery');

    console.log('Optimized!', {
      file: result.file,              // Optimized File object
      originalSize: result.originalSize,   // Original size in bytes
      compressedSize: result.compressedSize, // Compressed size in bytes
      dimensions: result.dimensions,   // { width, height }
      compressionRatio: result.compressionRatio, // % reduction
    });

    // Upload the optimized file
    await uploadToStorage(result.file);
  } catch (error) {
    console.error('Optimization failed:', error);
  }
}
```

### Validate Before Processing

```typescript
import { validateImageFile } from '@/lib/utils/image-optimization';

function handleFileSelect(file: File) {
  const validation = validateImageFile(file);

  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  // Proceed with optimization
  optimizeImage(file, 'petPhoto');
}
```

### Report Card Image Validation

```typescript
import { validateReportCardImage, optimizeImage } from '@/lib/utils/image-optimization';

async function handleReportCardPhoto(file: File) {
  // Specific validation for report card images
  const validation = await validateReportCardImage(file);

  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  const result = await optimizeImage(file, 'reportCard');

  // Verify final size is under 200KB
  if (result.compressedSize > 200 * 1024) {
    console.warn('Report card image exceeds 200KB target');
  }

  return result.file;
}
```

### Batch Image Optimization

```typescript
import { optimizeImages } from '@/lib/utils/image-optimization';

async function handleMultipleUploads(files: File[]) {
  try {
    const results = await optimizeImages(files, 'gallery');

    console.log(`Optimized ${results.length} images`);

    // Upload all optimized files
    await Promise.all(
      results.map(result => uploadToStorage(result.file))
    );
  } catch (error) {
    console.error('Batch optimization failed:', error);
  }
}
```

### Get Image Dimensions

```typescript
import { getImageDimensions } from '@/lib/utils/image-optimization';

async function checkDimensions(file: File) {
  try {
    const { width, height } = await getImageDimensions(file);
    console.log(`Image is ${width}x${height}px`);

    if (width < 400 || height < 400) {
      throw new Error('Image too small');
    }
  } catch (error) {
    console.error('Failed to get dimensions:', error);
  }
}
```

### Preview Management

```typescript
import { createPreviewUrl, revokePreviewUrl } from '@/lib/utils/image-optimization';

function ImagePreview({ file }: { file: File }) {
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    const url = createPreviewUrl(file);
    setPreview(url);

    // Clean up on unmount
    return () => {
      revokePreviewUrl(url);
    };
  }, [file]);

  return <img src={preview} alt="Preview" />;
}
```

### Format File Size

```typescript
import { formatFileSize } from '@/lib/utils/image-optimization';

const fileSize = formatFileSize(1024 * 500);  // "500 KB"
const largeFile = formatFileSize(1024 * 1024 * 2.5);  // "2.5 MB"
```

## API Reference

### `optimizeImage(file: File, configName?: string): Promise<OptimizationResult>`

Optimizes a single image file using the specified preset configuration.

**Parameters:**
- `file`: File - The image file to optimize
- `configName`: keyof IMAGE_CONFIGS - Preset to use (default: 'gallery')

**Returns:** Promise resolving to OptimizationResult
```typescript
{
  file: File;              // Optimized file
  originalSize: number;    // Original size in bytes
  compressedSize: number;  // Compressed size in bytes
  dimensions: { width: number; height: number };
  compressionRatio: number; // Percentage reduction
}
```

### `optimizeImages(files: File[], configName?: string): Promise<OptimizationResult[]>`

Batch optimizes multiple images in parallel.

### `validateImageFile(file: File, maxSizeMB?: number): ValidationResult`

Validates image file type and size.

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

### `validateReportCardImage(file: File): Promise<ValidationResult>`

Special validation for report card images (checks dimensions and size).

### `getImageDimensions(file: File): Promise<{ width: number; height: number }>`

Extracts image dimensions without loading the full image.

### `generateThumbnail(file: File, size?: number): Promise<OptimizationResult>`

Generates a small thumbnail using the avatar preset.

### `createPreviewUrl(file: File): string`

Creates an object URL for image preview.

### `revokePreviewUrl(url: string): void`

Revokes an object URL to free memory.

### `formatFileSize(bytes: number): string`

Formats bytes to human-readable format (KB, MB, GB).

## File Size Targets

The utility aims to compress images to these target sizes:

| Preset | Target Size | Use Case |
|--------|-------------|----------|
| Hero | 300KB | Homepage heroes, large banners |
| Gallery | 150KB | Gallery images, portfolios |
| Pet Photo | 100KB | Pet profiles, booking |
| Report Card | 200KB | Before/after photos |
| Banner | 150KB | Promotional banners |
| Avatar | 50KB | User avatars, thumbnails |

**Note**: The utility will warn if compressed size exceeds target by more than 50%.

## Supported File Formats

**Input:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- HEIC (.heic)

**Output:**
- WebP (all presets use WebP for optimal compression)

## Validation Rules

### File Validation
- Maximum upload size: 10MB (configurable)
- Minimum file size: 1KB (prevents corrupted files)
- Allowed types: JPEG, PNG, WebP, HEIC

### Dimension Validation
- Minimum dimensions: 100x100px (configurable)
- Aspect ratio: Maintained during compression

## Error Handling

All functions throw descriptive errors:

```typescript
try {
  const result = await optimizeImage(file, 'gallery');
} catch (error) {
  if (error instanceof Error) {
    // "Invalid file type. Please upload JPG, PNG, WebP, or HEIC image."
    // "File too large. Maximum size is 10MB."
    // "Failed to load image. File may be corrupted."
    // "Failed to compress image"
    console.error(error.message);
  }
}
```

## Performance Considerations

1. **Client-Side Processing**: All compression happens in the browser
2. **Parallel Processing**: Batch optimization runs in parallel
3. **Memory Management**: Use `revokePreviewUrl()` to prevent memory leaks
4. **High-Quality Smoothing**: Uses `imageSmoothingQuality: 'high'` for better results

## Integration with Supabase Storage

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { optimizeImage } from '@/lib/utils/image-optimization';

async function uploadOptimizedImage(file: File, bucket: string, path: string) {
  const supabase = createClientComponentClient();

  // Optimize first
  const result = await optimizeImage(file, 'gallery');

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, result.file, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  return data;
}
```

## Testing

The utility includes comprehensive type definitions and can be tested with:

```typescript
// Test validation
const testFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
const validation = validateImageFile(testFile);
expect(validation.valid).toBe(true);

// Test optimization (requires actual image file)
const result = await optimizeImage(imageFile, 'petPhoto');
expect(result.compressedSize).toBeLessThan(result.originalSize);
expect(result.file.type).toBe('image/webp');
```

## Browser Compatibility

- Modern browsers with Canvas API support
- Chrome 23+
- Firefox 19+
- Safari 6.1+
- Edge 12+

WebP support:
- Chrome 23+
- Firefox 65+
- Safari 14+
- Edge 18+

## License

Part of The Puppy Day SaaS application.

## Related Files

- `/src/lib/utils/image-optimization.ts` - Main utility
- `/src/lib/utils/image-optimization.example.tsx` - Usage examples
- `/src/lib/utils/image-compression.ts` - Legacy compression (uses browser-image-compression library)
