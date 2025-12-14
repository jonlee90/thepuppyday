# Authentication Quick Reference

## Environment Setup

### Development (Mock Mode)
```bash
# .env.local
NEXT_PUBLIC_USE_MOCKS=true
```

### Production (Real Supabase)
```bash
# .env.local
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_SUPABASE_URL=https://jajbtwgbhrkvgxvvruaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Quick Test Login Credentials (Mock Mode)

```
Admin:
- Email: admin@thepuppyday.com
- Password: <any>

Customer:
- Email: demo@example.com
- Password: <any>
```

## Common Code Snippets

### Using Auth in Components
```tsx
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome, {user?.first_name}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Server-Side Auth
```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function MyServerComponent() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <div>Welcome {user.email}</div>;
}
```

### Protected API Route
```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your protected logic here
  return NextResponse.json({ data: 'success' });
}
```

## Routes

### Public Routes
- `/` - Home
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form (via email link)

### Protected Routes (Customer)
- `/dashboard` - Customer dashboard
- `/appointments` - Appointments management
- `/pets` - Pet profiles
- `/profile` - User profile
- `/loyalty` - Loyalty program
- `/membership` - Membership management
- `/report-cards` - Grooming report cards

### Protected Routes (Admin)
- `/admin/*` - Admin panel (requires admin role)

## Middleware Behavior

| User State | Accessing | Result |
|------------|-----------|--------|
| Not logged in | `/dashboard` | Redirect to `/login?returnTo=/dashboard` |
| Logged in (customer) | `/dashboard` | ✅ Access granted |
| Logged in | `/login` | Redirect to `/dashboard` |
| Logged in (customer) | `/admin` | Redirect to `/dashboard` |
| Logged in (admin) | `/admin` | ✅ Access granted |

## Database Schema

### users table
```sql
id: uuid (primary key, matches auth.users.id)
email: text (unique)
first_name: text
last_name: text
phone: text (nullable)
role: 'customer' | 'admin' | 'groomer'
avatar_url: text (nullable)
preferences: jsonb
created_at: timestamp
updated_at: timestamp
```

## Debugging

### Check Auth State
```tsx
import { useAuthStore } from '@/stores/auth-store';

// In component or DevTools console
const authState = useAuthStore.getState();
console.log('User:', authState.user);
console.log('Is Authenticated:', authState.isAuthenticated);
```

### Check Supabase Session
```tsx
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### Clear Auth State
```tsx
// Clear Zustand store
localStorage.removeItem('auth-storage');

// Clear Supabase session
const supabase = createClient();
await supabase.auth.signOut();

// Clear all localStorage
localStorage.clear();
```

## Common Issues

### Issue: "User already exists"
**Solution:** Use different email or clear localStorage

### Issue: Infinite redirect loop
**Solution:** Clear cookies and localStorage, restart dev server

### Issue: Session not persisting
**Solution:** Check browser cookies are enabled, verify `auth-storage` in localStorage

### Issue: RLS blocking access
**Solution:** Verify migrations are applied, check user role in database

## Run Migrations (Production Setup)

```bash
# From project root
cd supabase

# Apply migrations
npx supabase db push

# Or apply specific migration
npx supabase migration up 20241211_create_user_on_signup
npx supabase migration up 20241211_users_rls_policies
```

## Test Checklist

- [ ] Register new user
- [ ] Login with credentials
- [ ] Access protected route
- [ ] Request password reset
- [ ] Complete password reset (real Supabase only)
- [ ] Logout
- [ ] Middleware redirects work
- [ ] Admin routes protected
- [ ] Session persists on refresh

## Links

- [Full Testing Guide](./AUTHENTICATION_TESTING_GUIDE.md)
- [Audit Report](./AUTHENTICATION_AUDIT_REPORT.md)
- [Supabase Documentation](https://supabase.com/docs/guides/auth)
