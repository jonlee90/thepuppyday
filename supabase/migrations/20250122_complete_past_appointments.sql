-- Migration to mark all past appointments as completed
-- This updates appointments where:
-- 1. scheduled_at is today or earlier
-- 2. status is NOT already completed, cancelled, or no_show

-- Display appointments that will be updated (for verification)
SELECT
  id,
  scheduled_at,
  status,
  customer_id,
  pet_id,
  service_id
FROM appointments
WHERE scheduled_at <= NOW()
  AND status NOT IN ('completed', 'cancelled', 'no_show')
ORDER BY scheduled_at DESC;

-- Perform the update
UPDATE appointments
SET
  status = 'completed',
  updated_at = NOW()
WHERE scheduled_at <= NOW()
  AND status NOT IN ('completed', 'cancelled', 'no_show');

-- Display count of updated appointments
SELECT COUNT(*) as updated_count
FROM appointments
WHERE scheduled_at <= NOW()
  AND status = 'completed';
