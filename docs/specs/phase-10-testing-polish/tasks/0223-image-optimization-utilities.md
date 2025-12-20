# Task 0223: Create image optimization utilities for uploads

**Phase**: 10.1 Performance
**Prerequisites**: 0222
**Estimated effort**: 3-4 hours

## Objective

Create utilities for compressing and optimizing user-uploaded images on the client side before upload.

## Requirements

- Create `src/lib/utils/image-optimization.ts` with compression configs
- Implement optimizeImage function for client-side compression
- Configure max sizes: hero (1920x1080), gallery (800x600), petPhoto (400x400)
- Target report card images under 200KB

## Acceptance Criteria

- [ ] Image optimization utilities created
- [ ] optimizeImage function compresses images to target sizes
- [ ] Different compression configs for different image types
- [ ] Maintains aspect ratio during resize
- [ ] Converts to WebP format when supported
- [ ] File size targets met (report cards < 200KB)

## Implementation Details

### Files to Create

- `src/lib/utils/image-optimization.ts`

### Compression Configurations

```typescript
const IMAGE_CONFIGS = {
  hero: { maxWidth: 1920, maxHeight: 1080, quality: 0.85 },
  gallery: { maxWidth: 800, maxHeight: 600, quality: 0.80 },
  petPhoto: { maxWidth: 400, maxHeight: 400, quality: 0.85 },
  reportCard: { maxWidth: 800, maxHeight: 600, quality: 0.75 },
};
```

## References

- **Requirements**: Req 2.2, 2.9
- **Design**: Section 10.1.2
