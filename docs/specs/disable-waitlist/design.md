# Disable Waitlist Feature - Design Document

## Overview

Disable and hide all waitlist features from UI and API surfaces using a centralized feature flag, while keeping all code intact for potential re-enablement.

## Feature Flag

**Location**: `src/lib/config.ts`
**Config path**: `config.features.waitlistEnabled`
**Env var**: `NEXT_PUBLIC_WAITLIST_ENABLED` (defaults to `false`)

To re-enable: set `NEXT_PUBLIC_WAITLIST_ENABLED=true` in `.env.local` or deployment environment.

## API Guard

**Location**: `src/lib/waitlist-guard.ts`
**Function**: `waitlistDisabledResponse()` - returns a 404 JSON response when waitlist is disabled, or `null` when enabled.

## Changes Made

### UI Components (8 files)
| File | Change |
|---|---|
| `AdminSidebar.tsx` | Filter out "Waitlist" nav item |
| `AdminMobileNav.tsx` | Filter out "Waitlist" nav item |
| `TabletSidebar.tsx` | Filter out "Waitlist" nav item |
| `MobileBottomTabs.tsx` | Filter out "waitlist" tab |
| `admin/waitlist/page.tsx` | Redirect to `/admin/dashboard` |
| `DashboardClient.tsx` | Conditionally render `<WaitlistWidget>` |
| `DateTimeStep.tsx` | Pass `onJoinWaitlist={undefined}`, hide `<WaitlistModal>` |
| `AppointmentCalendar.tsx` | Skip waitlist count fetch |

### Analytics (3 files)
| File | Change |
|---|---|
| `AnalyticsDashboard.tsx` | Hide Waitlist Performance section |
| `KPIGrid.tsx` | Hide `waitlist_fill_rate` KPI card |
| `ExportMenu.tsx` | Hide waitlist CSV export option |

### Settings (1 file)
| File | Change |
|---|---|
| `SettingsClient.tsx` | Filter out `'waitlist'` tab |

### API Routes (9 files)
All return 404 via `waitlistDisabledResponse()`:
- `api/waitlist/route.ts`
- `api/admin/waitlist/route.ts`
- `api/admin/waitlist/[id]/route.ts`
- `api/admin/waitlist/[id]/book/route.ts`
- `api/admin/waitlist/[id]/cancel/route.ts`
- `api/admin/waitlist/fill-slot/route.ts`
- `api/admin/waitlist/match/route.ts`
- `api/cron/waitlist-expiration/route.ts`
- `api/admin/analytics/waitlist/route.ts`

### Supporting Integrations (2 files)
| File | Change |
|---|---|
| `api/availability/route.ts` | Skip waitlist count query, return raw slots |
| `api/webhooks/twilio/incoming/route.ts` | Skip `handleWaitlistResponse()`, return generic reply |

## Preserved (No Changes)
- Database tables and RLS policies
- `TimeSlotGrid.tsx` (already guards via `onJoinWaitlist` prop)
- Type definitions and constants
- All waitlist component/lib code (dormant but intact)
