-- Initial database schema for The Puppy Day SaaS
-- Phase 1: Foundation & Database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (managed by Supabase Auth, extended here)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'groomer')),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Breeds table (for grooming recommendations)
CREATE TABLE IF NOT EXISTS public.breeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  grooming_frequency_weeks INTEGER DEFAULT 6,
  reminder_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets table
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed_id UUID REFERENCES public.breeds(id),
  breed_custom TEXT,
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'xlarge')),
  weight_lbs DECIMAL(5,2),
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  notes TEXT,
  medical_info TEXT,
  photo_url TEXT,
  breed_name TEXT, -- Denormalized for easier querying
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service prices by size
CREATE TABLE IF NOT EXISTS public.service_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'xlarge')),
  price DECIMAL(10,2) NOT NULL,
  UNIQUE(service_id, size)
);

-- Add-ons table
CREATE TABLE IF NOT EXISTS public.addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  upsell_prompt TEXT,
  upsell_breeds UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  pet_id UUID NOT NULL REFERENCES public.pets(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  groomer_id UUID REFERENCES public.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'checked_in', 'in_progress',
    'ready', 'completed', 'cancelled', 'no_show'
  )),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'deposit_paid', 'paid', 'refunded'
  )),
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment add-ons junction table
CREATE TABLE IF NOT EXISTS public.appointment_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addons(id),
  price DECIMAL(10,2) NOT NULL,
  UNIQUE(appointment_id, addon_id)
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  pet_id UUID NOT NULL REFERENCES public.pets(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  requested_date DATE NOT NULL,
  time_preference TEXT DEFAULT 'any' CHECK (time_preference IN ('morning', 'afternoon', 'any')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'notified', 'booked', 'expired', 'cancelled')),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report cards table
CREATE TABLE IF NOT EXISTS public.report_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id),
  mood TEXT CHECK (mood IN ('happy', 'nervous', 'calm', 'energetic')),
  coat_condition TEXT CHECK (coat_condition IN ('excellent', 'good', 'matted', 'needs_attention')),
  behavior TEXT CHECK (behavior IN ('great', 'some_difficulty', 'required_extra_care')),
  health_observations TEXT[] DEFAULT '{}',
  groomer_notes TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEMBERSHIP & LOYALTY TABLES
-- =====================================================

-- Memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'yearly')),
  grooms_per_period INTEGER DEFAULT 1,
  benefits JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer memberships
CREATE TABLE IF NOT EXISTS public.customer_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  membership_id UUID NOT NULL REFERENCES public.memberships(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  stripe_subscription_id TEXT,
  grooms_remaining INTEGER DEFAULT 0,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty settings (punch card configuration)
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_threshold INTEGER DEFAULT 9,
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer loyalty records (punch card tracking)
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID UNIQUE NOT NULL REFERENCES public.users(id),
  current_punches INTEGER DEFAULT 0,
  threshold_override INTEGER,
  total_visits INTEGER DEFAULT 0,
  free_washes_earned INTEGER DEFAULT 0,
  free_washes_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty punches (individual punch records)
CREATE TABLE IF NOT EXISTS public.loyalty_punches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  customer_loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id),
  cycle_number INTEGER NOT NULL,
  punch_number INTEGER NOT NULL,
  service_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty redemptions (free wash tracking)
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  cycle_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy loyalty points (kept for migration)
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID UNIQUE NOT NULL REFERENCES public.users(id),
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0
);

-- Legacy loyalty transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  points INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADMINISTRATIVE TABLES
-- =====================================================

-- Customer flags
CREATE TABLE IF NOT EXISTS public.customer_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  reason TEXT NOT NULL,
  notes TEXT,
  flagged_by UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 'refunded'
  )),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CMS & CONTENT TABLES
-- =====================================================

-- Site content (CMS)
CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo banners
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  click_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery images
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  dog_name TEXT,
  breed TEXT,
  caption TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'regular' CHECK (category IN ('before_after', 'regular', 'featured')),
  is_before_after BOOLEAN DEFAULT false,
  before_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Before/After pairs (for gallery)
CREATE TABLE IF NOT EXISTS public.before_after_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  pet_name TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications log
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL,
  channel TEXT CHECK (channel IN ('email', 'sms')),
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pets_owner ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_active ON public.pets(is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_pet ON public.appointments(pet_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_date ON public.waitlist(requested_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON public.notifications_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer ON public.customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_punches_customer ON public.loyalty_punches(customer_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS pets_updated_at ON public.pets;
CREATE TRIGGER pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS customer_loyalty_updated_at ON public.customer_loyalty;
CREATE TRIGGER customer_loyalty_updated_at BEFORE UPDATE ON public.customer_loyalty
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to create user record when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create public.users record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Public read access for services and breeds
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

-- Users: Can read own profile, admins can read all
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );

-- Pets: Customers can manage own pets, admins can read all
DROP POLICY IF EXISTS "Customers can view own pets" ON public.pets;
CREATE POLICY "Customers can view own pets" ON public.pets
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );

DROP POLICY IF EXISTS "Customers can insert own pets" ON public.pets;
CREATE POLICY "Customers can insert own pets" ON public.pets
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own pets" ON public.pets;
CREATE POLICY "Customers can update own pets" ON public.pets
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Appointments: Customers see own, admins/groomers see all
DROP POLICY IF EXISTS "Customers can view own appointments" ON public.appointments;
CREATE POLICY "Customers can view own appointments" ON public.appointments
  FOR SELECT
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );

DROP POLICY IF EXISTS "Customers can create appointments" ON public.appointments;
CREATE POLICY "Customers can create appointments" ON public.appointments
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
CREATE POLICY "Admins can manage all appointments" ON public.appointments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Report Cards: Customers can view their own, admins can manage
DROP POLICY IF EXISTS "Customers can view own report cards" ON public.report_cards;
CREATE POLICY "Customers can view own report cards" ON public.report_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = appointment_id
      AND appointments.customer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );

DROP POLICY IF EXISTS "Admins can manage report cards" ON public.report_cards;
CREATE POLICY "Admins can manage report cards" ON public.report_cards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );

-- Customer Loyalty: Users can view own, admins can manage
DROP POLICY IF EXISTS "Customers can view own loyalty" ON public.customer_loyalty;
CREATE POLICY "Customers can view own loyalty" ON public.customer_loyalty
  FOR SELECT
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );

-- Loyalty Punches: Users can view own
DROP POLICY IF EXISTS "Customers can view own punches" ON public.loyalty_punches;
CREATE POLICY "Customers can view own punches" ON public.loyalty_punches
  FOR SELECT
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );

-- Public read access for services and pricing
DROP POLICY IF EXISTS "Public can read services" ON public.services;
CREATE POLICY "Public can read services" ON public.services
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read service prices" ON public.service_prices;
CREATE POLICY "Public can read service prices" ON public.service_prices
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read addons" ON public.addons;
CREATE POLICY "Public can read addons" ON public.addons
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read breeds" ON public.breeds;
CREATE POLICY "Public can read breeds" ON public.breeds
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read memberships" ON public.memberships;
CREATE POLICY "Public can read memberships" ON public.memberships
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read gallery images" ON public.gallery_images;
CREATE POLICY "Public can read gallery images" ON public.gallery_images
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Public can read promo banners" ON public.promo_banners;
CREATE POLICY "Public can read promo banners" ON public.promo_banners
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read site content" ON public.site_content;
CREATE POLICY "Public can read site content" ON public.site_content
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read loyalty settings" ON public.loyalty_settings;
CREATE POLICY "Public can read loyalty settings" ON public.loyalty_settings
  FOR SELECT
  USING (true);

-- =====================================================
-- SEED DATA (Initial Setup)
-- =====================================================

-- Insert default loyalty settings
INSERT INTO public.loyalty_settings (default_threshold, is_enabled)
VALUES (9, true)
ON CONFLICT DO NOTHING;

-- Insert default breeds
INSERT INTO public.breeds (name, grooming_frequency_weeks, reminder_message) VALUES
  ('Labrador Retriever', 8, 'Time for a bath and nail trim!'),
  ('Golden Retriever', 6, 'Keep that beautiful coat healthy!'),
  ('Poodle', 4, 'Poodle coats need regular grooming!'),
  ('Yorkshire Terrier', 4, 'Keep those silky locks tangle-free!'),
  ('Shih Tzu', 4, 'Regular grooming keeps your Shih Tzu happy!'),
  ('Maltese', 4, 'Maltese coats need regular attention!'),
  ('Mixed Breed', 6, 'Regular grooming for a happy pup!')
ON CONFLICT (name) DO NOTHING;

-- Insert default services
DO $$
DECLARE
  basic_grooming_id UUID;
  premium_grooming_id UUID;
BEGIN
  -- Basic Grooming
  INSERT INTO public.services (name, description, duration_minutes, is_active, display_order)
  VALUES (
    'Basic Grooming',
    'Shampoo, conditioner, nail trimming, filing, ear plucking, anal gland sanitizing, sanitary cut',
    90,
    true,
    1
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO basic_grooming_id;

  -- Basic Grooming Prices
  IF basic_grooming_id IS NOT NULL THEN
    INSERT INTO public.service_prices (service_id, size, price) VALUES
      (basic_grooming_id, 'small', 40.00),
      (basic_grooming_id, 'medium', 55.00),
      (basic_grooming_id, 'large', 70.00),
      (basic_grooming_id, 'xlarge', 85.00)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Premium Grooming
  INSERT INTO public.services (name, description, duration_minutes, is_active, display_order)
  VALUES (
    'Premium Grooming',
    'Basic services plus full styling and breed-specific cut',
    120,
    true,
    2
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO premium_grooming_id;

  -- Premium Grooming Prices
  IF premium_grooming_id IS NOT NULL THEN
    INSERT INTO public.service_prices (service_id, size, price) VALUES
      (premium_grooming_id, 'small', 70.00),
      (premium_grooming_id, 'medium', 95.00),
      (premium_grooming_id, 'large', 125.00),
      (premium_grooming_id, 'xlarge', 150.00)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert default addons
INSERT INTO public.addons (name, description, price, is_active, display_order) VALUES
  ('Teeth Brushing', 'Professional teeth cleaning for oral hygiene', 10.00, true, 1),
  ('Pawdicure', 'Premium paw care with moisturizing treatment', 15.00, true, 2),
  ('Flea & Tick Treatment', 'Protective treatment for fleas and ticks', 25.00, true, 3),
  ('Long Hair/Sporting', 'Additional grooming for long or sporting coats', 10.00, true, 4)
ON CONFLICT DO NOTHING;
