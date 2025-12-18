# Task 0176: Banner scheduling with date pickers

## Description
Add scheduling functionality to the banner editor with start and end date pickers.

## Acceptance Criteria
- [ ] Add start date picker to BannerEditor
- [ ] Add end date picker to BannerEditor
- [ ] Use Pacific Time (America/Los_Angeles) for all date/time selections
- [ ] Allow setting future start date and time
- [ ] Validate end date is after start date
- [ ] Allow empty start date (displays immediately when activated)
- [ ] Allow empty end date (displays indefinitely)
- [ ] Show scheduling status preview based on selected dates
- [ ] Display timezone indicator next to date pickers
- [ ] Auto-activate banner when start date is reached (server-side)
- [ ] Auto-deactivate banner when end date is passed (server-side)

## Implementation Notes
- Update: `src/components/admin/settings/banners/BannerEditor.tsx`
- Use date-fns-tz for timezone handling
- Consider using react-datepicker or similar
- Scheduling logic runs on banner fetch, not via cron

## References
- Req 5.1, Req 5.2, Req 5.3, Req 5.4, Req 5.5, Req 5.6, Req 5.7
- Design: Banner Editor Modal section

## Complexity
Medium

## Category
UI

## Dependencies
- 0175 (Banner editor modal)
