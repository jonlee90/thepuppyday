# Task 0002: Implement admin middleware for route protection

**Group**: Foundation & Auth (Week 1)

## Objective
Create Next.js middleware for auth and role verification on `/admin/*` routes

## Files to create/modify
- `src/middleware.ts` - Update middleware for admin route protection
- `src/lib/admin/auth.ts` - Admin auth helper functions

## Requirements covered
- REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5, REQ-1.6, REQ-1.7
- REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-2.6, REQ-2.7

## Acceptance criteria
- [x] Middleware verifies session before rendering admin pages
- [x] Missing/invalid session redirects to `/login` with return URL
- [x] Staff role granted access to operational features
- [x] Owner role granted access to all features including configuration
- [x] Customer role redirects to `/dashboard` with error
- [x] Role verified from database, not client storage
- [x] 403 returned for unauthorized API requests

## Implementation Notes
- Implemented in `middleware.ts` with admin route and API protection
- Created `src/lib/admin/auth.ts` with helper functions:
  - `getAuthenticatedAdmin()`: Server-side auth verification
  - `isAdminOrStaff()`, `isOwner()`, `isStaff()`: Role checking
  - `requireAdmin()`, `requireOwner()`: API route protection
- Middleware matcher explicitly includes `/api/admin/:path*`
- Error handling for database queries with appropriate status codes
- Completed: 2025-12-11
