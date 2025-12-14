-- Script to verify and apply services table fixes
-- Run this in Supabase SQL Editor or via psql

-- First, let's check the current state of the tables
SELECT 'Checking services table structure...' as status;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'services'
ORDER BY ordinal_position;

SELECT 'Checking service_prices table structure...' as status;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'service_prices'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 'Checking RLS status...' as status;

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('services', 'service_prices');

-- Check existing policies
SELECT 'Checking existing RLS policies...' as status;

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('services', 'service_prices');

-- Now apply the migration
\i supabase/migrations/20241212_services_rls_and_fixes.sql

-- Verify the changes
SELECT 'Verifying changes...' as status;

SELECT 'Services table after migration:' as status;
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'services'
ORDER BY ordinal_position;

SELECT 'Service_prices table after migration:' as status;
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'service_prices'
ORDER BY ordinal_position;

SELECT 'RLS policies after migration:' as status;
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('services', 'service_prices');
