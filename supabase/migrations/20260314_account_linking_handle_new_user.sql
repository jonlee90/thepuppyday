-- Migration: Replace handle_new_user() with account-linking logic
--
-- Three paths (checked in order):
--   1. Phone-based linking — matches CSV-imported profiles by normalized phone
--      + @puppyday.local email + created_by_admin = true
--   2. Email-based linking — matches guest-booked profiles where
--      public.users.id does NOT exist in auth.users (orphaned guest)
--   3. New user path — no match found, creates fresh public.users row

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_id        UUID;
  v_old_first     TEXT;
  v_old_last      TEXT;
  v_old_phone     TEXT;
  v_old_avatar    TEXT;
  v_old_prefs     JSONB;
  v_old_created   TIMESTAMPTZ;
  v_old_address   TEXT;
  v_old_city      TEXT;
  v_old_zip       TEXT;
  v_new_first     TEXT;
  v_new_last      TEXT;
  v_new_phone     TEXT;
  v_normalized    TEXT;
  v_link_source   TEXT;  -- 'csv' or 'guest' for merge strategy
BEGIN
  -- ============================================================
  -- 1. Extract phone from auth signup metadata and normalize
  -- ============================================================
  v_new_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
  -- Normalize: strip all non-digit characters for comparison
  v_normalized := regexp_replace(v_new_phone, '\D', '', 'g');

  -- ============================================================
  -- 2A. Check for an existing CSV-imported profile matching by phone
  --     CSV-imported profiles are identifiable by:
  --     - email ending in @puppyday.local
  --     - created_by_admin = true
  --     - phone number matches (after normalization)
  -- ============================================================
  IF v_normalized != '' AND length(v_normalized) >= 10 THEN
    SELECT id, first_name, last_name, phone, avatar_url, preferences,
           created_at, address, city, zip
      INTO v_old_id, v_old_first, v_old_last, v_old_phone, v_old_avatar,
           v_old_prefs, v_old_created, v_old_address, v_old_city, v_old_zip
      FROM public.users
     WHERE regexp_replace(phone, '\D', '', 'g') = v_normalized
       AND email LIKE '%@puppyday.local'
       AND created_by_admin = true
     LIMIT 1;

    IF v_old_id IS NOT NULL THEN
      v_link_source := 'csv';
    END IF;
  END IF;

  -- ============================================================
  -- 2B. Check for orphaned guest profile matching by email
  --     Guest-booked profiles are identifiable by:
  --     - email matches (case-insensitive)
  --     - public.users.id does NOT exist in auth.users (orphaned)
  --     - different id than the new auth user
  -- ============================================================
  IF v_old_id IS NULL THEN
    SELECT id, first_name, last_name, phone, avatar_url, preferences,
           created_at, address, city, zip
      INTO v_old_id, v_old_first, v_old_last, v_old_phone, v_old_avatar,
           v_old_prefs, v_old_created, v_old_address, v_old_city, v_old_zip
      FROM public.users
     WHERE LOWER(email) = LOWER(NEW.email)
       AND id != NEW.id
       AND NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = public.users.id)
     LIMIT 1;

    IF v_old_id IS NOT NULL THEN
      v_link_source := 'guest';
    END IF;
  END IF;

  -- ============================================================
  -- 3A. LINKING PATH: Matching profile found -- link accounts
  -- ============================================================
  IF v_old_id IS NOT NULL THEN

    -- Determine merged name values
    v_new_first := COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), v_old_first);
    v_new_last  := COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), v_old_last);

    -- Determine merged phone: for CSV, keep the CSV phone (known good from business records);
    -- for guest, prefer auth metadata phone if provided, else keep guest phone
    IF v_link_source = 'csv' THEN
      v_new_phone := v_old_phone;
    ELSE
      v_new_phone := COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), NEW.phone, v_old_phone);
    END IF;

    -- --------------------------------------------------------
    -- 3A-1. Clear old profile's email to avoid UNIQUE conflict,
    --        then insert new user row FIRST so NEW.id exists
    --        in public.users before re-pointing FKs.
    -- --------------------------------------------------------
    UPDATE public.users
       SET email = 'linking_' || v_old_id::text
     WHERE id = v_old_id;

    INSERT INTO public.users (
      id,
      email,
      first_name,
      last_name,
      phone,
      role,
      avatar_url,
      preferences,
      address,
      city,
      zip,
      is_active,
      created_by_admin,
      activated_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      LOWER(NEW.email),
      v_new_first,
      v_new_last,
      v_new_phone,
      'customer',
      v_old_avatar,
      v_old_prefs,
      v_old_address,
      v_old_city,
      v_old_zip,
      true,
      CASE WHEN v_link_source = 'csv' THEN true ELSE false END,
      NOW(),
      v_old_created,       -- Preserve original created_at
      NOW()
    );

    -- --------------------------------------------------------
    -- 3A-2. Re-point all FK references from old UUID -> new UUID
    --        (NEW.id now exists in public.users, so FKs are valid)
    -- --------------------------------------------------------

    -- Core customer data
    UPDATE public.pets
       SET owner_id = NEW.id
     WHERE owner_id = v_old_id;

    UPDATE public.appointments
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    -- Loyalty & memberships
    UPDATE public.loyalty_points
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    UPDATE public.loyalty_transactions
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    -- Flags & payments
    UPDATE public.customer_flags
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    UPDATE public.customer_flags
       SET created_by = NEW.id
     WHERE created_by = v_old_id;

    UPDATE public.payments
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    -- Waitlist & notifications
    UPDATE public.waitlist
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    UPDATE public.notifications_log
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    -- Marketing & campaigns
    UPDATE public.campaign_sends
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    UPDATE public.marketing_unsubscribes
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    -- Referrals
    UPDATE public.referral_codes
       SET customer_id = NEW.id
     WHERE customer_id = v_old_id;

    UPDATE public.referrals
       SET referrer_id = NEW.id
     WHERE referrer_id = v_old_id;

    UPDATE public.referrals
       SET referee_id = NEW.id
     WHERE referee_id = v_old_id;

    -- Reviews
    UPDATE public.reviews
       SET user_id = NEW.id
     WHERE user_id = v_old_id;

    -- --------------------------------------------------------
    -- 3A-3. Delete the old profile (all FKs already re-pointed)
    -- --------------------------------------------------------
    DELETE FROM public.users WHERE id = v_old_id;

    RETURN NEW;
  END IF;

  -- ============================================================
  -- 3B. NEW USER PATH: No matching profile found -- create fresh row
  -- ============================================================
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    created_by_admin,
    activated_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), NULL),
    'customer',
    true,
    false,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Add descriptive comment
COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger function on auth.users INSERT. Three linking paths: '
  '(1) Phone-based: matches CSV-imported profiles by normalized phone + @puppyday.local email + created_by_admin. '
  '(2) Email-based: matches orphaned guest-booked profiles by email where public.users.id has no auth.users entry. '
  '(3) New user: no match found, creates fresh public.users row. '
  'In linking paths, all FK references are re-pointed to the new auth UUID before deleting the old profile.';
