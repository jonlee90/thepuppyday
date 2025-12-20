# Task 0224: Audit and fix image components across the application

**Phase**: 10.1 Performance
**Prerequisites**: 0222, 0223
**Estimated effort**: 3-4 hours

## Objective

Audit all image usage across the application and update to use OptimizedImage component with proper loading strategies.

## Requirements

- Update hero images to use priority loading
- Add lazy loading to below-the-fold gallery images
- Ensure all images have explicit width/height
- Fix any images missing alt text

## Acceptance Criteria

- [ ] All hero/above-fold images use `priority={true}`
- [ ] Below-the-fold images use lazy loading
- [ ] All images have explicit width and height
- [ ] All images have descriptive alt text
- [ ] Zero Cumulative Layout Shift from images
- [ ] No console warnings about missing dimensions

## Implementation Details

### Files to Audit and Modify

- `src/app/(marketing)/page.tsx` - Hero images
- `src/app/(marketing)/gallery/page.tsx` - Gallery images
- `src/components/booking/**` - Service/pet images
- `src/app/(customer)/**` - Portal images
- `src/app/(admin)/**` - Admin images

### Checklist per Image

- [ ] Using OptimizedImage or Next.js Image
- [ ] Has width and height props
- [ ] Has descriptive alt text
- [ ] Priority set correctly based on position
- [ ] Appropriate sizes attribute for responsive

## References

- **Requirements**: Req 2.4-2.8
- **Design**: Section 10.1.2
