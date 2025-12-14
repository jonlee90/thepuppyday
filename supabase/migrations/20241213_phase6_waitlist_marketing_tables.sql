-- Phase 6: Waitlist Slot Offers and Marketing Unsubscribes Tables
-- For waitlist automation and opt-out management

-- Waitlist Slot Offers table
CREATE TABLE IF NOT EXISTS public.waitlist_slot_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  response_window_hours INTEGER DEFAULT 2,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing Unsubscribes table
CREATE TABLE IF NOT EXISTS public.marketing_unsubscribes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  unsubscribed_from TEXT[] DEFAULT '{}', -- e.g., ['sms', 'email', 'marketing', 'reminders']
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_slot_offers_date_time ON public.waitlist_slot_offers(slot_date, slot_time);
CREATE INDEX IF NOT EXISTS idx_waitlist_slot_offers_service ON public.waitlist_slot_offers(service_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_slot_offers_status ON public.waitlist_slot_offers(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_slot_offers_expires ON public.waitlist_slot_offers(expires_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_marketing_unsubscribes_email ON public.marketing_unsubscribes(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_unsubscribes_phone ON public.marketing_unsubscribes(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_unsubscribes_types ON public.marketing_unsubscribes USING gin(unsubscribed_from);

-- Updated_at trigger
CREATE TRIGGER update_waitlist_slot_offers_updated_at
  BEFORE UPDATE ON public.waitlist_slot_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE public.waitlist_slot_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_unsubscribes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for waitlist_slot_offers

-- Admins can view all slot offers
CREATE POLICY "admin_view_all_slot_offers"
  ON public.waitlist_slot_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can create slot offers
CREATE POLICY "admin_create_slot_offers"
  ON public.waitlist_slot_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update slot offers
CREATE POLICY "admin_update_slot_offers"
  ON public.waitlist_slot_offers
  FOR UPDATE
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

-- Admins can delete slot offers
CREATE POLICY "admin_delete_slot_offers"
  ON public.waitlist_slot_offers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for marketing_unsubscribes

-- Users can view their own unsubscribe status
CREATE POLICY "users_view_own_unsubscribe"
  ON public.marketing_unsubscribes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own unsubscribe record
CREATE POLICY "users_create_own_unsubscribe"
  ON public.marketing_unsubscribes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own unsubscribe preferences
CREATE POLICY "users_update_own_unsubscribe"
  ON public.marketing_unsubscribes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all unsubscribes
CREATE POLICY "admin_view_all_unsubscribes"
  ON public.marketing_unsubscribes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can manage unsubscribes
CREATE POLICY "admin_manage_unsubscribes"
  ON public.marketing_unsubscribes
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

-- Allow anonymous unsubscribe via email/phone link
CREATE POLICY "anon_create_unsubscribe"
  ON public.marketing_unsubscribes
  FOR INSERT
  TO anon
  WITH CHECK (true);
