-- Phase 6: Report Cards Table Enhancements
-- Add new columns for Phase 6 features

-- Add new columns to report_cards table
ALTER TABLE public.report_cards
  ADD COLUMN IF NOT EXISTS groomer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dont_send BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on groomer_id for performance
CREATE INDEX IF NOT EXISTS idx_report_cards_groomer ON public.report_cards(groomer_id);

-- Create index on is_draft for filtering
CREATE INDEX IF NOT EXISTS idx_report_cards_draft ON public.report_cards(is_draft);

-- Create index on sent_at for analytics
CREATE INDEX IF NOT EXISTS idx_report_cards_sent ON public.report_cards(sent_at) WHERE sent_at IS NOT NULL;

-- Create index on expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_report_cards_expires ON public.report_cards(expires_at) WHERE expires_at IS NOT NULL;

-- Add updated_at trigger if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_report_cards_updated_at'
  ) THEN
    CREATE TRIGGER update_report_cards_updated_at
      BEFORE UPDATE ON public.report_cards
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_report_card_views(report_card_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.report_cards
  SET
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE id = report_card_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if report card is expired
CREATE OR REPLACE FUNCTION is_report_card_expired(report_card_uuid UUID)
RETURNS boolean AS $$
DECLARE
  expiry_date TIMESTAMPTZ;
BEGIN
  SELECT expires_at INTO expiry_date
  FROM public.report_cards
  WHERE id = report_card_uuid;

  IF expiry_date IS NULL THEN
    RETURN false;
  END IF;

  RETURN expiry_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment on new columns
COMMENT ON COLUMN public.report_cards.groomer_id IS 'Groomer who completed the report card';
COMMENT ON COLUMN public.report_cards.view_count IS 'Number of times the public report card has been viewed';
COMMENT ON COLUMN public.report_cards.last_viewed_at IS 'Last time the public report card was viewed';
COMMENT ON COLUMN public.report_cards.sent_at IS 'When the report card notification was sent to customer';
COMMENT ON COLUMN public.report_cards.expires_at IS 'When the public report card link expires (default 90 days)';
COMMENT ON COLUMN public.report_cards.dont_send IS 'If true, skip automatic notification sending';
COMMENT ON COLUMN public.report_cards.is_draft IS 'If true, report card is still being edited';
COMMENT ON COLUMN public.report_cards.updated_at IS 'Last update timestamp';
