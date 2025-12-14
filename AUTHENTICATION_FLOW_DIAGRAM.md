# Authentication Flow Diagrams

## Complete Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ Auth Pages   │      │  useAuth()   │      │  Auth Store  │  │
│  │              │─────▶│   Hook       │─────▶│  (Zustand)   │  │
│  │ /login       │      │              │      │              │  │
│  │ /register    │      │ - signIn()   │      │ - user       │  │
│  │ /forgot-pw   │      │ - signUp()   │      │ - isLoading  │  │
│  │ /reset-pw    │      │ - signOut()  │      │ - isAuth     │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│         │                      │                      │         │
│         │                      │                      │         │
│         └──────────────────────┼──────────────────────┘         │
│                                │                                │
│                                ▼                                │
│                    ┌───────────────────────┐                    │
│                    │  Supabase Client      │                    │
│                    │  (client.ts)          │                    │
│                    │                       │                    │
│                    │  Mock or Real Based   │                    │
│                    │  on NEXT_PUBLIC_      │                    │
│                    │  USE_MOCKS flag       │                    │
│                    └───────────────────────┘                    │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                                 │ HTTP Requests
                                 │ (REST/GraphQL)
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                                ▼                                │
│                      MIDDLEWARE (Edge)                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  src/middleware.ts                                      │   │
│  │                                                         │   │
│  │  1. Refresh session token                              │   │
│  │  2. Get user from Supabase Auth                        │   │
│  │  3. Check route protection:                            │   │
│  │     - Public routes: Allow                             │   │
│  │     - Auth pages + logged in: Redirect to /dashboard  │   │
│  │     - Protected routes + logged out: Redirect to /login│   │
│  │     - Admin routes: Check user role                    │   │
│  │  4. Set/update cookies                                 │   │
│  │  5. Allow or redirect request                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                                ▼                                │
│                    SUPABASE BACKEND                             │
│                                                                 │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  auth.users      │        │  public.users    │              │
│  │                  │        │                  │              │
│  │  - id (uuid)     │◀───┐   │  - id (uuid)     │              │
│  │  - email         │    │   │  - email         │              │
│  │  - encrypted_pw  │    │   │  - first_name    │              │
│  │  - created_at    │    │   │  - last_name     │              │
│  │  - user_metadata │    │   │  - phone         │              │
│  │                  │    │   │  - role          │              │
│  └──────────────────┘    │   │  - avatar_url    │              │
│           │              │   │  - preferences   │              │
│           │              │   └──────────────────┘              │
│           │              │            │                        │
│           │              │            │                        │
│           ▼              │            ▼                        │
│  ┌──────────────────────────────────────────────────┐         │
│  │  TRIGGER: on_auth_user_created                   │         │
│  │                                                  │         │
│  │  WHEN: New user signs up in auth.users          │         │
│  │  DO: Call handle_new_user() function            │         │
│  │      Creates record in public.users with:       │         │
│  │      - Same ID as auth.users.id                 │         │
│  │      - Extract metadata from user_metadata      │         │
│  │      - Set default role to 'customer'           │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │  RLS POLICIES on public.users                    │         │
│  │                                                  │         │
│  │  1. Users can view own profile                   │         │
│  │     USING: auth.uid() = id                       │         │
│  │                                                  │         │
│  │  2. Users can update own profile                 │         │
│  │     USING: auth.uid() = id                       │         │
│  │                                                  │         │
│  │  3. Admins have full access                      │         │
│  │     USING: user.role = 'admin'                   │         │
│  │                                                  │         │
│  │  4. Enable insert for authentication             │         │
│  │     WITH CHECK: true (for trigger)               │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Registration Flow

```
User fills form      Submit form         Create auth user      Trigger fires
on /register    ──▶  useAuth.signUp() ──▶ Supabase Auth   ──▶  handle_new_user()
                                              │                      │
                                              │                      ▼
                                              │              Create public.users
                                              │              record with metadata
                                              │                      │
                                              ▼                      │
                                         Return user ◀───────────────┘
                                         & session
                                              │
                                              ▼
                                      Store in Zustand
                                              │
                                              ▼
                                    Redirect to /dashboard
```

## Login Flow

```
User enters          Submit form         Verify credentials    Fetch user data
credentials     ──▶  useAuth.signIn() ──▶ Supabase Auth    ──▶ from public.users
on /login                                      │                     │
                                               │                     │
                                               ▼                     │
                                        Create session              │
                                        Set cookies                 │
                                               │                     │
                                               ▼                     │
                                        Return session ◀─────────────┘
                                               │
                                               ▼
                                       Store user in Zustand
                                               │
                                               ▼
                                       Redirect to returnTo
                                       or /dashboard
```

## Password Reset Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    FORGOT PASSWORD                               │
└──────────────────────────────────────────────────────────────────┘

User enters email    Submit form          Send reset email
on /forgot-password ─▶ resetPassword() ──▶ Supabase Auth
                                                │
                                                │
                                                ▼
                                        Email sent with link:
                                        /reset-password?token=xyz

┌──────────────────────────────────────────────────────────────────┐
│                    RESET PASSWORD                                │
└──────────────────────────────────────────────────────────────────┘

User clicks link    Verify token         User enters new      Update password
in email       ──▶  in /reset-password ─▶ password and    ──▶ via Supabase
                                          submits form           Auth API
                                                │                   │
                                                │                   │
                                                │                   ▼
                                                │            Password updated
                                                │                   │
                                                │                   │
                                                └───────────────────▼
                                                        Redirect to /login
```

## Middleware Protection Flow

```
Request to             Middleware            Check auth           Route decision
any route        ──▶   intercepts       ──▶  status          ──▶  Allow or Redirect
     │                      │                     │
     │                      │                     │
     ▼                      ▼                     ▼

Route: /                 Refresh           Not authenticated
(Public)                 session           ──▶ ALLOW ACCESS
     │
     └──────────────────────────────────────────────────────────▶

Route: /dashboard        Get user          Not authenticated
(Protected)              from session      ──▶ REDIRECT to /login?returnTo=/dashboard
     │                                              │
     │                                              │
     │                                     Authenticated
     │                                     ──▶ ALLOW ACCESS
     │
     └──────────────────────────────────────────────────────────▶

Route: /login            Get user          Authenticated
(Auth page)              from session      ──▶ REDIRECT to /dashboard
     │                                              │
     │                                              │
     │                                     Not authenticated
     │                                     ──▶ ALLOW ACCESS
     │
     └──────────────────────────────────────────────────────────▶

Route: /admin            Get user &        Not authenticated
(Admin only)             check role        ──▶ REDIRECT to /login
     │                       │                      │
     │                       │                      │
     │                       │              Authenticated + customer role
     │                       │              ──▶ REDIRECT to /dashboard
     │                       │                      │
     │                       │                      │
     │                       │              Authenticated + admin role
     │                       │              ──▶ ALLOW ACCESS
     │                       │
     └───────────────────────┴──────────────────────────────────▶
```

## Session Management

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE                        │
└─────────────────────────────────────────────────────────────┘

User logs in
     │
     ▼
Supabase creates session
     │
     ├─────▶ Access token (JWT) ────▶ Stored in HTTP-only cookie
     │                                (Secure, SameSite=Lax)
     │
     ├─────▶ Refresh token ─────────▶ Stored in HTTP-only cookie
     │
     └─────▶ User metadata ─────────▶ Stored in Zustand
                                      (Persisted to localStorage)

Every request:
     │
     ▼
Middleware checks access token
     │
     ├─────▶ Valid? ────────────────▶ Continue request
     │
     └─────▶ Expired? ──────────────▶ Use refresh token
                                      to get new access token
                                           │
                                           ▼
                                      Update cookies
                                           │
                                           ▼
                                      Continue request

User logs out:
     │
     ▼
Clear all cookies
     │
     ▼
Clear Zustand store
     │
     ▼
Redirect to /login
```

## Mock vs Real Supabase

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT (Mock)                       │
└─────────────────────────────────────────────────────────────┘

NEXT_PUBLIC_USE_MOCKS=true
     │
     ▼
createClient() returns MockSupabaseClient
     │
     ├─────▶ Auth operations ───────▶ In-memory store
     │                                (localStorage)
     │
     ├─────▶ Database queries ──────▶ Mock data from seed.ts
     │
     └─────▶ Storage operations ────▶ Console logs only

┌─────────────────────────────────────────────────────────────┐
│                  PRODUCTION (Real Supabase)                 │
└─────────────────────────────────────────────────────────────┘

NEXT_PUBLIC_USE_MOCKS=false
     │
     ▼
createClient() returns SupabaseClient
     │
     ├─────▶ Auth operations ───────▶ Supabase Auth API
     │                                (PostgreSQL + GoTrue)
     │
     ├─────▶ Database queries ──────▶ PostgreSQL with RLS
     │
     └─────▶ Storage operations ────▶ Supabase Storage
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: CLIENT-SIDE
├─ Form validation (Zod schemas)
├─ Input sanitization (React escaping)
└─ UI-based role checks (hide admin links for customers)

Layer 2: MIDDLEWARE
├─ Session validation
├─ Route protection
├─ Role-based access control
└─ Token refresh

Layer 3: SUPABASE AUTH
├─ Password hashing (bcrypt)
├─ Session token generation (JWT)
├─ Rate limiting
└─ CSRF protection

Layer 4: ROW LEVEL SECURITY
├─ Database-level access control
├─ User can only access own data
├─ Admin role grants full access
└─ Policies enforced on every query

Layer 5: API ROUTES (Future)
├─ Server-side auth checks
├─ Input validation
├─ Business logic validation
└─ Audit logging
```

## Component Tree with Auth

```
App
├─ RootLayout
│  └─ AuthProvider ◀──────────── Initializes auth state
│     │                          Shows loading on protected routes
│     │
│     ├─ PublicLayout (/)
│     │  ├─ HomePage            No auth required
│     │  ├─ LoginPage           Redirects if logged in
│     │  └─ RegisterPage        Redirects if logged in
│     │
│     ├─ CustomerLayout (/dashboard)
│     │  │                      useAuth() provides user data
│     │  │
│     │  ├─ DashboardPage       Requires: isAuthenticated
│     │  ├─ AppointmentsPage    Requires: isAuthenticated
│     │  └─ PetsPage            Requires: isAuthenticated
│     │
│     └─ AdminLayout (/admin)
│        │                      useAuth() provides user data
│        │
│        ├─ AdminDashboard      Requires: user.role === 'admin'
│        └─ UserManagement      Requires: user.role === 'admin'
│
└─ Middleware runs before any page render
   └─ Redirects handled at edge
```
