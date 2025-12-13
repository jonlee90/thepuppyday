-- Migration: Fix services tables and add RLS policies
-- Date: 2024-12-12
-- Description: Add updated_at to services, add timestamps to service_prices, and enable RLS

-- =====================================================
-- 1. ADD MISSING COLUMNS
-- =====================================================

-- Add updated_at to services table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'services'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.services ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add created_at and updated_at to service_prices if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'service_prices'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.service_prices ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'service_prices'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.service_prices ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 2. CREATE UPDATE TRIGGERS
-- =====================================================

-- Create trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to services table
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to service_prices table
DROP TRIGGER IF EXISTS update_service_prices_updated_at ON public.service_prices;
CREATE TRIGGER update_service_prices_updated_at
    BEFORE UPDATE ON public.service_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Enable RLS on service_prices table
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES FOR SERVICES
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access for active services" ON public.services;
DROP POLICY IF EXISTS "Admin full access to services" ON public.services;

-- Policy: Anyone (including unauthenticated) can view active services
CREATE POLICY "Public read access for active services"
ON public.services
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Policy: Admins and groomers can view all services (including inactive)
CREATE POLICY "Staff can view all services"
ON public.services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'groomer')
  )
);

-- Policy: Admins have full access to services (insert, update, delete)
CREATE POLICY "Admin full access to services"
ON public.services
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

-- =====================================================
-- 5. CREATE RLS POLICIES FOR SERVICE_PRICES
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access for service prices" ON public.service_prices;
DROP POLICY IF EXISTS "Admin full access to service prices" ON public.service_prices;

-- Policy: Anyone can view service prices
CREATE POLICY "Public read access for service prices"
ON public.service_prices
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Admins have full access to service prices
CREATE POLICY "Admin full access to service prices"
ON public.service_prices
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

-- =====================================================
-- 6. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON POLICY "Public read access for active services" ON public.services IS
  'Allows anyone to view active services for the booking widget';

COMMENT ON POLICY "Staff can view all services" ON public.services IS
  'Allows admins and groomers to view all services including inactive ones';

COMMENT ON POLICY "Admin full access to services" ON public.services IS
  'Grants full CRUD access to services for admin users';

COMMENT ON POLICY "Public read access for service prices" ON public.service_prices IS
  'Allows anyone to view service prices for the booking widget';

COMMENT ON POLICY "Admin full access to service prices" ON public.service_prices IS
  'Grants full CRUD access to service prices for admin users';

-- =====================================================
-- 7. VERIFY TABLES EXIST
-- =====================================================

-- This will fail if tables don't exist, alerting us to the problem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'services'
    ) THEN
        RAISE EXCEPTION 'services table does not exist';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'service_prices'
    ) THEN
        RAISE EXCEPTION 'service_prices table does not exist';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Services tables migration completed successfully';
END $$;
