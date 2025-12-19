-- Migration: Add PostgreSQL functions for loyalty operations with proper transactions
-- Addresses: Code review critical issue #2 - Database transactions
-- Created: 2025-01-19

-- Function: Award referral bonuses with ACID guarantees
CREATE OR REPLACE FUNCTION award_referral_bonuses(
  p_referrer_id UUID,
  p_referee_id UUID,
  p_appointment_id UUID,
  p_referrer_bonus_punches INT,
  p_referee_bonus_punches INT,
  p_punch_threshold INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_referrer_loyalty RECORD;
  v_referee_loyalty RECORD;
  v_referrer_new_punches INT;
  v_referee_new_punches INT;
  v_referrer_earned_reward BOOLEAN;
  v_referee_earned_reward BOOLEAN;
  v_cycle_number INT;
  v_result JSON;
BEGIN
  -- Get referrer loyalty record
  SELECT * INTO v_referrer_loyalty
  FROM customer_loyalty
  WHERE customer_id = p_referrer_id
  FOR UPDATE; -- Lock for transaction

  -- Get referee loyalty record
  SELECT * INTO v_referee_loyalty
  FROM customer_loyalty
  WHERE customer_id = p_referee_id
  FOR UPDATE; -- Lock for transaction

  -- Calculate new punches for referrer
  IF v_referrer_loyalty IS NOT NULL AND p_referrer_bonus_punches > 0 THEN
    v_referrer_new_punches := v_referrer_loyalty.current_punches + p_referrer_bonus_punches;
    v_referrer_earned_reward := v_referrer_new_punches >= p_punch_threshold;
    v_cycle_number := FLOOR(v_referrer_loyalty.total_visits::FLOAT / p_punch_threshold) + 1;

    -- Update referrer loyalty
    UPDATE customer_loyalty
    SET
      current_punches = CASE
        WHEN v_referrer_earned_reward THEN v_referrer_new_punches - p_punch_threshold
        ELSE v_referrer_new_punches
      END,
      free_washes_earned = CASE
        WHEN v_referrer_earned_reward THEN free_washes_earned + 1
        ELSE free_washes_earned
      END,
      updated_at = NOW()
    WHERE id = v_referrer_loyalty.id;

    -- Create punch records for referrer
    INSERT INTO loyalty_punches (customer_id, customer_loyalty_id, appointment_id, cycle_number, punch_number, service_name, earned_at)
    SELECT
      p_referrer_id,
      v_referrer_loyalty.id,
      p_appointment_id,
      v_cycle_number,
      v_referrer_loyalty.current_punches + seq,
      'Referral Bonus',
      NOW()
    FROM generate_series(1, p_referrer_bonus_punches) AS seq;

    -- Create redemption if earned
    IF v_referrer_earned_reward THEN
      INSERT INTO loyalty_redemptions (customer_loyalty_id, cycle_number, status, created_at)
      VALUES (v_referrer_loyalty.id, v_cycle_number, 'pending', NOW());
    END IF;
  END IF;

  -- Calculate new punches for referee
  IF v_referee_loyalty IS NOT NULL AND p_referee_bonus_punches > 0 THEN
    v_referee_new_punches := v_referee_loyalty.current_punches + p_referee_bonus_punches;
    v_referee_earned_reward := v_referee_new_punches >= p_punch_threshold;
    v_cycle_number := FLOOR(v_referee_loyalty.total_visits::FLOAT / p_punch_threshold) + 1;

    -- Update referee loyalty
    UPDATE customer_loyalty
    SET
      current_punches = CASE
        WHEN v_referee_earned_reward THEN v_referee_new_punches - p_punch_threshold
        ELSE v_referee_new_punches
      END,
      free_washes_earned = CASE
        WHEN v_referee_earned_reward THEN free_washes_earned + 1
        ELSE free_washes_earned
      END,
      updated_at = NOW()
    WHERE id = v_referee_loyalty.id;

    -- Create punch records for referee
    INSERT INTO loyalty_punches (customer_id, customer_loyalty_id, appointment_id, cycle_number, punch_number, service_name, earned_at)
    SELECT
      p_referee_id,
      v_referee_loyalty.id,
      p_appointment_id,
      v_cycle_number,
      v_referee_loyalty.current_punches + seq,
      'Referral Bonus',
      NOW()
    FROM generate_series(1, p_referee_bonus_punches) AS seq;

    -- Create redemption if earned
    IF v_referee_earned_reward THEN
      INSERT INTO loyalty_redemptions (customer_loyalty_id, cycle_number, status, created_at)
      VALUES (v_referee_loyalty.id, v_cycle_number, 'pending', NOW());
    END IF;
  END IF;

  -- Build result JSON
  v_result := json_build_object(
    'success', true,
    'referrer_bonus_awarded', COALESCE(p_referrer_bonus_punches, 0),
    'referee_bonus_awarded', COALESCE(p_referee_bonus_punches, 0),
    'referrer_earned_reward', COALESCE(v_referrer_earned_reward, false),
    'referee_earned_reward', COALESCE(v_referee_earned_reward, false)
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will auto-rollback on error
    RAISE;
END;
$$;

-- Function: Award punch for appointment with ACID guarantees
CREATE OR REPLACE FUNCTION award_punch_for_appointment(
  p_customer_id UUID,
  p_appointment_id UUID,
  p_service_id UUID,
  p_service_name TEXT,
  p_punch_threshold INT,
  p_first_visit_bonus INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_loyalty RECORD;
  v_is_first_visit BOOLEAN;
  v_punches_to_award INT;
  v_new_punches INT;
  v_earned_reward BOOLEAN;
  v_cycle_number INT;
  v_result JSON;
BEGIN
  -- Get loyalty record with lock
  SELECT * INTO v_loyalty
  FROM customer_loyalty
  WHERE customer_id = p_customer_id
  FOR UPDATE;

  -- Check if this is first visit
  v_is_first_visit := v_loyalty.total_visits = 0;

  -- Calculate punches to award (1 + first visit bonus if applicable)
  v_punches_to_award := 1 + CASE WHEN v_is_first_visit THEN p_first_visit_bonus ELSE 0 END;

  -- Calculate new punch count
  v_new_punches := v_loyalty.current_punches + v_punches_to_award;
  v_earned_reward := v_new_punches >= p_punch_threshold;
  v_cycle_number := FLOOR(v_loyalty.total_visits::FLOAT / p_punch_threshold) + 1;

  -- Update loyalty record
  UPDATE customer_loyalty
  SET
    current_punches = CASE
      WHEN v_earned_reward THEN v_new_punches - p_punch_threshold
      ELSE v_new_punches
    END,
    total_visits = total_visits + 1,
    free_washes_earned = CASE
      WHEN v_earned_reward THEN free_washes_earned + 1
      ELSE free_washes_earned
    END,
    updated_at = NOW()
  WHERE id = v_loyalty.id;

  -- Create punch records
  INSERT INTO loyalty_punches (customer_id, customer_loyalty_id, appointment_id, cycle_number, punch_number, service_name, earned_at)
  SELECT
    p_customer_id,
    v_loyalty.id,
    p_appointment_id,
    v_cycle_number,
    v_loyalty.current_punches + seq,
    p_service_name,
    NOW()
  FROM generate_series(1, v_punches_to_award) AS seq;

  -- Create redemption if earned
  IF v_earned_reward THEN
    INSERT INTO loyalty_redemptions (customer_loyalty_id, cycle_number, status, created_at)
    VALUES (v_loyalty.id, v_cycle_number, 'pending', NOW());
  END IF;

  -- Build result
  v_result := json_build_object(
    'success', true,
    'punches_awarded', v_punches_to_award,
    'current_punches', CASE WHEN v_earned_reward THEN v_new_punches - p_punch_threshold ELSE v_new_punches END,
    'reward_earned', v_earned_reward,
    'cycle_number', v_cycle_number,
    'is_first_visit', v_is_first_visit
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will auto-rollback on error
    RAISE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_referral_bonuses TO authenticated;
GRANT EXECUTE ON FUNCTION award_punch_for_appointment TO authenticated;

-- Add comments
COMMENT ON FUNCTION award_referral_bonuses IS 'Awards referral bonuses to both referrer and referee with ACID transaction guarantees';
COMMENT ON FUNCTION award_punch_for_appointment IS 'Awards loyalty punches for completed appointment with ACID transaction guarantees';
