-- ==============================================================================
-- Migration: Admin RLS Policies
-- Task: 0235 - Create RLS policies for admin access to all tables
-- Description: Grant admins full access to customer data, services, and system tables
-- ==============================================================================

-- Note: This migration assumes:
-- 1. RLS is already enabled on all tables (via 20251228_enable_rls.sql)
-- 2. Helper functions exist: public.is_admin() and auth.is_admin_or_staff()
-- 3. Customer-specific policies are already created (via 20251227_rls_*.sql)

-- ==============================================================================
-- USERS TABLE - Admin Policies (already exist, documented for reference)
-- ==============================================================================

-- Admin policies for users table are created in 20250120_fix_users_rls_infinite_recursion.sql
-- Including:
-- - users_select_admin: Admins can view all users
-- - users_update_admin: Admins can update any user
-- - users_insert_admin: Admins can create users
-- - users_delete_admin: Admins can delete users

-- ==============================================================================
-- PETS TABLE - Admin Full Access
-- ==============================================================================

-- Admin can view all pets
DROP POLICY IF EXISTS "Admins can view all pets" ON public.pets;
CREATE POLICY "Admins can view all pets"
  ON public.pets
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can view all pets" ON public.pets IS
  'Allows admins to view all customer pets for management and appointment booking.';

-- Admin can create pets on behalf of customers
DROP POLICY IF EXISTS "Admins can create pets" ON public.pets;
CREATE POLICY "Admins can create pets"
  ON public.pets
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can create pets" ON public.pets IS
  'Allows admins to create pet profiles when booking appointments for customers.';

-- Admin can update all pets
DROP POLICY IF EXISTS "Admins can update all pets" ON public.pets;
CREATE POLICY "Admins can update all pets"
  ON public.pets
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can update all pets" ON public.pets IS
  'Allows admins to update pet information, medical notes, and photos.';

-- Admin can delete pets
DROP POLICY IF EXISTS "Admins can delete pets" ON public.pets;
CREATE POLICY "Admins can delete pets"
  ON public.pets
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can delete pets" ON public.pets IS
  'Allows admins to delete pet profiles (soft delete via is_active preferred).';

-- ==============================================================================
-- APPOINTMENTS TABLE - Admin & Groomer Access
-- ==============================================================================

-- Admins and groomers can view all appointments
DROP POLICY IF EXISTS "Staff can view all appointments" ON public.appointments;
CREATE POLICY "Staff can view all appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_staff());

COMMENT ON POLICY "Staff can view all appointments" ON public.appointments IS
  'Allows admins and groomers to view all appointments for schedule management.';

-- Admin can create appointments
DROP POLICY IF EXISTS "Admins can create appointments" ON public.appointments;
CREATE POLICY "Admins can create appointments"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can create appointments" ON public.appointments IS
  'Allows admins to manually create appointments for customers.';

-- Admins and groomers can update appointments
DROP POLICY IF EXISTS "Staff can update appointments" ON public.appointments;
CREATE POLICY "Staff can update appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (auth.is_admin_or_staff())
  WITH CHECK (auth.is_admin_or_staff());

COMMENT ON POLICY "Staff can update appointments" ON public.appointments IS
  'Allows admins and groomers to update appointment details, status, and notes.';

-- Admin can delete appointments
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can delete appointments" ON public.appointments IS
  'Allows admins to delete appointments (cancellation preferred over deletion).';

-- ==============================================================================
-- APPOINTMENT_ADDONS TABLE - Admin & Groomer Access
-- ==============================================================================

-- Staff can view all appointment addons
DROP POLICY IF EXISTS "Staff can view appointment addons" ON public.appointment_addons;
CREATE POLICY "Staff can view appointment addons"
  ON public.appointment_addons
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_staff());

COMMENT ON POLICY "Staff can view appointment addons" ON public.appointment_addons IS
  'Allows staff to view addons for pricing and service delivery.';

-- Admin can manage appointment addons
DROP POLICY IF EXISTS "Admins can manage appointment addons" ON public.appointment_addons;
CREATE POLICY "Admins can manage appointment addons"
  ON public.appointment_addons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage appointment addons" ON public.appointment_addons IS
  'Allows admins full control over appointment addons.';

-- ==============================================================================
-- SERVICES TABLE - Admin Management
-- ==============================================================================

-- Admin can manage services
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
  ON public.services
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage services" ON public.services IS
  'Allows admins to create, update, and manage grooming services.';

-- ==============================================================================
-- SERVICE_PRICES TABLE - Admin Management
-- ==============================================================================

-- Admin can manage service prices
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage service prices" ON public.service_prices;
CREATE POLICY "Admins can manage service prices"
  ON public.service_prices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage service prices" ON public.service_prices IS
  'Allows admins to set and update size-based pricing for services.';

-- ==============================================================================
-- ADDONS TABLE - Admin Management
-- ==============================================================================

-- Admin can manage addons
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage addons" ON public.addons;
CREATE POLICY "Admins can manage addons"
  ON public.addons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage addons" ON public.addons IS
  'Allows admins to create and manage service addons.';

-- ==============================================================================
-- BREEDS TABLE - Admin Management
-- ==============================================================================

-- Admin can manage breeds
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage breeds" ON public.breeds;
CREATE POLICY "Admins can manage breeds"
  ON public.breeds
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage breeds" ON public.breeds IS
  'Allows admins to add and update dog breeds with grooming frequency.';

-- ==============================================================================
-- WAITLIST TABLE - Admin Full Access
-- ==============================================================================

-- Admin can view all waitlist entries
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can view waitlist" ON public.waitlist IS
  'Allows admins to view all waitlist entries for slot management.';

-- Admin can manage waitlist entries
DROP POLICY IF EXISTS "Admins can manage waitlist" ON public.waitlist;
CREATE POLICY "Admins can manage waitlist"
  ON public.waitlist
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage waitlist" ON public.waitlist IS
  'Allows admins to create, update, and process waitlist entries.';

-- ==============================================================================
-- REPORT_CARDS TABLE - Admin & Groomer Full Access
-- ==============================================================================

-- Staff can view all report cards
DROP POLICY IF EXISTS "Staff can view all report cards" ON public.report_cards;
CREATE POLICY "Staff can view all report cards"
  ON public.report_cards
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_staff());

COMMENT ON POLICY "Staff can view all report cards" ON public.report_cards IS
  'Allows staff to view all report cards for customer service and quality assurance.';

-- Staff can create report cards
DROP POLICY IF EXISTS "Staff can create report cards" ON public.report_cards;
CREATE POLICY "Staff can create report cards"
  ON public.report_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin_or_staff());

COMMENT ON POLICY "Staff can create report cards" ON public.report_cards IS
  'Allows groomers to create post-grooming report cards.';

-- Staff can update report cards
DROP POLICY IF EXISTS "Staff can update report cards" ON public.report_cards;
CREATE POLICY "Staff can update report cards"
  ON public.report_cards
  FOR UPDATE
  TO authenticated
  USING (auth.is_admin_or_staff())
  WITH CHECK (auth.is_admin_or_staff());

COMMENT ON POLICY "Staff can update report cards" ON public.report_cards IS
  'Allows staff to update report cards before sending to customers.';

-- Admin can delete report cards
DROP POLICY IF EXISTS "Admins can delete report cards" ON public.report_cards;
CREATE POLICY "Admins can delete report cards"
  ON public.report_cards
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can delete report cards" ON public.report_cards IS
  'Allows admins to delete report cards if needed.';

-- ==============================================================================
-- CUSTOMER_FLAGS TABLE - Admin Full Access
-- ==============================================================================

-- Admin can view all customer flags
DROP POLICY IF EXISTS "Admins can view customer flags" ON public.customer_flags;
CREATE POLICY "Admins can view customer flags"
  ON public.customer_flags
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can view customer flags" ON public.customer_flags IS
  'Allows admins to view all customer flags for account management.';

-- Admin can create customer flags
DROP POLICY IF EXISTS "Admins can create customer flags" ON public.customer_flags;
CREATE POLICY "Admins can create customer flags"
  ON public.customer_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can create customer flags" ON public.customer_flags IS
  'Allows admins to flag customer accounts (VIP, special needs, payment issues, etc).';

-- Admin can update customer flags
DROP POLICY IF EXISTS "Admins can update customer flags" ON public.customer_flags;
CREATE POLICY "Admins can update customer flags"
  ON public.customer_flags
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can update customer flags" ON public.customer_flags IS
  'Allows admins to update or deactivate customer flags.';

-- Admin can delete customer flags
DROP POLICY IF EXISTS "Admins can delete customer flags" ON public.customer_flags;
CREATE POLICY "Admins can delete customer flags"
  ON public.customer_flags
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can delete customer flags" ON public.customer_flags IS
  'Allows admins to remove customer flags.';

-- ==============================================================================
-- NOTIFICATIONS_LOG TABLE - Admin Full Access
-- ==============================================================================

-- Admin can view all notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications_log;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can view all notifications" ON public.notifications_log IS
  'Allows admins to view notification history for debugging and customer service.';

-- Admin can create notifications (manual send)
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications_log;
CREATE POLICY "Admins can create notifications"
  ON public.notifications_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can create notifications" ON public.notifications_log IS
  'Allows admins to manually send notifications to customers.';

-- Admin can update notifications (retry, status updates)
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications_log;
CREATE POLICY "Admins can update notifications"
  ON public.notifications_log
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can update notifications" ON public.notifications_log IS
  'Allows admins to retry failed notifications or update status.';

-- ==============================================================================
-- CUSTOMER_MEMBERSHIPS TABLE - Admin Full Access
-- ==============================================================================

-- Admin can view all memberships
DROP POLICY IF EXISTS "Admins can view all customer memberships" ON public.customer_memberships;
CREATE POLICY "Admins can view all customer memberships"
  ON public.customer_memberships
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can view all customer memberships" ON public.customer_memberships IS
  'Allows admins to view all customer membership subscriptions.';

-- Admin can manage customer memberships
DROP POLICY IF EXISTS "Admins can manage customer memberships" ON public.customer_memberships;
CREATE POLICY "Admins can manage customer memberships"
  ON public.customer_memberships
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage customer memberships" ON public.customer_memberships IS
  'Allows admins to create, update, and cancel customer memberships.';

-- ==============================================================================
-- LOYALTY_POINTS TABLE - Admin Full Access
-- ==============================================================================

-- Admin can view all loyalty points
DROP POLICY IF EXISTS "Admins can view loyalty points" ON public.loyalty_points;
CREATE POLICY "Admins can view loyalty points"
  ON public.loyalty_points
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can view loyalty points" ON public.loyalty_points IS
  'Allows admins to view customer loyalty point balances.';

-- Admin can manage loyalty points
DROP POLICY IF EXISTS "Admins can manage loyalty points" ON public.loyalty_points;
CREATE POLICY "Admins can manage loyalty points"
  ON public.loyalty_points
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage loyalty points" ON public.loyalty_points IS
  'Allows admins to adjust loyalty points for customer service.';

-- ==============================================================================
-- LOYALTY_TRANSACTIONS TABLE - Admin Full Access
-- ==============================================================================

-- Admin can view all loyalty transactions
DROP POLICY IF EXISTS "Admins can view loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Admins can view loyalty transactions"
  ON public.loyalty_transactions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can view loyalty transactions" ON public.loyalty_transactions IS
  'Allows admins to view loyalty transaction history.';

-- Admin can create loyalty transactions (manual adjustments)
DROP POLICY IF EXISTS "Admins can create loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Admins can create loyalty transactions"
  ON public.loyalty_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can create loyalty transactions" ON public.loyalty_transactions IS
  'Allows admins to manually adjust loyalty points with audit trail.';

-- ==============================================================================
-- GALLERY_IMAGES TABLE - Admin Management
-- ==============================================================================

-- Admin can manage gallery images
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
CREATE POLICY "Admins can manage gallery images"
  ON public.gallery_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage gallery images" ON public.gallery_images IS
  'Allows admins to upload, publish, and manage gallery images.';

-- ==============================================================================
-- PROMO_BANNERS TABLE - Admin Management
-- ==============================================================================

-- Admin can manage promo banners
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage promo banners" ON public.promo_banners;
CREATE POLICY "Admins can manage promo banners"
  ON public.promo_banners
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage promo banners" ON public.promo_banners IS
  'Allows admins to create and manage promotional banners.';

-- ==============================================================================
-- BEFORE_AFTER_PAIRS TABLE - Admin Management
-- ==============================================================================

-- Admin can manage before/after pairs
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage before after pairs" ON public.before_after_pairs;
CREATE POLICY "Admins can manage before after pairs"
  ON public.before_after_pairs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage before after pairs" ON public.before_after_pairs IS
  'Allows admins to upload and manage before/after transformation photos.';

-- ==============================================================================
-- SITE_CONTENT TABLE - Admin Management
-- ==============================================================================

-- Admin can manage site content
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
CREATE POLICY "Admins can manage site content"
  ON public.site_content
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage site content" ON public.site_content IS
  'Allows admins to update website content via CMS.';

-- ==============================================================================
-- SETTINGS TABLE - Admin Management
-- ==============================================================================

-- Admin can manage settings
-- Note: Public read policy already exists in 20251227_rls_public_tables.sql
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
  ON public.settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can manage settings" ON public.settings IS
  'Allows admins to configure business settings and preferences.';

-- ==============================================================================
-- OPTIONAL TABLES (create policies if tables exist)
-- ==============================================================================

-- PAYMENTS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments';
    EXECUTE 'CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments';
    EXECUTE 'CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    RAISE NOTICE 'Created admin policies for payments table';
  END IF;
END $$;

-- STAFF_COMMISSIONS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff_commissions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage staff commissions" ON public.staff_commissions';
    EXECUTE 'CREATE POLICY "Admins can manage staff commissions" ON public.staff_commissions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    RAISE NOTICE 'Created admin policies for staff_commissions table';
  END IF;
END $$;

-- MEMBERSHIPS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'memberships') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage membership plans" ON public.memberships';
    EXECUTE 'CREATE POLICY "Admins can manage membership plans" ON public.memberships FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Public can view active memberships" ON public.memberships';
    EXECUTE 'CREATE POLICY "Public can view active memberships" ON public.memberships FOR SELECT USING (is_active = true)';
    RAISE NOTICE 'Created admin policies for memberships table';
  END IF;
END $$;

-- REVIEWS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews';
    EXECUTE 'CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews';
    EXECUTE 'CREATE POLICY "Public can view published reviews" ON public.reviews FOR SELECT USING (is_published = true)';
    RAISE NOTICE 'Created admin policies for reviews table';
  END IF;
END $$;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  table_name TEXT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin RLS Policies Created:';
  RAISE NOTICE '========================================';

  FOR table_name IN
    SELECT DISTINCT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%Admin%' OR policyname LIKE '%Staff%'
    ORDER BY tablename
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_name
    AND (policyname LIKE '%Admin%' OR policyname LIKE '%Staff%');

    RAISE NOTICE 'Table: % - % admin/staff policies', table_name, policy_count;
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
