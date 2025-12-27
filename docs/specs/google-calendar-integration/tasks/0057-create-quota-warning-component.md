# Task 0057: Create Quota Warning Component

**Phase**: 11 - Error Handling and Recovery
**Task ID**: 11.2
**Status**: Pending

## Description

Create a warning component that alerts admins when Google Calendar API quota usage approaches limits, helping prevent service disruption.

## Requirements

- Create `src/components/admin/calendar/QuotaWarning.tsx`
- Display warning when API quota exceeds 80%
- Show current quota usage percentage
- Show estimated time until quota reset
- Suggest throttling non-critical operations
- Link to Google Cloud Console for quota monitoring
- Auto-hide when quota drops below threshold

## Acceptance Criteria

- [ ] Component created at correct path
- [ ] Warning shown when quota > 80%
- [ ] Current quota usage displayed (e.g., "850/1000 requests")
- [ ] Usage percentage shown with progress bar
- [ ] Time until quota reset displayed
- [ ] Warning severity increases at 90% (yellow) and 95% (red)
- [ ] Suggested actions displayed
- [ ] Link to Google Cloud Console quota page
- [ ] Warning dismissible but reappears on page reload
- [ ] Auto-hides when quota drops below 80%
- [ ] Proper TypeScript types defined
- [ ] Responsive design

## Related Requirements

- Req 17.4: Track API quota usage
- Req 17.5: Alert when quota exceeds threshold
- Req 26.5: Alert threshold configuration

## Dependencies

- None (standalone component)

## API Endpoint

- `GET /api/admin/calendar/quota`
  - Response:
    ```json
    {
      "current": 850,
      "limit": 1000,
      "percentage": 85,
      "resetAt": "2025-12-27T00:00:00Z",
      "timeUntilReset": "4 hours 30 minutes"
    }
    ```

## Quota Limits (Google Calendar API)

- **Free tier**: 1,000,000 queries/day
- **Per user**: 10,000 queries/day/user
- **Per 100 seconds**: 1,500 queries
- **Batch requests**: 50 requests/batch

Track quota in Redis or database:
```sql
CREATE TABLE calendar_api_quota (
  date date PRIMARY KEY,
  request_count int NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);
```

## Warning Severity Levels

| Quota Usage | Severity | Color  | Action |
|-------------|----------|--------|--------|
| 80-89%      | Low      | Yellow | Monitor |
| 90-94%      | Medium   | Orange | Throttle non-critical |
| 95-100%     | High     | Red    | Pause auto-sync |

## Component Layout

```
┌──────────────────────────────────────────────────┐
│ ⚠ API Quota Warning                              │
├──────────────────────────────────────────────────┤
│ Calendar API usage is at 85% (850/1000 requests) │
│                                                  │
│ Progress: ████████████████████░░░░ 85%           │
│                                                  │
│ Quota resets in: 4 hours 30 minutes             │
│                                                  │
│ Suggested Actions:                               │
│ • Delay non-critical bulk syncs                  │
│ • Temporarily disable auto-sync                  │
│ • Monitor usage in Google Cloud Console          │
│                                                  │
│ [View Quota Details →] [Dismiss]                │
└──────────────────────────────────────────────────┘
```

## Technical Notes

- Fetch quota every 5 minutes
- Cache quota data in React Query
- Store dismissal state in localStorage
- Show quota progress bar with gradient colors
- Calculate time until reset using timezone-aware date math
- Google Cloud Console link: `https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas`

## Quota Tracking Implementation

Increment quota counter on every Google Calendar API call:

```typescript
async function trackApiCall() {
  const today = new Date().toISOString().split('T')[0];
  await supabase.rpc('increment_quota', { date: today });
}
```

Database function:
```sql
CREATE OR REPLACE FUNCTION increment_quota(date date)
RETURNS void AS $$
BEGIN
  INSERT INTO calendar_api_quota (date, request_count)
  VALUES (date, 1)
  ON CONFLICT (date)
  DO UPDATE SET
    request_count = calendar_api_quota.request_count + 1,
    last_updated = now();
END;
$$ LANGUAGE plpgsql;
```

## Testing Checklist

- [ ] Warning visibility at different quota levels
- [ ] Progress bar display tests
- [ ] Time until reset calculation tests
- [ ] Dismissal functionality tests
- [ ] Link to Google Cloud Console tests
- [ ] Auto-hide when quota drops tests
- [ ] Color coding tests (yellow/orange/red)
- [ ] Mobile responsiveness tests
