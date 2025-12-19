-- Migration: Banner Click Tracking Function
-- Task 0177: Banner click tracking endpoint
-- Date: 2024-12-18
-- Description: Add SQL function for atomic banner click count increment

-- ============================================================================
-- FUNCTION: increment_banner_clicks
-- ============================================================================
-- Atomically increments the click_count for a banner
-- This prevents race conditions when multiple users click simultaneously
-- Returns the updated click_count

CREATE OR REPLACE FUNCTION increment_banner_clicks(banner_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Atomically increment click_count and return new value
  UPDATE promo_banners
  SET
    click_count = click_count + 1,
    updated_at = NOW()
  WHERE id = banner_id
    AND is_active = true  -- Only increment for active banners
  RETURNING click_count INTO new_count;

  -- If no rows were updated (banner not found or not active), return NULL
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Banner not found or not active';
  END IF;

  RETURN new_count;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION increment_banner_clicks IS
  'Atomically increments click_count for a banner. ' ||
  'Only works for active banners. ' ||
  'Returns the new click count or raises exception if banner not found/active.';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Allow anonymous and authenticated users to call this function
-- This is needed for public click tracking
GRANT EXECUTE ON FUNCTION increment_banner_clicks TO anon;
GRANT EXECUTE ON FUNCTION increment_banner_clicks TO authenticated;

-- ============================================================================
-- VALIDATION
-- ============================================================================
-- Test the function (this will be rolled back in transaction)
DO $$
DECLARE
  test_banner_id UUID;
  initial_count INTEGER;
  new_count INTEGER;
BEGIN
  -- Create a test banner
  INSERT INTO promo_banners (
    image_url,
    alt_text,
    click_url,
    is_active,
    display_order,
    click_count,
    impression_count
  ) VALUES (
    'https://example.com/banner.jpg',
    'Test Banner',
    'https://example.com',
    true,
    1,
    10,
    100
  )
  RETURNING id INTO test_banner_id;

  -- Get initial count
  SELECT click_count INTO initial_count
  FROM promo_banners
  WHERE id = test_banner_id;

  -- Increment using function
  SELECT increment_banner_clicks(test_banner_id) INTO new_count;

  -- Verify increment worked
  IF new_count != initial_count + 1 THEN
    RAISE EXCEPTION 'Click count increment failed: expected %, got %',
      initial_count + 1, new_count;
  END IF;

  -- Clean up test data
  DELETE FROM promo_banners WHERE id = test_banner_id;

  RAISE NOTICE 'Banner click tracking function validation passed';
END;
$$;
