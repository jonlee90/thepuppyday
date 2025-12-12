# Task 0010: Set up Supabase Realtime subscriptions for dashboard

**Group**: Dashboard (Week 2)

## Objective
Implement real-time updates for dashboard widgets

## Files to create/modify
- `src/hooks/admin/use-dashboard-realtime.ts` - Dashboard realtime hook

## Requirements covered
- REQ-30.1, REQ-30.2, REQ-30.3, REQ-30.4, REQ-30.7, REQ-30.8, REQ-30.9, REQ-30.10

## Acceptance criteria
- [x] Subscribe to appointments table for today's date range
- [x] INSERT events add appointment to list and increment stats
- [x] UPDATE events update card and recalculate stats
- [x] DELETE/cancel events remove from list and decrement stats
- [x] Fallback to 30-second polling on subscription failure
- [x] Unsubscribe on component unmount
- [x] "Connection lost" banner on network disconnect

## Implementation Notes
**Completed**: 2025-12-12

**Files Implemented**:
- `src/hooks/admin/use-dashboard-realtime.ts` - Dashboard realtime hook
- `src/app/admin/dashboard/DashboardClient.tsx` - Integration with realtime hook

**Key Features**:
- ✅ Supabase Realtime subscription to `appointments` table
- ✅ Timezone-aware filter: `scheduled_at >= todayStart AND < todayEnd`
- ✅ Listens to all events (`INSERT`, `UPDATE`, `DELETE`) via `event: '*'`
- ✅ Refetches stats and appointments on any change
- ✅ 30-second polling fallback on connection failure
- ✅ Mock mode support: automatically uses polling when `NEXT_PUBLIC_USE_MOCKS=true`
- ✅ Proper cleanup: unsubscribes and clears intervals on unmount
- ✅ Connection status tracking: `isConnected`, `isPolling`
- ✅ Status banners:
  - Green "Real-time updates active" when connected
  - Yellow "Connection lost - using fallback polling" on disconnect
  - Initial error banner for failed data fetching

**Realtime Channel Configuration**:
```typescript
supabase
  .channel('dashboard-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'appointments',
    filter: `scheduled_at=gte.${todayStart},scheduled_at=lt.${todayEnd}`
  }, (payload) => {
    fetchStats();
    fetchAppointments();
  })
  .subscribe()
```

**Critical Fixes Applied**:
- Fixed memory leak: moved `pollTimer` cleanup to useEffect return
- Fixed type assertion for mock client compatibility (`supabase as any`)
- Proper interval management to prevent multiple polling timers
