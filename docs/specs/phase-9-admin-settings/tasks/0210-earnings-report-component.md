# Task 0210: Earnings report component

## Description
Create the earnings report component for viewing groomer performance and commission reports.

## Acceptance Criteria
- [ ] Create `EarningsReport` component
- [ ] Date range picker (presets: This week, This month, Last month, Custom)
- [ ] Groomer filter dropdown (All or specific groomer)
- [ ] Group by selector: Day, Week, Month
- [ ] Summary cards: Total services, Total revenue, Total commission, Total tips
- [ ] Bar chart showing earnings over time
- [ ] Detailed table with columns: Period, Services, Revenue, Commission, Tips
- [ ] Per-groomer breakdown table when "All" selected
- [ ] Comparison to previous period (+/-% indicator)
- [ ] Export buttons: CSV and PDF download
- [ ] Include date range in export filename
- [ ] Loading state while report generates

## Implementation Notes
- File: `src/components/admin/settings/staff/EarningsReport.tsx`
- Use Recharts for bar chart
- CSV export using papaparse or similar

## References
- Req 19.1, Req 19.2, Req 19.3, Req 19.4, Req 19.5, Req 19.6, Req 19.7, Req 19.8
- Design: Earnings Report section

## Complexity
Large

## Category
UI

## Dependencies
- 0209 (Earnings report API)
