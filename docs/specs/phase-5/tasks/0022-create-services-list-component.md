# Task 0022: Create ServicesList component

**Group**: Services & Add-ons (Week 5)

## Objective
Build services list with active/inactive toggle and drag-drop reorder

## Files to create/modify
- `src/app/(admin)/services/page.tsx` - Services page
- `src/components/admin/services/ServicesList.tsx` - Services list
- `src/app/api/admin/services/route.ts` - GET/POST services endpoint

## Requirements covered
- REQ-17.1, REQ-17.2, REQ-17.3, REQ-17.4, REQ-17.5, REQ-17.6, REQ-17.7, REQ-17.8, REQ-17.9, REQ-17.10

## Acceptance criteria
- [x] Lists all services from services table
- [x] Shows name, description (truncated), duration, active status, actions
- [x] Service image thumbnail if available
- [x] Active/Inactive toggle updates is_active without reload
- [x] Inactive services show reduced opacity and "Inactive" badge
- [x] Edit button opens service form modal
- [x] Drag-drop reorder updates display_order
- [x] Empty state with "Add Your First Service" button
- [x] Size-based pricing displayed in 4-size grid

## Implementation Notes
- Component location: `src/components/admin/services/ServicesList.tsx`
- Page location: `src/app/(admin)/services/page.tsx`
- API routes: `src/app/api/admin/services/route.ts`, `src/app/api/admin/services/[id]/route.ts`
- Drag-drop implementation: @dnd-kit library
- Security improvements: UUID validation, input sanitization, XSS prevention
- Design: Clean & Elegant Professional with charcoal (#434E54) and cream (#EAE0D5) palette
- Status: ✅ Completed
