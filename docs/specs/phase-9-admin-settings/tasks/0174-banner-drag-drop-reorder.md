# Task 0174: Banner drag-drop reordering

## Description
Implement drag-and-drop functionality for reordering promotional banners in the admin interface.

## Acceptance Criteria
- [ ] Integrate drag-drop library (dnd-kit or react-beautiful-dnd)
- [ ] Enable drag handles on each banner row/card
- [ ] Show visual feedback during drag (ghost element, drop zone highlight)
- [ ] Update display order immediately on drop (optimistic update)
- [ ] Call reorder API after drop to persist changes
- [ ] Show success toast after successful reorder
- [ ] Rollback UI state if API call fails
- [ ] Disable drag-drop on mobile (touch-friendly reorder buttons instead)
- [ ] Add up/down arrow buttons as alternative to drag-drop
- [ ] Maintain accessibility with keyboard navigation

## Implementation Notes
- Update: `src/components/admin/settings/banners/BannerList.tsx`
- File: `src/components/admin/settings/banners/SortableItem.tsx`
- Use @dnd-kit/core and @dnd-kit/sortable
- Consider adding position numbers for clarity

## References
- Req 6.2, Req 6.3, Req 6.4
- Design: Banner List with Drag-Drop section

## Complexity
Medium

## Category
UI

## Dependencies
- 0171 (Banner reorder API)
- 0173 (Banner list component)
