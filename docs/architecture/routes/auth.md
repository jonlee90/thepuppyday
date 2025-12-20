# Authentication Routes - Architecture Documentation

> **Module**: Authentication Flows
> **Status**: ✅ Completed (Phase 1)
> **Base Path**: `(auth)/`
> **Authentication**: Redirects if already authenticated

## Overview

Authentication routes handle user login, registration, and password management using Supabase Auth with email/password provider.

---

## Routes

### 1. Login (`/login`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(auth)\login\page.tsx`

**Form Fields**:
- Email (required, validated)
- Password (required, min 6 characters)
- Remember Me checkbox

**Flow**:
1. User submits credentials
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. On success: Redirect to `returnTo` query param or `/dashboard`
4. On error: Display error message

**Error Handling**:
- Invalid credentials: "Invalid email or password"
- Account not activated: "Please check your email to activate your account"
- Network errors: "Unable to connect. Please try again."

---

### 2. Register (`/register`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(auth)\register\page.tsx`

**Form Fields**:
- First Name (required)
- Last Name (required)
- Email (required, unique check)
- Phone (optional, formatted)
- Password (required, min 8 chars, strength indicator)
- Confirm Password (required, must match)
- Terms acceptance checkbox

**Flow**:
1. Validate form data (Zod schema)
2. Create Supabase Auth user: `supabase.auth.signUp({ email, password })`
3. Create user profile in `users` table with role='customer'
4. Send verification email
5. Redirect to verification pending page

**Validation**:
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirmPassword: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

---

### 3. Forgot Password (`/forgot-password`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(auth)\forgot-password\page.tsx`

**Form Fields**:
- Email (required)

**Flow**:
1. User enters email
2. Call `supabase.auth.resetPasswordForEmail({ email })`
3. Display success message: "Password reset link sent to your email"
4. Email contains link to `/reset-password?token=xxx`

---

### 4. Reset Password (`/reset-password`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(auth)\reset-password\page.tsx`

**Form Fields**:
- New Password (required, strength validation)
- Confirm Password (required, must match)

**Flow**:
1. Extract reset token from URL
2. Verify token validity
3. User submits new password
4. Call `supabase.auth.updateUser({ password: newPassword })`
5. Redirect to `/login` with success message

---

## Layout (`layout.tsx`)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(auth)\layout.tsx`

**Design**:
```tsx
<div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7] flex items-center justify-center">
  <div className="w-full max-w-md px-4">
    <div className="text-center mb-8">
      <Logo className="h-16 mx-auto" />
      <h1 className="text-2xl font-semibold mt-4">Puppy Day</h1>
    </div>
    <div className="bg-white rounded-xl shadow-lg p-8">
      {children}
    </div>
  </div>
</div>
```

**Features**:
- Centered card design
- Logo and branding
- Gradient background matching brand
- Mobile-responsive

---

## Data Flow

### Login Flow
```
Client                    Supabase Auth              Users Table
  |                             |                         |
  |-- signInWithPassword ------>|                         |
  |                             |-- Verify credentials -->|
  |                             |                         |
  |<---- Auth Session ----------|                         |
  |                             |                         |
  |-- Fetch user profile -------|------------------------>|
  |<---- User data ---------------------------------|
  |                             |                         |
  |-- Redirect to /dashboard -->|                         |
```

### Registration Flow
```
Client                    Supabase Auth              Users Table
  |                             |                         |
  |-- signUp ------------------>|                         |
  |                             |-- Create auth user ---->|
  |<---- Auth User -------------|                         |
  |                             |                         |
  |-- Create profile in users table ---------------------->|
  |<---- Profile created -------------------------------|
  |                             |                         |
  |-- Send verification email ->|                         |
  |<---- Verification sent -----|                         |
```

---

## Security

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Recommended: Special character

### Email Verification
- New accounts require email verification before full access
- Verification link expires in 24 hours
- Can resend verification email

### Session Management
- Session cookies managed by Supabase Auth
- HttpOnly, Secure, SameSite=Lax
- 7-day session expiry (configurable)

### CSRF Protection
- Supabase Auth handles CSRF tokens
- Same-site cookie policy

---

## State Management

**Zustand Store**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\stores\auth-store.ts`

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}
```

**Persistence**:
- User data persisted to localStorage
- Rehydrates on page load
- Syncs with Supabase session

---

## Middleware Protection

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\middleware.ts`

**Auth Routes Behavior**:
```typescript
const authRoutes = ['/login', '/register', '/forgot-password'];

// If user is authenticated and tries to access auth routes, redirect to dashboard
if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

---

## API Endpoints

### POST `/api/auth/register`
Creates new customer account with profile data.

### POST `/api/auth/resend-verification`
Resends verification email to unverified users.

---

## Error Handling

### Common Errors
- **Invalid credentials**: Wrong email/password
- **Email already registered**: Duplicate account
- **Weak password**: Password doesn't meet requirements
- **Network error**: Supabase connection failure
- **Rate limit exceeded**: Too many attempts

### Error Display
```tsx
{error && (
  <Alert variant="error" className="mb-4">
    <AlertCircle className="w-5 h-5" />
    <span>{error}</span>
  </Alert>
)}
```

---

## Testing

### Unit Tests
```typescript
describe('Login Form', () => {
  it('validates email format', () => {
    const result = loginSchema.parse({ email: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('requires password', () => {
    const result = loginSchema.parse({ email: 'test@example.com' });
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests
- Test full login flow with mock Supabase
- Verify redirect after successful login
- Check error handling for invalid credentials

---

## Related Documentation

- [Middleware Protection](../security/middleware.md)
- [Supabase Auth](../services/supabase.md#authentication)
- [Auth Store](../state/auth-store.md)

---

**Last Updated**: 2025-12-20
