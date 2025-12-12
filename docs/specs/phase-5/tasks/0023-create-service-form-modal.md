# Task 0023: Create ServiceForm modal

**Group**: Services & Add-ons (Week 5)

## Objective
Build service create/edit form with size-based pricing

## Files to create/modify
- `src/components/admin/services/ServiceForm.tsx` - Service form modal
- `src/components/admin/services/SizeBasedPricingInputs.tsx` - Price inputs component
- `src/app/api/admin/services/[id]/route.ts` - GET/PATCH single service endpoint

## Requirements covered
- REQ-18.1, REQ-18.2, REQ-18.3, REQ-18.4, REQ-18.5, REQ-18.6, REQ-18.7, REQ-18.8, REQ-18.9, REQ-18.10, REQ-18.11, REQ-18.12

## Acceptance criteria
- [x] Fields: Name, Description, Duration (minutes), Image Upload, Size-Based Pricing, Active Status
- [x] Image upload validates type (JPEG, PNG, WebP) and size (max 5MB)
- [x] Image uploads to Supabase Storage `service-images` with UUID filename
- [x] Duration validates positive integer between 15-480 minutes
- [x] Four price inputs: Small (0-18 lbs), Medium (19-35 lbs), Large (36-65 lbs), X-Large (66+ lbs)
- [x] Price validates positive number with max 2 decimals
- [x] Inline error messages for validation failures
- [x] Create inserts to services + 4 service_prices rows
- [x] Update modifies services and service_prices rows
- [x] Image upload failure shows error, allows retry without losing form data
- [x] "Unsaved changes" dialog on close with changes
- [x] Success toast and list refresh on save

## Implementation Notes
- Component location: `src/components/admin/services/ServiceForm.tsx`
- Size-based pricing component: `src/components/admin/services/SizeBasedPricingInputs.tsx`
- API routes: `src/app/api/admin/services/route.ts`, `src/app/api/admin/services/[id]/route.ts`
- Security: Input sanitization, image URL validation, comprehensive price validation
- Form state management: Unsaved changes detection and confirmation dialog
- Character counter: 500 character limit for description field
- Status: ✅ Completed
