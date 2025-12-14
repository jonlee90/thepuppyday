-- Phase 6: Campaign Sends Table Enhancements
-- Add tracking fields for breed reminders and attempt tracking

-- Make campaign_id nullable (for non-campaign sends like breed reminders)
ALTER TABLE public.campaign_sends
  ALTER COLUMN campaign_id DROP NOT NULL;

-- Add new columns for breed reminders
ALTER TABLE public.campaign_sends
  ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tracking_id UUID,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_campaign_sends_pet ON public.campaign_sends(pet_id) WHERE pet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_sends_tracking ON public.campaign_sends(tracking_id) WHERE tracking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_sends_user_pet ON public.campaign_sends(user_id, pet_id) WHERE pet_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.campaign_sends.campaign_id IS 'Link to marketing campaign if part of a campaign (nullable for breed reminders)';
COMMENT ON COLUMN public.campaign_sends.pet_id IS 'Pet ID for breed-based reminders';
COMMENT ON COLUMN public.campaign_sends.tracking_id IS 'Unique tracking ID for click/conversion tracking';
COMMENT ON COLUMN public.campaign_sends.attempt_count IS 'Number of times reminder has been sent (max 2)';
