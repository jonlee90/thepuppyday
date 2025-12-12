# Task 0024: Create AddOnsList component

**Group**: Services & Add-ons (Week 5)

## Objective
Build add-ons list with active/inactive toggle

## Files to create/modify
- `src/app/(admin)/addons/page.tsx` - Add-ons page
- `src/components/admin/addons/AddOnsList.tsx` - Add-ons list
- `src/app/api/admin/addons/route.ts` - GET/POST add-ons endpoint

## Requirements covered
- REQ-19.1, REQ-19.2, REQ-19.3, REQ-19.4, REQ-19.5, REQ-19.6, REQ-19.7, REQ-19.8, REQ-19.9, REQ-19.10

## Acceptance criteria
- [x] Lists all add-ons from addons table
- [x] Shows name, description, price (USD formatted), active status, actions
- [x] Active/Inactive toggle updates is_active without reload
- [x] Inactive add-ons show reduced opacity and "Inactive" badge
- [x] Edit button opens add-on form modal
- [x] Drag-drop reorder updates display_order
- [x] Empty state with "Add Your First Add-on" button
- [x] Breed-based upsell indicator icon on applicable cards

## Implementation Notes
- Component location: `src/components/admin/addons/AddOnsList.tsx`
- Page location: `src/app/(admin)/addons/page.tsx`
- API routes: `src/app/api/admin/addons/route.ts`, `src/app/api/admin/addons/[id]/route.ts`
- Drag-drop implementation: @dnd-kit library (matching services implementation)
- Security improvements: UUID validation, breed name sanitization, referential integrity checks
- Breed upsell indicator: Icon with count badge and tooltip showing breed names
- Status: ✅ Completed
