# Task 0223: Create Image Upload Compression Utility

## Description
Create client-side image compression utility for optimizing images before upload to ensure efficient storage and fast loading.

## Checklist
- [ ] Create `src/lib/utils/image-optimization.ts` with compression pipeline
- [ ] Implement browser canvas-based compression for client-side
- [ ] Define image configs for hero, gallery, petPhoto, reportCard, banner
- [ ] Ensure report card images compress to under 200KB while maintaining quality

## Acceptance Criteria
Images uploaded via admin compressed to spec, WebP versions generated

## References
- Requirement 2.2, 2.9
- Design 10.1.2

## Files to Create/Modify
- `src/lib/utils/image-optimization.ts`

## Implementation Notes
6 preset configs needed with different compression levels and target sizes.
