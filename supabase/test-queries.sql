-- Test Queries for The Puppy Day Database
-- Use these queries in Supabase SQL Editor to verify your setup

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. Check all tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Verify seed data - Services
SELECT id, name, description, duration_minutes, is_active
FROM public.services
ORDER BY display_order;

-- 4. Verify seed data - Service Prices
SELECT s.name as service, sp.size, sp.price
FROM public.service_prices sp
JOIN public.services s ON s.id = sp.service_id
ORDER BY s.display_order, sp.size;

-- 5. Verify seed data - Add-ons
SELECT name, price, is_active
FROM public.addons
ORDER BY display_order;

-- 6. Verify seed data - Breeds
SELECT name, grooming_frequency_weeks
FROM public.breeds
ORDER BY name;

-- 7. Verify seed data - Loyalty Settings
SELECT default_threshold, is_enabled
FROM public.loyalty_settings;

-- 8. Check for users
SELECT id, email, first_name, last_name, role, created_at
FROM public.users
ORDER BY created_at DESC;

-- =====================================================
-- CREATE TEST DATA
-- =====================================================

-- Create a test user (if not using Supabase Auth UI)
-- Note: This only creates the public.users record, not the auth.users
-- Use the Supabase dashboard to create auth users properly
INSERT INTO public.users (id, email, first_name, last_name, role, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual UUID from auth.users
  'demo@example.com',
  'Demo',
  'Customer',
  'customer',
  '555-0100'
) ON CONFLICT (id) DO NOTHING;

-- Create test pet
INSERT INTO public.pets (owner_id, name, breed_custom, size, weight_lbs, gender)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with your user ID
  'Buddy',
  'Golden Retriever',
  'large',
  65.5,
  'male'
) ON CONFLICT DO NOTHING;

-- Create test appointment
INSERT INTO public.appointments (
  customer_id,
  pet_id,
  service_id,
  scheduled_at,
  duration_minutes,
  status,
  total_price
)
SELECT
  '00000000-0000-0000-0000-000000000001', -- Replace with your user ID
  p.id,
  s.id,
  NOW() + INTERVAL '3 days',
  90,
  'confirmed',
  70.00
FROM public.pets p
CROSS JOIN public.services s
WHERE p.owner_id = '00000000-0000-0000-0000-000000000001'
  AND s.name = 'Basic Grooming'
LIMIT 1;

-- Create test loyalty record
INSERT INTO public.customer_loyalty (customer_id, current_punches, total_visits)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with your user ID
  3,
  3
) ON CONFLICT (customer_id) DO NOTHING;

-- =====================================================
-- CUSTOMER PORTAL QUERIES (Test RLS)
-- =====================================================

-- These queries should only return data for the authenticated user
-- Test by running as different users

-- Get customer's pets
SELECT id, name, breed_custom, size, weight_lbs, photo_url
FROM public.pets
WHERE owner_id = auth.uid()
ORDER BY created_at DESC;

-- Get customer's appointments
SELECT
  a.id,
  a.scheduled_at,
  a.status,
  a.total_price,
  s.name as service_name,
  p.name as pet_name
FROM public.appointments a
JOIN public.services s ON a.service_id = s.id
JOIN public.pets p ON a.pet_id = p.id
WHERE a.customer_id = auth.uid()
ORDER BY a.scheduled_at DESC;

-- Get customer's loyalty status
SELECT
  current_punches,
  total_visits,
  free_washes_earned,
  free_washes_redeemed,
  (free_washes_earned - free_washes_redeemed) as free_washes_available
FROM public.customer_loyalty
WHERE customer_id = auth.uid();

-- Get customer's active membership
SELECT
  cm.*,
  m.name as membership_name,
  m.monthly_price
FROM public.customer_memberships cm
JOIN public.memberships m ON cm.membership_id = m.id
WHERE cm.customer_id = auth.uid()
  AND cm.status = 'active';

-- =====================================================
-- ADMIN QUERIES (Bypass RLS with service role)
-- =====================================================

-- Count all records
SELECT
  'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'pets', COUNT(*) FROM public.pets
UNION ALL
SELECT 'appointments', COUNT(*) FROM public.appointments
UNION ALL
SELECT 'services', COUNT(*) FROM public.services
UNION ALL
SELECT 'service_prices', COUNT(*) FROM public.service_prices
UNION ALL
SELECT 'addons', COUNT(*) FROM public.addons
UNION ALL
SELECT 'breeds', COUNT(*) FROM public.breeds
ORDER BY table_name;

-- Get appointment statistics
SELECT
  status,
  COUNT(*) as count,
  SUM(total_price) as total_revenue
FROM public.appointments
GROUP BY status
ORDER BY status;

-- Get popular services
SELECT
  s.name,
  COUNT(a.id) as booking_count,
  AVG(a.total_price) as avg_price
FROM public.services s
LEFT JOIN public.appointments a ON a.service_id = s.id
GROUP BY s.id, s.name
ORDER BY booking_count DESC;

-- Get customer stats
SELECT
  u.email,
  u.first_name,
  u.last_name,
  COUNT(DISTINCT p.id) as num_pets,
  COUNT(DISTINCT a.id) as num_appointments,
  COALESCE(cl.current_punches, 0) as loyalty_punches
FROM public.users u
LEFT JOIN public.pets p ON p.owner_id = u.id
LEFT JOIN public.appointments a ON a.customer_id = u.id
LEFT JOIN public.customer_loyalty cl ON cl.customer_id = u.id
WHERE u.role = 'customer'
GROUP BY u.id, u.email, u.first_name, u.last_name, cl.current_punches
ORDER BY num_appointments DESC;

-- =====================================================
-- TROUBLESHOOTING QUERIES
-- =====================================================

-- Check if RLS policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check triggers
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- CLEANUP QUERIES (Use with caution!)
-- =====================================================

-- Delete all test appointments
-- DELETE FROM public.appointments WHERE customer_id = '00000000-0000-0000-0000-000000000001';

-- Delete all test pets
-- DELETE FROM public.pets WHERE owner_id = '00000000-0000-0000-0000-000000000001';

-- Reset loyalty for a customer
-- DELETE FROM public.customer_loyalty WHERE customer_id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- USEFUL FUNCTIONS
-- =====================================================

-- Get current authenticated user ID
-- SELECT auth.uid();

-- Get current user's role
-- SELECT role FROM public.users WHERE id = auth.uid();

-- Check if current user is admin
-- SELECT EXISTS (
--   SELECT 1 FROM public.users
--   WHERE id = auth.uid()
--   AND role IN ('admin', 'groomer')
-- ) as is_admin;
