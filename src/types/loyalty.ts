/**
 * Loyalty Punch Card System Types
 * "Buy X, Get 1 Free Wash" model
 */

import type { BaseEntity } from './database';

// Loyalty Settings (global configuration)
export interface LoyaltySettings {
  id: string;
  default_threshold: number; // Default: 9 (Buy 9, get 10th free)
  is_enabled: boolean;
  updated_at: string;
}

// Customer Loyalty Record
export interface CustomerLoyalty extends BaseEntity {
  customer_id: string;
  current_punches: number; // Current cycle punches (0 to threshold)
  threshold_override: number | null; // Custom threshold for VIP customers (null = use default)
  total_visits: number; // Lifetime completed appointments
  free_washes_earned: number; // Total free washes earned
  free_washes_redeemed: number; // Total free washes used
  updated_at: string;
}

// Individual Punch Record
export interface LoyaltyPunch extends BaseEntity {
  customer_loyalty_id: string;
  appointment_id: string;
  cycle_number: number; // Which reward cycle this punch belongs to
  punch_number: number; // Position in the cycle (1 to threshold)
  earned_at: string;
  // Joined data
  appointment?: {
    id: string;
    scheduled_at: string;
    service?: { name: string };
    pet?: { name: string };
  };
}

// Free Wash Redemption Record
export interface LoyaltyRedemption extends BaseEntity {
  customer_loyalty_id: string;
  appointment_id: string | null; // Appointment where the free wash was used
  cycle_number: number; // Which cycle earned this free wash
  redeemed_at: string | null; // When it was actually used (null if pending)
  status: 'pending' | 'redeemed' | 'expired';
}

// API Response Types for Customer Portal
export interface LoyaltyStatus {
  currentPunches: number;
  threshold: number; // Effective threshold (override or default)
  isCustomThreshold: boolean; // True if customer has VIP threshold
  freeWashesAvailable: number; // Unredeemed free washes
  totalVisits: number;
  freeWashesEarned: number;
  freeWashesRedeemed: number;
  progressPercentage: number; // 0-100
  punchesUntilFree: number;
  isCloseToGoal: boolean; // Within 2 punches
  hasEarnedFreeWash: boolean; // Just reached threshold
}

export interface LoyaltyHistoryItem {
  id: string;
  type: 'punch' | 'redemption';
  date: string;
  cycleNumber: number;
  punchNumber?: number; // For punches
  serviceName?: string;
  petName?: string;
  appointmentId?: string;
  status?: 'pending' | 'redeemed' | 'expired'; // For redemptions
}

export interface LoyaltyCycle {
  cycleNumber: number;
  punches: LoyaltyHistoryItem[];
  redemption?: LoyaltyHistoryItem;
  isComplete: boolean;
  isCurrentCycle: boolean;
}

export interface LoyaltyHistoryResponse {
  cycles: LoyaltyCycle[];
  currentCycleNumber: number;
}

// Widget Props Types
export interface PunchCardProps {
  currentPunches: number;
  threshold: number;
  freeWashesAvailable: number;
  isCloseToGoal: boolean;
  punches?: Array<{
    punchNumber: number;
    date: string;
    serviceName?: string;
  }>;
  onRedeemClick?: () => void;
  onViewHistoryClick?: () => void;
  showConfetti?: boolean;
  compact?: boolean; // For dashboard widget
}

// Input Types
export interface CreateCustomerLoyaltyInput {
  customer_id: string;
  threshold_override?: number;
}

export interface RecordPunchInput {
  customer_id: string;
  appointment_id: string;
}

export interface RedeemFreeWashInput {
  customer_id: string;
  appointment_id?: string; // Optional - can reserve before booking
}
