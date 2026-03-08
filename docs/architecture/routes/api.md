# API Routes - Architecture Documentation

> **Module**: API Routes
> **Status**: Core Complete
> **Base Path**: `/api/`
> **Framework**: Next.js 14+ App Router API Routes
> **Last Updated**: 2026-03-07

## Overview

RESTful API endpoints organized by domain. All routes follow consistent patterns for authentication, validation, error handling, and response formats.

---

## API Organization

```
src/app/api/
├── addons/                          # Public addon listing
├── appointments/                    # Public appointment creation
├── availability/                    # Public availability checking
├── auth/
│   └── debug/                       # Auth state debugging
├── banners/
│   └── [id]/
│       ├── click/                   # Banner click tracking
│       └── impression/              # Banner impression tracking
├── booking/
│   └── settings/                    # Public booking settings
├── breeds/                          # Public breed listing
├── cron/                            # Scheduled job handlers
│   ├── analytics-refresh/
│   ├── breed-reminders/
│   ├── calendar-webhook-renewal/
│   ├── notifications/
│   │   ├── reminders/
│   │   ├── retention/
│   │   └── retry/
│   └── waitlist-expiration/
├── customer/                        # Customer endpoints (session-auth)
│   ├── appointments/[id]/
│   └── preferences/notifications/
├── health/                          # Health check endpoint
├── pets/                            # Pet creation/listing
├── report-cards/[uuid]/             # Public report card by UUID
├── reviews/                         # Review submission
├── services/                        # Public service listing
├── track/[trackingId]/              # Email/notification tracking pixel
├── unsubscribe/                     # Unsubscribe handler
├── users/
│   └── guest/                       # Guest user creation
├── waitlist/                        # Public waitlist submission
├── webhooks/
│   ├── appointment-completed/       # Internal webhook for appointment completion
│   └── twilio/incoming/             # Twilio incoming SMS webhook
└── admin/                           # Admin-only endpoints (protected)
    ├── addons/
    ├── analytics/
    ├── appointments/
    ├── breeds/
    ├── calendar/
    ├── campaigns/
    ├── customers/
    ├── dashboard/
    ├── gallery/
    ├── groomers/
    ├── notifications/
    ├── report-cards/
    ├── services/
    ├── settings/
    ├── users/
    └── waitlist/
```

---

## Complete Route Reference

### Public Endpoints (No Auth)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/health` | GET | Health check with Supabase connectivity |
| `/api/services` | GET | Fetch active services with pricing |
| `/api/addons` | GET | Fetch active add-on services |
| `/api/breeds` | GET | Fetch breed list |
| `/api/availability` | GET | Check appointment availability by date/service |
| `/api/appointments` | POST | Create new appointment (customer booking) |
| `/api/pets` | GET, POST | List/create pets (authenticated) |
| `/api/waitlist` | POST | Add to waitlist for full slots |
| `/api/reviews` | POST | Submit a review |
| `/api/booking/settings` | GET | Fetch public booking configuration |
| `/api/users/guest` | POST | Create guest user for booking |
| `/api/report-cards/[uuid]` | GET | Fetch shared report card by public UUID |
| `/api/unsubscribe` | GET | Process unsubscribe via signed token |
| `/api/track/[trackingId]` | GET | Email/notification open tracking pixel |
| `/api/banners/[id]/click` | GET | Record banner click |
| `/api/banners/[id]/impression` | POST | Record banner impression |
| `/api/auth/debug` | GET | Debug auth state (development) |

### Customer Endpoints (Session Auth)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/customer/appointments/[id]` | DELETE | Cancel appointment |
| `/api/customer/preferences/notifications` | GET, PUT | Notification preferences |

### Webhook Endpoints

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/webhooks/appointment-completed` | POST | Internal hook for appointment completion flows |
| `/api/webhooks/twilio/incoming` | POST | Twilio incoming SMS handler |

### Cron Job Endpoints

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/cron/notifications/reminders` | GET, POST | Send appointment reminders |
| `/api/cron/notifications/retention` | GET, POST | Send retention/re-booking reminders |
| `/api/cron/notifications/retry` | GET, POST | Retry failed notifications |
| `/api/cron/analytics-refresh` | GET | Refresh analytics materialized views |
| `/api/cron/breed-reminders` | GET, POST | Breed-specific grooming reminders |
| `/api/cron/waitlist-expiration` | GET, POST | Expire old waitlist entries |
| `/api/cron/calendar-webhook-renewal` | GET, POST | Renew Google Calendar webhook subscriptions |

---

### Admin Endpoints (Admin/Groomer Auth Required)

#### Dashboard

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/dashboard/stats` | GET | Dashboard KPI stats |
| `/api/admin/dashboard/appointments` | GET | Today's appointments |
| `/api/admin/dashboard/pending-appointments` | GET | Pending appointments count |
| `/api/admin/dashboard/activity` | GET | Recent activity feed |

#### Appointments

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/appointments` | GET, POST | List/create appointments |
| `/api/admin/appointments/[id]` | GET, PUT | Get/update single appointment |
| `/api/admin/appointments/[id]/status` | POST | Update appointment status |
| `/api/admin/appointments/availability` | GET | Check admin availability |
| `/api/admin/appointments/complete-past` | POST | Bulk complete past appointments |
| `/api/admin/appointments/sync-status` | GET | Calendar sync status for appointments |
| `/api/admin/appointments/import` | POST | CSV bulk import |
| `/api/admin/appointments/import/validate` | POST | Validate CSV before import |
| `/api/admin/appointments/import/template` | GET | Download CSV import template |

#### Customers

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/customers` | GET | List customers with search/filters |
| `/api/admin/customers/[id]` | GET, PATCH | Get/update customer |
| `/api/admin/customers/[id]/pets` | GET | Get customer's pets |
| `/api/admin/customers/[id]/appointments` | GET | Get customer's appointments |
| `/api/admin/customers/[id]/flags` | POST | Add customer flag |
| `/api/admin/customers/[id]/flags/[flagId]` | PATCH, DELETE | Update/remove customer flag |

#### Services & Addons

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/services` | GET, POST | List/create services |
| `/api/admin/services/[id]` | GET, PATCH, DELETE | Service CRUD |
| `/api/admin/services/upload-image` | POST | Upload service image |
| `/api/admin/addons` | GET, POST | List/create addons |
| `/api/admin/addons/[id]` | GET, PATCH, DELETE | Addon CRUD |
| `/api/admin/breeds` | GET | List breeds |
| `/api/admin/groomers` | GET | List groomers |

#### Users

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/users` | GET | List all users with roles |

#### Gallery

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/gallery` | GET, POST | List/create gallery images |
| `/api/admin/gallery/[id]` | GET, PATCH, DELETE | Gallery image CRUD |
| `/api/admin/gallery/upload` | POST | Upload gallery image |

#### Campaigns

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/campaigns` | GET, POST | List/create campaigns |
| `/api/admin/campaigns/[id]/analytics` | GET | Campaign analytics |
| `/api/admin/campaigns/[id]/send` | POST | Send campaign |
| `/api/admin/campaigns/segment-preview` | POST | Preview campaign audience segment |

#### Report Cards

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/report-cards` | GET, POST | List/create report cards |
| `/api/admin/report-cards/[id]/send` | POST | Send report card to customer |
| `/api/admin/report-cards/upload` | POST | Upload report card photos |
| `/api/admin/report-cards/analytics` | GET | Report card metrics |

#### Waitlist

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/waitlist` | GET | List waitlist entries |
| `/api/admin/waitlist/[id]/book` | POST | Convert waitlist entry to appointment |
| `/api/admin/waitlist/match` | POST | Match waitlist entries to open slots |
| `/api/admin/waitlist/fill-slot` | POST | Fill slot from waitlist |

#### Notifications

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/notifications` | GET | List notifications |
| `/api/admin/notifications/dashboard` | GET | Notification metrics dashboard |
| `/api/admin/notifications/[id]/resend` | POST | Resend single notification |
| `/api/admin/notifications/bulk-resend` | POST | Bulk resend failed notifications |
| `/api/admin/notifications/log` | GET | Notification delivery log |
| `/api/admin/notifications/log/[id]` | GET | Single log entry detail |
| `/api/admin/notifications/log/[id]/resend` | POST | Resend from log |
| `/api/admin/notifications/settings` | GET | Get notification settings |
| `/api/admin/notifications/settings/[notification_type]` | PUT | Update setting by type |
| `/api/admin/notifications/templates` | GET | List notification templates |
| `/api/admin/notifications/templates/[id]` | GET, PUT | Get/update template |
| `/api/admin/notifications/templates/[id]/preview` | POST | Preview template with sample data |
| `/api/admin/notifications/templates/[id]/test` | POST | Send test notification |
| `/api/admin/notifications/templates/[id]/history` | GET | Template version history |
| `/api/admin/notifications/templates/[id]/rollback` | POST | Rollback to previous version |
| `/api/admin/notifications/jobs/reminders/trigger` | POST | Manually trigger reminders |
| `/api/admin/notifications/jobs/retention/trigger` | POST | Manually trigger retention |

#### Analytics

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/analytics/kpis` | GET | Key performance indicators |
| `/api/admin/analytics/charts/revenue` | GET | Revenue chart data |
| `/api/admin/analytics/charts/appointments-trend` | GET | Appointment trend data |
| `/api/admin/analytics/charts/services` | GET | Service popularity data |
| `/api/admin/analytics/charts/customers` | GET | Customer acquisition data |
| `/api/admin/analytics/charts/operations` | GET | Operational metrics |
| `/api/admin/analytics/groomers` | GET | Groomer performance |
| `/api/admin/analytics/marketing` | GET | Marketing analytics |
| `/api/admin/analytics/report-cards` | GET | Report card metrics |
| `/api/admin/analytics/waitlist` | GET | Waitlist analytics |

#### Settings

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/settings/site-content` | GET, PUT | Homepage & SEO content |
| `/api/admin/settings/site-content/upload` | POST | Upload hero images |
| `/api/admin/settings/banners` | GET, POST | Banner list/create |
| `/api/admin/settings/banners/[id]` | GET, PUT, PATCH, DELETE | Single banner CRUD |
| `/api/admin/settings/banners/[id]/analytics` | GET | Banner click analytics |
| `/api/admin/settings/banners/reorder` | PUT | Reorder banners |
| `/api/admin/settings/banners/upload` | POST | Upload banner images |
| `/api/admin/settings/booking` | GET, PUT | Booking configuration |
| `/api/admin/settings/booking/blocked-dates` | GET, POST, DELETE | Blocked dates management |
| `/api/admin/settings/business-hours` | PUT | Update business hours |
| `/api/admin/settings/loyalty` | GET, PUT | Loyalty program settings |
| `/api/admin/settings/loyalty/earning-rules` | GET, PUT | Points earning rules |
| `/api/admin/settings/loyalty/redemption-rules` | GET, PUT | Redemption rules |
| `/api/admin/settings/loyalty/referral` | GET, PUT | Referral program |
| `/api/admin/settings/staff` | GET, POST | Staff list/create |
| `/api/admin/settings/staff/[id]` | GET | Staff member detail |
| `/api/admin/settings/staff/[id]/commission` | GET, PUT | Commission settings |
| `/api/admin/settings/staff/earnings` | GET | Earnings reports |
| `/api/admin/settings/templates` | GET, PUT | Default templates |
| `/api/admin/settings/templates/reset` | POST | Reset templates to defaults |
| `/api/admin/settings/phase6` | GET, PUT | Phase 6 settings |

#### Calendar (Google Calendar Integration)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/calendar/auth/start` | POST | Start OAuth flow |
| `/api/admin/calendar/auth/callback` | GET | OAuth callback handler |
| `/api/admin/calendar/auth/disconnect` | POST | Disconnect calendar |
| `/api/admin/calendar/auth/service-account` | POST | Configure service account |
| `/api/admin/calendar/connection` | GET | Get connection status |
| `/api/admin/calendar/connection/resume` | POST | Resume paused auto-sync |
| `/api/admin/calendar/calendars` | GET | List available calendars |
| `/api/admin/calendar/settings` | GET, PUT | Calendar sync settings |
| `/api/admin/calendar/quota` | GET | API quota status |
| `/api/admin/calendar/webhook` | GET, POST | Calendar webhook handler |
| `/api/admin/calendar/import/preview` | POST | Preview calendar import |
| `/api/admin/calendar/import/confirm` | POST | Confirm calendar import |
| `/api/admin/calendar/sync/manual` | POST | Manual sync trigger |
| `/api/admin/calendar/sync/bulk` | POST | Bulk sync appointments |
| `/api/admin/calendar/sync/status` | GET | Overall sync status |
| `/api/admin/calendar/sync/errors` | GET | List failed sync operations |
| `/api/admin/calendar/sync/retry` | POST | Retry failed syncs |
| `/api/admin/calendar/sync/resync` | POST | Force resync appointments |
| `/api/admin/calendar/sync/queue-stats` | GET | Retry queue statistics |
| `/api/admin/calendar/sync/history/[appointmentId]` | GET | Sync history for appointment |

---

## Authentication Patterns

### 1. Public Endpoints
No authentication required (services, availability, breeds).

### 2. Customer Endpoints
Session-based authentication via `supabase.auth.getUser()`.

### 3. Admin Endpoints
Admin/groomer role required via `requireAdmin()` from `src/lib/admin/auth.ts`.

### 4. Admin + RLS Pattern (Two-Client)
For admin routes querying customer data:
1. Authenticate with `createServerSupabaseClient()` + `requireAdmin()`
2. Query data with `createServiceRoleClient()` to bypass RLS

**Variable Naming**: Two patterns exist (both valid):
- **Pattern A**: `authSupabase` (session) / `supabase` (service role) — used in `appointments/[id]`, `customers/[id]`, `report-cards`
- **Pattern B**: `supabase` (session) / `serviceClient` (service role) — used in `services/[id]`, `waitlist/[id]/book`, `complete-past`

**CRITICAL**: Never mix variable names across patterns. All DB queries must use the service role client, not the session client.

**Performance**: Parallelize independent queries with `Promise.all()`. Applied in:
- `customers/[id]` GET — pets, flags, loyalty, transactions fetched in parallel
- `services/[id]` GET — service + prices fetched in parallel
- `waitlist/[id]/book` POST — pet size + day's appointments fetched in parallel

**Security**: All admin endpoints MUST call `requireAdmin()`. The `waitlist/[id]/book` route was missing this check and was fixed.

---

## Error Handling

**Standard Error Response**:
```json
{
  "error": "Error message",
  "details": {}
}
```

**HTTP Status Codes**: 200 (Success), 201 (Created), 400 (Validation), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 429 (Rate Limited), 500 (Server Error)

---

## Related Documentation

- [Admin Auth Helper](../services/admin-auth.md)
- [Supabase Client](../services/supabase.md)
- [Admin Panel Routes](./admin-panel.md)
