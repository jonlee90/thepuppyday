-- Phase 6: Waitlist Table Enhancements
-- Add new columns for waitlist automation and priority

-- Add new columns to waitlist table
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on priority for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON public.waitlist(priority DESC);

-- Create index on offer_expires_at for expiration checks
CREATE INDEX IF NOT EXISTS idx_waitlist_offer_expires ON public.waitlist(offer_expires_at) WHERE offer_expires_at IS NOT NULL;

-- Create composite index for matching algorithm
CREATE INDEX IF NOT EXISTS idx_waitlist_matching ON public.waitlist(service_id, requested_date, status) WHERE status = 'active';

-- Add updated_at trigger if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_waitlist_updated_at'
  ) THEN
    CREATE TRIGGER update_waitlist_updated_at
      BEFORE UPDATE ON public.waitlist
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Function to get matching waitlist entries for a slot
CREATE OR REPLACE FUNCTION get_matching_waitlist_entries(
  p_service_id UUID,
  p_slot_date DATE,
  p_max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  pet_id UUID,
  service_id UUID,
  requested_date DATE,
  time_preference TEXT,
  priority INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.customer_id,
    w.pet_id,
    w.service_id,
    w.requested_date,
    w.time_preference,
    w.priority,
    w.notes,
    w.created_at
  FROM public.waitlist w
  WHERE
    w.service_id = p_service_id
    AND w.status = 'active'
    AND w.requested_date BETWEEN (p_slot_date - INTERVAL '3 days') AND (p_slot_date + INTERVAL '3 days')
  ORDER BY
    w.priority DESC,
    w.created_at ASC
  LIMIT p_max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old waitlist offers
CREATE OR REPLACE FUNCTION expire_old_waitlist_offers()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.waitlist
    SET
      status = 'expired_offer',
      updated_at = NOW()
    WHERE
      status = 'notified'
      AND offer_expires_at IS NOT NULL
      AND offer_expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM updated;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on new columns
COMMENT ON COLUMN public.waitlist.priority IS 'Priority level for slot filling (higher = first in line). Default 0.';
COMMENT ON COLUMN public.waitlist.notes IS 'Admin notes about this waitlist entry';
COMMENT ON COLUMN public.waitlist.offer_expires_at IS 'When the current slot offer expires';
COMMENT ON COLUMN public.waitlist.updated_at IS 'Last update timestamp';
