-- RLS Policies for Public Tables
-- Task 0232: Create RLS policies for public tables
-- Allows public read access to active/published public data

-- ============================================================================
-- Services Table
-- ============================================================================
-- Allow public to view active services
CREATE POLICY "Public can view active services"
  ON services
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- Service Prices Table
-- ============================================================================
-- Allow public to view all service prices (needed for booking flow)
CREATE POLICY "Public can view service prices"
  ON service_prices
  FOR SELECT
  USING (true);

-- ============================================================================
-- Addons Table
-- ============================================================================
-- Allow public to view active addons
CREATE POLICY "Public can view active addons"
  ON addons
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- Breeds Table
-- ============================================================================
-- Allow public to view all breeds (needed for pet registration)
CREATE POLICY "Public can view all breeds"
  ON breeds
  FOR SELECT
  USING (true);

-- ============================================================================
-- Gallery Images Table
-- ============================================================================
-- Allow public to view published gallery images only
CREATE POLICY "Public can view published gallery images"
  ON gallery_images
  FOR SELECT
  USING (is_published = true);

-- ============================================================================
-- Promo Banners Table
-- ============================================================================
-- Allow public to view active promo banners
CREATE POLICY "Public can view active promo banners"
  ON promo_banners
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- Before/After Pairs Table
-- ============================================================================
-- Allow public to view all before/after pairs (for marketing)
CREATE POLICY "Public can view before/after pairs"
  ON before_after_pairs
  FOR SELECT
  USING (true);

-- ============================================================================
-- Settings Table (Limited Public Access)
-- ============================================================================
-- Allow public to view business hours and other public settings
-- Note: Sensitive settings should be filtered in application layer
CREATE POLICY "Public can view settings"
  ON settings
  FOR SELECT
  USING (true);

-- ============================================================================
-- Site Content Table
-- ============================================================================
-- Allow public to view site content (hero, SEO, business info)
CREATE POLICY "Public can view site content"
  ON site_content
  FOR SELECT
  USING (true);
