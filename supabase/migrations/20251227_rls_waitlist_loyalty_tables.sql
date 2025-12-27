-- RLS Policies for Waitlist and Loyalty Tables
-- Task 0234: Create RLS policies for waitlist and loyalty tables
-- Ensures customers can manage waitlist entries and view loyalty data

-- ============================================================================
-- Waitlist Table
-- ============================================================================
-- Customers can view their own waitlist entries
CREATE POLICY "Customers can view own waitlist entries"
  ON waitlist
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Customers can create waitlist entries for themselves
CREATE POLICY "Customers can create own waitlist entries"
  ON waitlist
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own waitlist entries
CREATE POLICY "Customers can update own waitlist entries"
  ON waitlist
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Customers can delete their own waitlist entries
CREATE POLICY "Customers can delete own waitlist entries"
  ON waitlist
  FOR DELETE
  USING (auth.uid() = customer_id);

-- ============================================================================
-- Customer Memberships Table
-- ============================================================================
-- Customers can view their own memberships
CREATE POLICY "Customers can view own memberships"
  ON customer_memberships
  FOR SELECT
  USING (auth.uid() = customer_id);

-- ============================================================================
-- Loyalty Points Table
-- ============================================================================
-- Customers can view their own loyalty points
CREATE POLICY "Customers can view own loyalty points"
  ON loyalty_points
  FOR SELECT
  USING (auth.uid() = customer_id);

-- ============================================================================
-- Loyalty Transactions Table
-- ============================================================================
-- Customers can view their own loyalty transactions
CREATE POLICY "Customers can view own loyalty transactions"
  ON loyalty_transactions
  FOR SELECT
  USING (auth.uid() = customer_id);

-- ============================================================================
-- Customer Flags Table
-- ============================================================================
-- Customers can view flags on their own account
CREATE POLICY "Customers can view own flags"
  ON customer_flags
  FOR SELECT
  USING (auth.uid() = customer_id);
