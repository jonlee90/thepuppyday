# Authentication Routes - Architecture Documentation

> **Module**: Authentication Flows
> **Status**: Completed (Phase 1)
> **Base Path**: `(auth)/`
> **Authentication**: Redirects if already authenticated
> **Last Updated**: 2026-05-03

## Overview

Authentication routes handle user login, registration, and password management using Supabase Auth with email/password provider. All auth pages are client components that use the `useAuth` hook for Supabase interactions.

---

## Route Structure

```
src/app/(auth)/
├── layout.tsx              # Auth layout with header, gradient bg, footer
├── loading.tsx             # Auth page loading skeleton
├── error.tsx               # Auth error boundary
├── login/
│   └── page.tsx            # Login page (/login)
├── register/
│   └── page.tsx            # Registration page (/register)
├── forgot-password/
│   └── page.tsx            # Forgot password (/forgot-password)
└── reset-password/
    └── page.tsx            # Reset password (/reset-password)
```

### Route Group Behavior

The `(auth)` directory is a route group that does NOT create a URL segment. Routes are `/login`, `/register`, etc. (not `/auth/login`).

---

## Routes

### 1. Login (`/login`)
**File**: `src/app/(auth)/login/page.tsx`

Client component using `useAuth().signIn` and `react-hook-form` with Zod validation.

**Form Fields**:
- Email (required, validated)
- Password (required)

**Flow**:
1. User submits credentials
2. Call `signIn()` from `useAuth` hook (wraps `supabase.auth.signInWithPassword`)
3. On success: Redirect to `returnTo` query param or `/dashboard`
4. On error: Display inline error message

---

### 2. Register (`/register`)
**File**: `src/app/(auth)/register/page.tsx`

Client component using `useAuth().signUp` and `react-hook-form` with Zod validation.

**Form Fields**:
- First Name (required)
- Last Name (required)
- Email (required)
- Phone (optional)
- Password (required, strength validation)
- Confirm Password (required, must match)

**Flow**:
1. Validate form data via `registerSchema`
2. Call `signUp()` from `useAuth` hook (wraps `supabase.auth.signUp`)
3. Creates Supabase Auth user and `users` table profile with `role='customer'`
4. Redirect on success

---

### 3. Forgot Password (`/forgot-password`)
**File**: `src/app/(auth)/forgot-password/page.tsx`

**Form Fields**: Email (required)

**Flow**:
1. User enters email
2. Call `supabase.auth.resetPasswordForEmail()`
3. Display success message with instructions to check email

---

### 4. Reset Password (`/reset-password`)
**File**: `src/app/(auth)/reset-password/page.tsx`

**Form Fields**: New Password, Confirm Password

**Flow**:
1. Extract reset token from URL
2. User submits new password
3. Call `supabase.auth.updateUser({ password })`
4. Redirect to `/login` with success message

---

### 5. Auth Diagnostic (`/test-auth`)
**File**: `src/app/test-auth/page.tsx`

A development-only diagnostic page for verifying Supabase auth wiring (connection, session, PKCE flow). Lives **outside** the `(auth)` group so it does not pick up the auth layout.

**Status**: Diagnostic / development. Not linked from the production UI. Should be removed or gated behind an env flag before public launch — currently reachable in production at `/test-auth`.

---

## Layout (`layout.tsx`)

**File**: `src/app/(auth)/layout.tsx`

Server component that fetches business info for the footer.

**Structure**:
```tsx
<div className="min-h-screen flex flex-col">
  <header>  {/* White header with logo + "Back to Home" link */} </header>
  <main>    {/* Gradient bg, centered max-w-md card */}
    {children}
  </main>
  <Footer businessInfo={businessInfo} />
</div>
```

**Features**:
- Logo linking to homepage
- "Back to Home" navigation link
- Gradient background (`from-[#F8EEE5] via-[#FFFBF7] to-[#EAE0D5]`)
- Marketing footer for brand consistency

---

## Error & Loading States

**Error Boundary** (`error.tsx`): Catches errors during auth flows with retry option.

**Loading State** (`loading.tsx`): Skeleton card matching the auth form layout.

---

## API Endpoints

The auth flow uses Supabase client-side SDK directly (no custom API routes for registration or verification).

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/callback` | GET | PKCE code exchange — handles password reset links (→ `/reset-password`) and email confirmation links (→ `/dashboard`) |
| `/api/auth/debug` | GET | Debug auth state (session, user, role) — development only |

---

## Security

### Password Requirements
Enforced by Zod schema (`src/lib/validations/auth.ts`):
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### Session Management
- Session cookies managed by Supabase Auth
- HttpOnly, Secure, SameSite=Lax

### Middleware Protection
**File**: `middleware.ts`

Authenticated users accessing auth routes (`/login`, `/register`, `/forgot-password`) are redirected to `/dashboard`.

---

## State Management

**Auth Hook** (`src/hooks/use-auth.ts`): Provides `signIn`, `signUp`, `signOut`, `user`, `isLoading`, `isAuthenticated`.

---

## Related Documentation

- [Customer Portal](./customer-portal.md)
- [Admin Panel](./admin-panel.md)
- [Supabase Auth](../services/supabase.md#authentication)
