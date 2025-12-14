# Task 0009: Implement auto-save draft functionality

**Group**: Report Card System - Admin Form (Week 1)

## Objective
Add debounced auto-save with offline support

## Files to create/modify
- `src/hooks/admin/use-report-card-form.ts`
- `src/app/api/admin/report-cards/route.ts`

## Requirements covered
- REQ-6.1.1
- REQ-6.1.3

## Acceptance criteria
- Form state auto-saves every 5 seconds (debounced)
- Draft indicator shows "Saving..." and "Saved at [time]"
- LocalStorage fallback for offline mode
- Draft syncs when back online
- One report card per appointment enforced
