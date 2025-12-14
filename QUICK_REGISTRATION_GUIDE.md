# Quick Registration Guide

## TL;DR - Get Started in 3 Steps

### Step 1: Apply Database Trigger (ONE TIME ONLY)

Go to your Supabase Dashboard SQL Editor:
```
https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa/editor
```

Run this SQL (copy/paste from `supabase/migrations/20241211_create_user_on_signup.sql`):

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, first_name, last_name, phone, role,
    avatar_url, preferences, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->'preferences', '{}'::jsonb),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 2: Start Dev Server

```bash
npm run dev
```

### Step 3: Register Your Account

Visit: http://localhost:3000/register

Fill in:
- First Name: Your first name
- Last Name: Your last name
- Email: your.email@example.com
- Password: MustHave1Uppercase (8+ chars, uppercase, lowercase, number)
- Confirm Password: Same as above

Click "Create Account" and you're in!

## That's It!

You now have a real account that:
- Is stored in Supabase (not mock data)
- Can login at `/login`
- Has access to `/dashboard`
- Can book appointments, manage pets, etc.

## Testing the Flow

Want to verify it works programmatically first?

```bash
node scripts/test-register-user.js
```

This creates a test account and verifies the trigger works.

## Current Status

- **Mock Mode**: Disabled ✅
- **Real Database**: Connected ✅
- **Seed Scripts**: Do NOT auto-run ✅
- **Your Real Account**: jonlee213@gmail.com exists ✅
- **Demo Accounts**: Optional, not required ✅

## Password Rules

Remember your password must have:
- 8+ characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Examples that work:
- `MyPuppy2024`
- `Fluffy123`
- `DogGrooming99`

Examples that DON'T work:
- `password` (no uppercase, no number)
- `PASSWORD` (no lowercase, no number)
- `Pass1` (too short)

## Already Have an Account?

Just login at: http://localhost:3000/login

Use:
- Your registered email
- The password you created

## Need Help?

See full documentation:
- `REGISTRATION_STATUS.md` - Detailed status report
- `REAL_CREDENTIALS_GUIDE.md` - Complete guide
