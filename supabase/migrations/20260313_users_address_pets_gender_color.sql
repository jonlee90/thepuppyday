-- =============================================================================
-- Users: add optional address fields (CA-only business, no state needed)
-- =============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zip text;

-- =============================================================================
-- Pets: remove redundant weight, add gender (required) + color (optional)
-- =============================================================================
ALTER TABLE pets DROP COLUMN IF EXISTS weight;

ALTER TABLE pets ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'male';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS color text;

-- Constrain gender to known values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pets_gender'
  ) THEN
    ALTER TABLE pets ADD CONSTRAINT chk_pets_gender CHECK (gender IN ('male', 'female'));
  END IF;
END
$$;
