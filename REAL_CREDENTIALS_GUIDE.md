# Using Real Credentials - Registration Guide

## Current Status

- **Mock Mode**: DISABLED (`NEXT_PUBLIC_USE_MOCKS=false`)
- **Supabase**: Connected to real database
- **Trigger**: Auto-creates `public.users` record on signup
- **RLS Policies**: Enabled and configured

## Registration Flow

### How It Works

When a user registers via `/register`:

1. **Form Submission** → Calls `signUp()` from `useAuth()` hook
2. **Supabase Auth** → Creates user in `auth.users` table
3. **Trigger Fires** → `handle_new_user()` function automatically creates record in `public.users`
4. **User Data** → Includes first name, last name, email, phone, and role (defaults to 'customer')
5. **Redirect** → User is logged in and redirected to `/dashboard`

### Database Tables

#### `auth.users` (Supabase Auth)
- Managed by Supabase Auth
- Stores email, hashed password, user metadata
- Automatically created on signup

#### `public.users` (Application Data)
- Created via trigger from `auth.users`
- Contains: id, email, first_name, last_name, phone, role, avatar_url, preferences
- Protected by Row Level Security (RLS)

## Registering a New User

### Via Web Interface (Recommended)

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to registration page**:
   ```
   http://localhost:3000/register
   ```

3. **Fill in the form**:
   - First Name: e.g., "John"
   - Last Name: e.g., "Doe"
   - Email: e.g., "john.doe@example.com"
   - Phone (optional): e.g., "+1 (555) 123-4567"
   - Password: Must meet requirements below
   - Confirm Password: Must match

4. **Password Requirements**:
   - At least 8 characters
   - At least one uppercase letter (A-Z)
   - At least one lowercase letter (a-z)
   - At least one number (0-9)

   Example valid passwords: `MyDog123`, `Fluffy2024`, `Grooming99`

5. **Submit the form**
   - Click "Create Account" button
   - Wait for processing
   - You'll be automatically logged in and redirected to `/dashboard`

### Testing Login

After registering, test login at:
```
http://localhost:3000/login
```

Use the email and password you just created.

## Verifying Registration Works

### Option 1: Run Verification Script

```bash
node scripts/verify-registration.js
```

This will check:
- Trigger function exists
- RLS policies are configured
- List existing users

### Option 2: Manual Database Check

If you have direct database access, you can verify:

```sql
-- Check auth users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Check public users (should match auth users)
SELECT id, email, first_name, last_name, role, created_at
FROM public.users
ORDER BY created_at DESC;
```

## Demo/Seed Users

### Existing Demo Accounts

The `scripts/seed-test-users.js` script creates demo accounts, but it does NOT run automatically.

To create demo accounts manually:
```bash
node scripts/seed-test-users.js
```

This creates:
- **Admin**: admin@thepuppyday.com / admin123
- **Customer 1**: demo@example.com / password123
- **Customer 2**: sarah@example.com / password123

**Note**: These are optional. You can use the app without running this script.

### Removing Demo Dependencies

The app is already configured to work without demo data:

1. **Mock mode is disabled** in `.env.local`
2. **Seed script doesn't auto-run** - it's manual only
3. **Registration creates real users** in Supabase

## Troubleshooting

### "User already exists" Error

If you try to register with an email that's already taken:
- Choose a different email
- Or delete the existing user from Supabase dashboard

### "Invalid password" Error

Password doesn't meet requirements. Ensure:
- At least 8 characters
- Contains uppercase, lowercase, and number

### User Created in auth.users but not public.users

This means the trigger isn't working. Verify:

1. Check if migration was applied:
   ```bash
   # Check Supabase dashboard > Database > Functions
   # Look for: handle_new_user()
   ```

2. Manually apply migration:
   ```bash
   node scripts/apply-migration.js supabase/migrations/20241211_create_user_on_signup.sql
   ```

### Can't Access Dashboard After Registration

Check middleware configuration:
- File: `src/middleware.ts`
- Ensures authenticated users can access `/dashboard`
- Redirects unauthenticated users to `/login`

## Next Steps After Registration

Once registered and logged in:

1. **Dashboard** (`/dashboard`)
   - View upcoming appointments
   - Quick actions (book, manage pets)

2. **Book Appointment** (`/book`)
   - Add a pet first, then book grooming

3. **Manage Pets** (`/pets`)
   - Add your dogs
   - Track grooming history

4. **Profile** (`/profile`)
   - Update personal information
   - Change password

## Development vs Production

### Current Setup (Development)

- `.env.local` with Supabase credentials
- Real Supabase database (not mock)
- Can register real users
- Data persists in Supabase

### For Production

Before deploying:

1. Update environment variables on hosting platform (Vercel, etc.)
2. Ensure Supabase production project is configured
3. Apply all migrations to production database
4. Configure email confirmation (currently disabled for dev)

## Password Validation Schema

From `src/lib/validations/auth.ts`:

```typescript
password: z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )
```

## Quick Reference

| Action | URL | Method |
|--------|-----|--------|
| Register | http://localhost:3000/register | Web Form |
| Login | http://localhost:3000/login | Web Form |
| Dashboard | http://localhost:3000/dashboard | Protected Route |
| Verify Setup | `node scripts/verify-registration.js` | CLI |
| Create Demo Users | `node scripts/seed-test-users.js` | CLI |

## Security Notes

- All passwords are hashed by Supabase Auth
- RLS policies protect user data
- Users can only see/edit their own data
- Admins have full access to all users
- Email confirmation is disabled in dev (auto-confirmed)
- Phone number is optional

## Support

If you encounter issues:

1. Check browser console for errors
2. Check server logs (terminal running `npm run dev`)
3. Verify Supabase credentials in `.env.local`
4. Run verification script: `node scripts/verify-registration.js`
5. Check Supabase dashboard for user records
