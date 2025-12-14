# Task 0010: Create report card submission with validation

**Group**: Report Card System - Admin Form (Week 1)

## Objective
Build submit action with validation and API integration

## Files to create/modify
- `src/components/admin/report-cards/SubmitActions.tsx`
- `src/app/api/admin/report-cards/route.ts`
- `src/lib/admin/report-card-validation.ts`

## Requirements covered
- REQ-6.1.2
- REQ-6.1.3

## Acceptance criteria
- After photo required validation
- At least one assessment field required validation
- Save Draft button preserves is_draft=true
- Submit button sets is_draft=false
- Success redirects to appointment detail
- Report card editable within 24 hours of creation
