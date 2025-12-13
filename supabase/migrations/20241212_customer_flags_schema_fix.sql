-- Migration: Fix customer_flags table schema to match TypeScript types
-- Date: 2024-12-12
-- Description: Rename columns and add missing fields to align with code expectations

-- =====================================================
-- 1. CREATE ENUM TYPES
-- =====================================================

-- Create flag_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE customer_flag_type AS ENUM (
        'aggressive_dog',
        'payment_issues',
        'vip',
        'special_needs',
        'grooming_notes',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create color enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE customer_flag_color AS ENUM (
        'red',
        'yellow',
        'green'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. ADD NEW COLUMNS (with temporary names)
-- =====================================================

-- Add new columns before renaming
ALTER TABLE public.customer_flags
  ADD COLUMN IF NOT EXISTS flag_type customer_flag_type,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS color customer_flag_color,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

-- =====================================================
-- 3. MIGRATE EXISTING DATA
-- =====================================================

-- Migrate reason to flag_type (default to 'other' if empty)
UPDATE public.customer_flags
SET flag_type = CASE
  WHEN reason ILIKE '%aggressive%' THEN 'aggressive_dog'::customer_flag_type
  WHEN reason ILIKE '%payment%' THEN 'payment_issues'::customer_flag_type
  WHEN reason ILIKE '%vip%' THEN 'vip'::customer_flag_type
  WHEN reason ILIKE '%special%' THEN 'special_needs'::customer_flag_type
  WHEN reason ILIKE '%grooming%' OR reason ILIKE '%note%' THEN 'grooming_notes'::customer_flag_type
  ELSE 'other'::customer_flag_type
END
WHERE flag_type IS NULL;

-- Migrate notes to description
UPDATE public.customer_flags
SET description = COALESCE(notes, reason, 'No description provided')
WHERE description IS NULL;

-- Set default color based on flag_type
UPDATE public.customer_flags
SET color = CASE flag_type
  WHEN 'aggressive_dog' THEN 'red'::customer_flag_color
  WHEN 'payment_issues' THEN 'red'::customer_flag_color
  WHEN 'vip' THEN 'green'::customer_flag_color
  WHEN 'special_needs' THEN 'yellow'::customer_flag_color
  WHEN 'grooming_notes' THEN 'yellow'::customer_flag_color
  ELSE 'yellow'::customer_flag_color
END
WHERE color IS NULL;

-- Migrate flagged_by to created_by
UPDATE public.customer_flags
SET created_by = flagged_by
WHERE created_by IS NULL AND flagged_by IS NOT NULL;

-- =====================================================
-- 4. MAKE NEW COLUMNS NOT NULL
-- =====================================================

ALTER TABLE public.customer_flags
  ALTER COLUMN flag_type SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN color SET NOT NULL;

-- created_by can remain nullable (for system-generated flags)

-- =====================================================
-- 5. DROP OLD COLUMNS
-- =====================================================

-- Drop the old columns
ALTER TABLE public.customer_flags
  DROP COLUMN IF EXISTS reason,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS flagged_by;

-- =====================================================
-- 6. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON COLUMN public.customer_flags.flag_type IS
  'Type of flag: aggressive_dog, payment_issues, vip, special_needs, grooming_notes, other';

COMMENT ON COLUMN public.customer_flags.description IS
  'Detailed description of the flag reason';

COMMENT ON COLUMN public.customer_flags.color IS
  'Visual color indicator: red (warning/danger), yellow (caution), green (positive/VIP)';

COMMENT ON COLUMN public.customer_flags.created_by IS
  'Admin/staff user who created this flag';

COMMENT ON TABLE public.customer_flags IS
  'Flags/notes attached to customer accounts for special handling';

-- =====================================================
-- 7. VERIFY MIGRATION SUCCESS
-- =====================================================

DO $$
DECLARE
  flag_type_exists boolean;
  description_exists boolean;
  color_exists boolean;
  created_by_exists boolean;
  reason_exists boolean;
BEGIN
  -- Check new columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_flags' AND column_name = 'flag_type'
  ) INTO flag_type_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_flags' AND column_name = 'description'
  ) INTO description_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_flags' AND column_name = 'color'
  ) INTO color_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_flags' AND column_name = 'created_by'
  ) INTO created_by_exists;

  -- Check old columns are gone
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_flags' AND column_name = 'reason'
  ) INTO reason_exists;

  -- Raise errors if verification fails
  IF NOT flag_type_exists THEN
    RAISE EXCEPTION 'Migration failed: flag_type column not created';
  END IF;

  IF NOT description_exists THEN
    RAISE EXCEPTION 'Migration failed: description column not created';
  END IF;

  IF NOT color_exists THEN
    RAISE EXCEPTION 'Migration failed: color column not created';
  END IF;

  IF NOT created_by_exists THEN
    RAISE EXCEPTION 'Migration failed: created_by column not created';
  END IF;

  IF reason_exists THEN
    RAISE EXCEPTION 'Migration failed: reason column still exists (should be dropped)';
  END IF;

  RAISE NOTICE 'customer_flags schema migration completed successfully!';
  RAISE NOTICE '✅ flag_type column created with ENUM type';
  RAISE NOTICE '✅ description column created';
  RAISE NOTICE '✅ color column created with ENUM type';
  RAISE NOTICE '✅ created_by column created with FK to users';
  RAISE NOTICE '✅ Old columns (reason, notes, flagged_by) dropped';
END $$;
