-- Phase 6: Reviews Table
-- Links to report_cards, users, and appointments for customer feedback

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_card_id UUID UNIQUE NOT NULL REFERENCES public.report_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment ON public.reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_public ON public.reviews(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Customers can view their own reviews
CREATE POLICY "customers_view_own_reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Customers can create reviews for their own report cards
CREATE POLICY "customers_create_own_reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = appointment_id
      AND appointments.customer_id = auth.uid()
    )
  );

-- Admins and groomers can view all reviews
CREATE POLICY "admin_groomer_view_all_reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );

-- Admins can update reviews (mark as public, etc.)
CREATE POLICY "admin_update_reviews"
  ON public.reviews
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

-- Public can view public reviews (for marketing)
CREATE POLICY "public_view_public_reviews"
  ON public.reviews
  FOR SELECT
  TO anon
  USING (is_public = true);
