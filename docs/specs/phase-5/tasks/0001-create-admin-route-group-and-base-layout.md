# Task 0001: Create admin route group and base layout

**Group**: Foundation & Auth (Week 1)

## Objective
Set up the `/admin` route group with server-side layout

## Files to create/modify
- `src/app/(admin)/layout.tsx` - Root admin layout with auth verification
- `src/app/(admin)/loading.tsx` - Admin loading skeleton

## Requirements covered
- REQ-3.1, REQ-3.2, REQ-3.3

## Acceptance criteria
- [x] Server component verifies session exists before rendering
- [x] Verifies user role is 'staff' or 'owner' from database
- [x] Redirects non-authenticated users to `/login` with return URL
- [x] Redirects non-admin users to `/dashboard` with error message
- [x] Background color #F8EEE5 applied to layout

## Implementation Notes
- Implemented in `src/app/admin/layout.tsx` as async Server Component
- Uses `getAuthenticatedAdmin()` for server-side auth verification
- Redirects via Next.js `redirect()` function
- Includes AdminSidebar, AdminMobileNav, and Toaster components
- Completed: 2025-12-11
