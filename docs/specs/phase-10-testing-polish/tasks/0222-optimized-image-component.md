# Task 0222: Implement OptimizedImage component with WebP support

**Phase**: 10.1 Performance
**Prerequisites**: 0221
**Estimated effort**: 2-3 hours

## Objective

Create a reusable OptimizedImage component that wraps Next.js Image with sensible defaults for performance.

## Requirements

- Create `src/components/common/OptimizedImage.tsx` wrapping Next.js Image
- Configure responsive sizes, blur placeholder, priority prop
- Add width/height attributes to prevent CLS
- Support WebP format with automatic format detection

## Acceptance Criteria

- [ ] OptimizedImage component created
- [ ] Component accepts all Next.js Image props
- [ ] Responsive sizes configured with srcset
- [ ] Blur placeholder enabled by default
- [ ] Serves WebP in supported browsers
- [ ] Width/height required to prevent layout shift

## Implementation Details

### Files to Create

- `src/components/common/OptimizedImage.tsx`

### Component Props

```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
}
```

## References

- **Requirements**: Req 2.1-2.6
- **Design**: Section 10.1.2
