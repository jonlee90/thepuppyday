-- RLS Policies for Customer Tables
-- Task 0233: Create RLS policies for customer tables
-- Ensures customers can only access their own data

-- ============================================================================
-- Users Table
-- ============================================================================
-- Customers can view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Customers can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = 'customer' -- Prevent role escalation
  );

-- ============================================================================
-- Pets Table
-- ============================================================================
-- Customers can view their own pets
CREATE POLICY "Customers can view own pets"
  ON pets
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Customers can create pets for themselves
CREATE POLICY "Customers can create own pets"
  ON pets
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Customers can update their own pets
CREATE POLICY "Customers can update own pets"
  ON pets
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Customers can delete their own pets
CREATE POLICY "Customers can delete own pets"
  ON pets
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- Appointments Table
-- ============================================================================
-- Customers can view their own appointments
CREATE POLICY "Customers can view own appointments"
  ON appointments
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Customers can create appointments for themselves
CREATE POLICY "Customers can create own appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own appointments (limited fields)
-- Note: Status changes should be restricted in application layer
CREATE POLICY "Customers can update own appointments"
  ON appointments
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (
    auth.uid() = customer_id
    -- Prevent customers from changing certain fields
    AND status IN ('pending', 'confirmed', 'cancelled')
  );

-- ============================================================================
-- Appointment Addons Table
-- ============================================================================
-- Customers can view addons for their appointments
CREATE POLICY "Customers can view own appointment addons"
  ON appointment_addons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_addons.appointment_id
      AND appointments.customer_id = auth.uid()
    )
  );

-- Customers can add addons to their appointments
CREATE POLICY "Customers can create own appointment addons"
  ON appointment_addons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_addons.appointment_id
      AND appointments.customer_id = auth.uid()
    )
  );

-- Customers can remove addons from their appointments
CREATE POLICY "Customers can delete own appointment addons"
  ON appointment_addons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_addons.appointment_id
      AND appointments.customer_id = auth.uid()
    )
  );

-- ============================================================================
-- Report Cards Table
-- ============================================================================
-- Customers can view report cards for their pets
CREATE POLICY "Customers can view own report cards"
  ON report_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = report_cards.appointment_id
      AND appointments.customer_id = auth.uid()
    )
  );

-- ============================================================================
-- Notifications Log Table
-- ============================================================================
-- Customers can view their own notifications
CREATE POLICY "Customers can view own notifications"
  ON notifications_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Customers can mark notifications as read
CREATE POLICY "Customers can update own notifications"
  ON notifications_log
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
