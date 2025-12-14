-- Phase 6: Notifications Log Table Enhancements
-- Add tracking columns for marketing campaigns and delivery metrics

-- Add new columns to notifications_log table
ALTER TABLE public.notifications_log
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_send_id UUID REFERENCES public.campaign_sends(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tracking_id UUID DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cost_cents INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_log_campaign ON public.notifications_log(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_log_campaign_send ON public.notifications_log(campaign_send_id) WHERE campaign_send_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_log_tracking ON public.notifications_log(tracking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_clicked ON public.notifications_log(clicked_at) WHERE clicked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_log_delivered ON public.notifications_log(delivered_at) WHERE delivered_at IS NOT NULL;

-- Function to track notification click
CREATE OR REPLACE FUNCTION track_notification_click(p_tracking_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications_log
  SET clicked_at = NOW()
  WHERE tracking_id = p_tracking_id
    AND clicked_at IS NULL;

  -- Also update campaign_sends if linked
  UPDATE public.campaign_sends
  SET clicked_at = NOW()
  WHERE id IN (
    SELECT campaign_send_id
    FROM public.notifications_log
    WHERE tracking_id = p_tracking_id
  )
  AND clicked_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track notification delivery
CREATE OR REPLACE FUNCTION track_notification_delivery(
  p_tracking_id UUID,
  p_delivered_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications_log
  SET delivered_at = p_delivered_at
  WHERE tracking_id = p_tracking_id
    AND delivered_at IS NULL;

  -- Also update campaign_sends if linked
  UPDATE public.campaign_sends
  SET delivered_at = p_delivered_at
  WHERE id IN (
    SELECT campaign_send_id
    FROM public.notifications_log
    WHERE tracking_id = p_tracking_id
  )
  AND delivered_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification delivery metrics
CREATE OR REPLACE FUNCTION get_notification_metrics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_clicked BIGINT,
  total_failed BIGINT,
  delivery_rate NUMERIC,
  click_rate NUMERIC,
  total_cost_dollars NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_sent,
    COUNT(delivered_at) AS total_delivered,
    COUNT(clicked_at) AS total_clicked,
    COUNT(*) FILTER (WHERE status = 'failed') AS total_failed,
    ROUND(
      (COUNT(delivered_at)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS delivery_rate,
    ROUND(
      (COUNT(clicked_at)::NUMERIC / NULLIF(COUNT(delivered_at), 0)) * 100,
      2
    ) AS click_rate,
    ROUND(SUM(COALESCE(cost_cents, 0))::NUMERIC / 100, 2) AS total_cost_dollars
  FROM public.notifications_log
  WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get campaign performance metrics
CREATE OR REPLACE FUNCTION get_campaign_metrics(p_campaign_id UUID)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_clicked BIGINT,
  total_bookings BIGINT,
  delivery_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC,
  revenue_generated NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_sent,
    COUNT(cs.delivered_at) AS total_delivered,
    COUNT(cs.clicked_at) AS total_clicked,
    COUNT(cs.booking_id) AS total_bookings,
    ROUND(
      (COUNT(cs.delivered_at)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS delivery_rate,
    ROUND(
      (COUNT(cs.clicked_at)::NUMERIC / NULLIF(COUNT(cs.delivered_at), 0)) * 100,
      2
    ) AS click_rate,
    ROUND(
      (COUNT(cs.booking_id)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS conversion_rate,
    COALESCE(SUM(a.total_price), 0) AS revenue_generated
  FROM public.campaign_sends cs
  LEFT JOIN public.appointments a ON a.id = cs.booking_id
  WHERE cs.campaign_id = p_campaign_id
  GROUP BY cs.campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on new columns
COMMENT ON COLUMN public.notifications_log.campaign_id IS 'Link to marketing campaign if part of a campaign';
COMMENT ON COLUMN public.notifications_log.campaign_send_id IS 'Link to specific campaign send record';
COMMENT ON COLUMN public.notifications_log.tracking_id IS 'Unique tracking ID for click/open tracking';
COMMENT ON COLUMN public.notifications_log.clicked_at IS 'When the link in the notification was clicked';
COMMENT ON COLUMN public.notifications_log.delivered_at IS 'When the notification was delivered (from provider webhook)';
COMMENT ON COLUMN public.notifications_log.cost_cents IS 'Cost of sending this notification in cents (e.g., SMS cost)';
