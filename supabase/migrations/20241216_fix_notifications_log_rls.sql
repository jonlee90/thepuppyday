-- Migration: Fix RLS Policy for Customer Access to Notifications Log
-- Date: 2024-12-16
-- Description: Corrects the RLS policy that uses non-existent 'recipient_id' column
--              Should use 'customer_id' instead for customer access to their notifications

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "customers_view_own_notifications_log" ON public.notifications_log;

-- Create the corrected policy using customer_id instead of recipient_id
CREATE POLICY "customers_view_own_notifications_log"
  ON public.notifications_log
  FOR SELECT
  TO authenticated
  USING (
    -- Customer can view their own notifications
    customer_id = auth.uid() OR
    -- Customer can view notifications related to their appointments
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.customer_id = auth.uid()
      AND (
        notifications_log.type LIKE 'booking_%' OR
        notifications_log.type LIKE 'appointment_%' OR
        notifications_log.type LIKE 'status_%' OR
        notifications_log.type LIKE 'report_card_%'
      )
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "customers_view_own_notifications_log" ON public.notifications_log IS
  'Allows authenticated customers to view notifications sent to them directly (via customer_id) or related to their appointments';
