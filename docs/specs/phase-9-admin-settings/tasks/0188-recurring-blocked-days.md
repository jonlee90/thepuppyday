# Task 0188: Recurring blocked days configuration

## Description
Create functionality for blocking recurring days of the week (e.g., always closed Sundays).

## Acceptance Criteria
- [ ] Create `RecurringBlockedDays` component
- [ ] Display toggles for each day of the week (Sunday-Saturday)
- [ ] Toggle on = always blocked for that day
- [ ] Store as array of day numbers (0=Sunday, 1=Monday, etc.)
- [ ] Visual distinction between recurring blocks and specific date blocks
- [ ] Warning when enabling recurring block that affects existing appointments
- [ ] Display upcoming affected dates when toggling
- [ ] Store in settings table under 'booking_settings.recurring_blocked_days'
- [ ] Integrate with calendar visualization (show recurring blocks differently)
- [ ] Sync with business hours (if day marked closed in hours, suggest blocking)

## Implementation Notes
- File: `src/components/admin/settings/booking/RecurringBlockedDays.tsx`
- Use DaisyUI toggle switches
- Day numbers follow JavaScript Date convention (0=Sunday)

## References
- Req 12.8
- Design: Blocked Dates Manager section

## Complexity
Small

## Category
UI

## Dependencies
- 0185 (Blocked dates API)
- 0186 (Blocked dates manager)
