-- Migration: Remove checked_in Status
-- Created: 2025-12-28
-- Description: Removes the checked_in status from appointments, replacing it with in_progress

-- Step 1: Update all existing appointments with checked_in status to in_progress
UPDATE appointments
SET status = 'in_progress'
WHERE status = 'checked_in';

-- Step 2: Drop the old constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointments_status;

-- Step 3: Add new constraint without checked_in
ALTER TABLE appointments ADD CONSTRAINT chk_appointments_status
  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));
