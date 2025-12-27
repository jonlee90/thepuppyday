# Calendar Import Wizard - Implementation Notes

## Status: Work in Progress

This directory contains the frontend components for the Calendar Import Wizard feature (Tasks 0044-0049).

## Critical Issue: API Schema Mismatch

**Discovery Date**: 2025-12-26

### The Problem

The frontend and backend have incompatible API schemas:

**Frontend Implementation** (current):
- Assumes manual mapping UI where users select customer/pet/service for each event
- Sends: `{ imports: [{ event_id, customer_id, pet_id, service_id, addon_ids, notes }] }`
- Provides full control over which entities are used

**Backend Implementation** (existing):
- Uses automatic matching/creation based on parsed event data
- Expects: `{ event_ids: string[], options: { skip_duplicates, create_new_customers, default_service_id } }`
- Automatically matches customers by email/phone, pets by name, services by name

### Impact

- ✅ Preview API works correctly (fetches and parses events)
- ❌ Confirm API will fail with 400 Bad Request (schema validation error)
- ❌ Wizard UI provides mapping features that aren't used by backend

### Architectural Decision Needed

**Option A**: Update Backend to Support Manual Mapping
- Pros: More control, better UX for complex cases, matches current UI
- Cons: More complex backend logic, requires API changes

**Option B**: Update Frontend to Use Automatic Matching
- Pros: Simpler UX, faster implementation, leverages existing backend
- Cons: Less control, may not handle edge cases well

**Recommendation**: Option B (update frontend) because:
1. Backend automatic matching is already implemented and tested
2. Simpler UX for most cases (90% of events can be auto-matched)
3. Less code to maintain
4. Faster time to production

### Required Frontend Changes for Option B

1. **Remove EventMappingForm step** (Step 3)
2. **Update wizard to 3 steps**:
   - Step 1: Date Range
   - Step 2: Event Selection + Options
   - Step 3: Review & Confirm
3. **Add options form to Step 2**:
   - ☐ Skip duplicate events
   - ☐ Automatically create new customers/pets
   - Select default service (for events without service info)
4. **Update ReviewStep** to show auto-match predictions
5. **Fix API call** to send `{ event_ids: [...], options: {...} }`

## Components

### Implemented (6 components)

1. **ImportButton.tsx** - Trigger button ✅
2. **ImportWizard.tsx** - Main wizard container ✅ (needs API fix)
3. **DateRangeStep.tsx** - Step 1: Date selection ✅
4. **EventSelectionStep.tsx** - Step 2: Event selection ✅
5. **EventMappingForm.tsx** - Step 3: Manual mapping ⚠️ (not compatible with backend)
6. **ReviewStep.tsx** - Step 4: Review & confirm ✅ (needs API fix)

### Design Specification

See: `.claude/design/calendar-import-wizard.md`

## Other Issues Found in Code Review

### Critical
- ✅ API Schema Mismatch (documented above)
- ⚠️ XSS vulnerability in event descriptions (needs sanitization)
- ⚠️ Missing CSRF protection (should use Server Actions)

### High Priority
- Performance: N+1 query problem (resolved by automatic matching)
- Missing error boundaries
- Accessibility: Missing live region announcements
- Race conditions in API calls

### Medium Priority
- Large component files (should be split)
- No progress persistence
- Missing keyboard shortcuts
- Inconsistent error messages

## Next Steps

1. **Decision**: Choose Option A or Option B for API alignment
2. **Implementation**: Update frontend or backend accordingly
3. **Security**: Add XSS sanitization and convert to Server Actions
4. **Testing**: End-to-end testing with real Google Calendar events
5. **Documentation**: Update user-facing help docs

## Files

```
src/components/admin/calendar/import/
├── README.md (this file)
├── index.ts
├── ImportButton.tsx
├── ImportWizard.tsx
├── DateRangeStep.tsx
├── EventSelectionStep.tsx
├── EventMappingForm.tsx
└── ReviewStep.tsx
```

## Related Files

- Backend API: `src/app/api/admin/calendar/import/{preview,confirm}/route.ts`
- Design Spec: `.claude/design/calendar-import-wizard.md`
- Task Spec: `docs/specs/google-calendar-integration/tasks.md` (Tasks 9.0-9.5)
- Code Review: See task execution logs for full security/performance analysis

## References

- Tasks: 0044-0049 (Phase 9: Import Wizard UI)
- Requirements: `docs/specs/google-calendar-integration/requirements.md` (Req 7, 14, 27)
- Design: `docs/specs/google-calendar-integration/design.md`
