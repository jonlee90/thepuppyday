-- =============================================
-- Phase 9: Admin Settings & Content Management
-- Task: 0155
-- =============================================
-- Description: Creates tables for staff commissions, referral program, settings audit log,
-- and adds impression tracking to promo banners. Also inserts default settings.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: staff_commissions
-- =============================================
-- Stores commission rates for groomers/staff
CREATE TABLE IF NOT EXISTS public.staff_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  groomer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('percentage', 'flat_rate')),
  rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
  include_addons BOOLEAN NOT NULL DEFAULT false,
  service_overrides JSONB, -- Per-service commission rates: {service_id: {rate_type, rate}}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(groomer_id)
);

-- Add table comment
COMMENT ON TABLE public.staff_commissions IS 'Stores commission rates for groomers/staff members';
COMMENT ON COLUMN public.staff_commissions.rate_type IS 'Commission type: percentage (e.g., 50.00 for 50%) or flat_rate (e.g., 25.00 for $25)';
COMMENT ON COLUMN public.staff_commissions.rate IS 'Commission rate value (percentage 0-100 or flat dollar amount)';
COMMENT ON COLUMN public.staff_commissions.include_addons IS 'Whether commission includes addon prices';
COMMENT ON COLUMN public.staff_commissions.service_overrides IS 'Optional per-service commission rates: {"service_id": {"rate_type": "percentage", "rate": 60.00}}';

-- =============================================
-- TABLE: referral_codes
-- =============================================
-- Stores customer referral codes for referral program
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT max_uses_check CHECK (max_uses IS NULL OR uses_count <= max_uses)
);

-- Add table comment
COMMENT ON TABLE public.referral_codes IS 'Stores customer referral codes for referral program';
COMMENT ON COLUMN public.referral_codes.code IS 'Unique referral code (e.g., JOHN-SMITH-2024)';
COMMENT ON COLUMN public.referral_codes.uses_count IS 'Number of times this code has been used';
COMMENT ON COLUMN public.referral_codes.max_uses IS 'Maximum allowed uses (NULL = unlimited)';
COMMENT ON COLUMN public.referral_codes.is_active IS 'Whether this referral code is currently active';

-- =============================================
-- TABLE: referrals
-- =============================================
-- Tracks individual referrals and their status
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  referrer_bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  referee_bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referee_id),
  CONSTRAINT referrer_not_referee CHECK (referrer_id != referee_id)
);

-- Add table comment
COMMENT ON TABLE public.referrals IS 'Tracks individual referrals and their completion status';
COMMENT ON COLUMN public.referrals.referrer_id IS 'Customer who referred (owns the referral code)';
COMMENT ON COLUMN public.referrals.referee_id IS 'Customer who was referred (used the code)';
COMMENT ON COLUMN public.referrals.status IS 'Referral status: pending (signup only), completed (first visit), cancelled';
COMMENT ON COLUMN public.referrals.referrer_bonus_awarded IS 'Whether the referrer has received their bonus';
COMMENT ON COLUMN public.referrals.referee_bonus_awarded IS 'Whether the referee has received their bonus';
COMMENT ON COLUMN public.referrals.completed_at IS 'Timestamp when referral was completed (first visit)';

-- =============================================
-- TABLE: settings_audit_log
-- =============================================
-- Audit trail for admin settings changes
CREATE TABLE IF NOT EXISTS public.settings_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('booking', 'loyalty', 'site_content', 'banner', 'staff', 'referral', 'notification', 'other')),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.settings_audit_log IS 'Audit trail for all admin settings changes';
COMMENT ON COLUMN public.settings_audit_log.admin_id IS 'Admin user who made the change';
COMMENT ON COLUMN public.settings_audit_log.setting_type IS 'Category of setting changed (booking, loyalty, site_content, etc.)';
COMMENT ON COLUMN public.settings_audit_log.setting_key IS 'Specific setting identifier (e.g., "min_advance_hours", "hero.headline")';
COMMENT ON COLUMN public.settings_audit_log.old_value IS 'Previous value as JSON';
COMMENT ON COLUMN public.settings_audit_log.new_value IS 'New value as JSON';

-- =============================================
-- ALTER: promo_banners
-- =============================================
-- Add impression tracking to promo banners
ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS impression_count BIGINT NOT NULL DEFAULT 0 CHECK (impression_count >= 0);

COMMENT ON COLUMN public.promo_banners.impression_count IS 'Number of times this banner has been displayed to users';

-- =============================================
-- INDEXES: staff_commissions
-- =============================================
CREATE INDEX IF NOT EXISTS idx_staff_commissions_groomer
  ON public.staff_commissions(groomer_id);

-- =============================================
-- INDEXES: referral_codes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_referral_codes_customer
  ON public.referral_codes(customer_id);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code
  ON public.referral_codes(code)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_referral_codes_active
  ON public.referral_codes(is_active)
  WHERE is_active = true;

-- =============================================
-- INDEXES: referrals
-- =============================================
CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON public.referrals(referrer_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referee
  ON public.referrals(referee_id);

CREATE INDEX IF NOT EXISTS idx_referrals_code
  ON public.referrals(referral_code_id);

CREATE INDEX IF NOT EXISTS idx_referrals_status
  ON public.referrals(status);

CREATE INDEX IF NOT EXISTS idx_referrals_created
  ON public.referrals(created_at DESC);

-- =============================================
-- INDEXES: settings_audit_log
-- =============================================
CREATE INDEX IF NOT EXISTS idx_settings_audit_log_admin
  ON public.settings_audit_log(admin_id)
  WHERE admin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_settings_audit_log_type
  ON public.settings_audit_log(setting_type);

CREATE INDEX IF NOT EXISTS idx_settings_audit_log_created
  ON public.settings_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_settings_audit_log_key
  ON public.settings_audit_log(setting_key);

-- =============================================
-- TRIGGERS: Auto-update updated_at
-- =============================================
-- Trigger for staff_commissions updated_at
DROP TRIGGER IF EXISTS trigger_staff_commissions_updated_at ON public.staff_commissions;

CREATE TRIGGER trigger_staff_commissions_updated_at
  BEFORE UPDATE ON public.staff_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- Enable RLS on all new tables
ALTER TABLE public.staff_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

-- staff_commissions policies
CREATE POLICY "admins_all_access_staff_commissions"
  ON public.staff_commissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "groomers_view_own_commission"
  ON public.staff_commissions
  FOR SELECT
  TO authenticated
  USING (
    groomer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'groomer'
    )
  );

-- referral_codes policies
CREATE POLICY "admins_all_access_referral_codes"
  ON public.referral_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "customers_view_own_referral_codes"
  ON public.referral_codes
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "customers_create_own_referral_codes"
  ON public.referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- referrals policies
CREATE POLICY "admins_all_access_referrals"
  ON public.referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "customers_view_own_referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (
    referrer_id = auth.uid() OR
    referee_id = auth.uid()
  );

CREATE POLICY "customers_create_referrals"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referee_id = auth.uid());

-- settings_audit_log policies
CREATE POLICY "admins_all_access_settings_audit_log"
  ON public.settings_audit_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- DEFAULT SETTINGS
-- =============================================
-- Insert default booking settings
INSERT INTO public.settings (key, value, updated_at)
VALUES (
  'booking_settings',
  '{
    "min_advance_hours": 2,
    "max_advance_days": 90,
    "cancellation_cutoff_hours": 24,
    "buffer_minutes": 15
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Insert default loyalty earning rules
INSERT INTO public.settings (key, value, updated_at)
VALUES (
  'loyalty_earning_rules',
  '{
    "qualifying_services": [],
    "minimum_spend": 0,
    "first_visit_bonus": 0
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Insert default loyalty redemption rules
INSERT INTO public.settings (key, value, updated_at)
VALUES (
  'loyalty_redemption_rules',
  '{
    "eligible_services": [],
    "expiration_days": 365,
    "max_value": null
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Insert default referral program settings
INSERT INTO public.settings (key, value, updated_at)
VALUES (
  'referral_program',
  '{
    "is_enabled": false,
    "referrer_bonus_punches": 1,
    "referee_bonus_punches": 1
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- DEFAULT SITE CONTENT
-- =============================================
-- Insert default hero section content
INSERT INTO public.site_content (key, content, updated_at)
VALUES (
  'hero',
  '{
    "headline": "Professional Dog Grooming in La Mirada",
    "subheadline": "We treat your pup like family with gentle, expert care",
    "cta_buttons": [
      {"text": "Book Appointment", "url": "/booking"},
      {"text": "View Services", "url": "/services"}
    ],
    "background_image_url": null
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Insert default SEO content
INSERT INTO public.site_content (key, content, updated_at)
VALUES (
  'seo',
  '{
    "page_title": "Puppy Day - Professional Dog Grooming | La Mirada, CA",
    "meta_description": "Professional dog grooming services in La Mirada, CA. Expert care for dogs of all sizes. Book your appointment today at Puppy Day!",
    "og_title": "Puppy Day - Professional Dog Grooming in La Mirada",
    "og_description": "We treat your pup like family with gentle, expert grooming care. Serving La Mirada and surrounding areas."
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Insert default business info
INSERT INTO public.site_content (key, content, updated_at)
VALUES (
  'business_info',
  '{
    "name": "Puppy Day",
    "address": "14936 Leffingwell Rd, La Mirada, CA 90638",
    "phone": "(657) 252-2903",
    "email": "puppyday14936@gmail.com",
    "hours": {
      "monday": "9:00 AM - 5:00 PM",
      "tuesday": "9:00 AM - 5:00 PM",
      "wednesday": "9:00 AM - 5:00 PM",
      "thursday": "9:00 AM - 5:00 PM",
      "friday": "9:00 AM - 5:00 PM",
      "saturday": "9:00 AM - 5:00 PM",
      "sunday": "Closed"
    },
    "social_media": {
      "instagram": "@puppyday_lm",
      "yelp": "Puppy Day La Mirada"
    }
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- HELPER VIEWS
-- =============================================
-- View to see staff commission earnings
CREATE OR REPLACE VIEW public.staff_commission_earnings AS
SELECT
  sc.id,
  sc.groomer_id,
  u.first_name || ' ' || u.last_name as groomer_name,
  sc.rate_type,
  sc.rate,
  sc.include_addons,
  COUNT(a.id) as total_appointments,
  SUM(a.total_price) as total_revenue,
  CASE
    WHEN sc.rate_type = 'percentage' THEN SUM(a.total_price * sc.rate / 100)
    WHEN sc.rate_type = 'flat_rate' THEN COUNT(a.id) * sc.rate
    ELSE 0
  END as estimated_commission
FROM public.staff_commissions sc
JOIN public.users u ON u.id = sc.groomer_id
LEFT JOIN public.appointments a ON a.groomer_id = sc.groomer_id
  AND a.status = 'completed'
GROUP BY sc.id, sc.groomer_id, u.first_name, u.last_name, sc.rate_type, sc.rate, sc.include_addons;

COMMENT ON VIEW public.staff_commission_earnings IS 'Summary view of staff commission earnings from completed appointments';

-- Grant access to views
GRANT SELECT ON public.staff_commission_earnings TO authenticated;

-- =============================================
-- COMPLETE
-- =============================================
-- Migration completed successfully
