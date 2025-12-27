# Image Optimization - Quick Reference

## Import

```typescript
import {
  optimizeImage,
  validateImageFile,
  IMAGE_CONFIGS,
} from '@/lib/utils/image-optimization';
```

## Common Use Cases

### 1. Upload Gallery Image

```typescript
const result = await optimizeImage(file, 'gallery');
// Output: 800x600px, 80% quality, ~150KB, WebP
```

### 2. Upload Pet Photo

```typescript
const result = await optimizeImage(file, 'petPhoto');
// Output: 400x400px, 75% quality, ~100KB, WebP
```

### 3. Upload Report Card Photo

```typescript
const result = await optimizeImage(file, 'reportCard');
// Output: 600x800px, 80% quality, ~200KB, WebP
// MUST be under 200KB
```

### 4. Upload Hero Image

```typescript
const result = await optimizeImage(file, 'hero');
// Output: 1920x1080px, 85% quality, ~300KB, WebP
```

### 5. Upload Avatar

```typescript
const result = await optimizeImage(file, 'avatar');
// Output: 200x200px, 75% quality, ~50KB, WebP
```

### 6. Upload Banner

```typescript
const result = await optimizeImage(file, 'banner');
// Output: 1200x400px, 85% quality, ~150KB, WebP
```

## Validation

```typescript
// Simple validation
const validation = validateImageFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}

// Report card validation (includes dimension check)
const validation = await validateReportCardImage(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

## Presets at a Glance

| Preset | Dimensions | Quality | Target | Use Case |
|--------|------------|---------|--------|----------|
| **hero** | 1920x1080 | 85% | 300KB | Homepage heroes |
| **gallery** | 800x600 | 80% | 150KB | Gallery images |
| **petPhoto** | 400x400 | 75% | 100KB | Pet profiles |
| **reportCard** | 600x800 | 80% | 200KB | Before/after |
| **banner** | 1200x400 | 85% | 150KB | Promo banners |
| **avatar** | 200x200 | 75% | 50KB | User avatars |

## Result Object

```typescript
{
  file: File,              // Optimized WebP file
  originalSize: 2048000,   // Original size in bytes (2 MB)
  compressedSize: 153600,  // Compressed size (150 KB)
  dimensions: { width: 800, height: 600 },
  compressionRatio: 92.5,  // 92.5% reduction
}
```

## Complete Example

```typescript
async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  // 1. Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  try {
    // 2. Optimize
    const result = await optimizeImage(file, 'gallery');

    // 3. Upload
    await uploadToStorage(result.file);

    console.log(`Saved ${result.compressionRatio.toFixed(1)}%`);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## All Available Functions

```typescript
// Core functions
optimizeImage(file, preset)          // Optimize single image
optimizeImages(files, preset)        // Batch optimize
validateImageFile(file)              // Validate file
validateReportCardImage(file)        // Validate for report card
getImageDimensions(file)             // Get width/height
generateThumbnail(file)              // Create thumbnail

// Helper functions
createPreviewUrl(file)               // Create preview URL
revokePreviewUrl(url)                // Clean up URL
formatFileSize(bytes)                // Format size string
validateImageDimensions(w, h)        // Check dimensions
```
