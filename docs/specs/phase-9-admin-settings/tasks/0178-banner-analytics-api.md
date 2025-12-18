# Task 0178: Banner analytics API and component

## Description
Create API endpoint and UI component for viewing banner performance analytics.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/banners/[id]/analytics` endpoint
- [ ] Support query params: period (7d, 30d, 90d, custom), start, end
- [ ] Return: total_clicks, total_impressions, ctr (click-through rate)
- [ ] Return clicks_by_date array for chart visualization
- [ ] Return comparison object with previous_period_clicks and change_percent
- [ ] Create `BannerAnalytics` component for displaying metrics
- [ ] Show total clicks with trend indicator (+15% vs last week)
- [ ] Show CTR percentage if impressions are tracked
- [ ] Create simple line/bar chart for clicks over time
- [ ] Add date range selector for custom periods
- [ ] Implement CSV export for analytics data

## Implementation Notes
- API File: `src/app/api/admin/settings/banners/[id]/analytics/route.ts`
- Component File: `src/components/admin/settings/banners/BannerAnalytics.tsx`
- Use Recharts for visualization
- Query within 3 seconds per NFR-1.4

## References
- Req 7.1, Req 7.3, Req 7.4, Req 7.5, Req 7.7, Req 7.8
- NFR-1.4
- Design: Banner Analytics section

## Complexity
Medium

## Category
API, UI

## Dependencies
- 0177 (Banner click tracking)
