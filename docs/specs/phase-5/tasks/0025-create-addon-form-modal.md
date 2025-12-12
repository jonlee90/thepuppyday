# Task 0025: Create AddOnForm modal

**Group**: Services & Add-ons (Week 5)

## Objective
Build add-on create/edit form with breed multi-select

## Files to create/modify
- `src/components/admin/addons/AddOnForm.tsx` - Add-on form modal
- `src/app/api/admin/addons/[id]/route.ts` - GET/PATCH single add-on endpoint

## Requirements covered
- REQ-20.1, REQ-20.2, REQ-20.3, REQ-20.4, REQ-20.5, REQ-20.6, REQ-20.7, REQ-20.8, REQ-20.9, REQ-20.10, REQ-20.11, REQ-20.12

## Acceptance criteria
- [x] Fields: Name, Description, Price, Breed-Based Upsell (multi-select), Active Status
- [x] Price validates positive number with max 2 decimals
- [x] Description limited to 500 characters with counter
- [x] Searchable multi-select dropdown for breeds from breeds table
- [x] Selected breeds stored as array in breed_upsell JSONB column
- [x] Case-insensitive breed search
- [x] Inline error messages for validation failures
- [x] Create inserts to addons table
- [x] Update modifies addons row
- [x] "Unsaved changes" dialog on close with changes
- [x] Success toast and list refresh on save
- [x] Required field validation prevents submission

## Implementation Notes
- Component location: `src/components/admin/addons/AddOnForm.tsx`
- API routes: `src/app/api/admin/addons/route.ts`, `src/app/api/admin/addons/[id]/route.ts`
- Security: Price validation with 2-decimal precision, breed name sanitization
- Multi-select UI: Searchable dropdown with removable chip/tag display
- Upsell prompt field: Optional text field for customizing upsell message
- Form state management: Unsaved changes detection with confirmation dialog
- Status: ✅ Completed
