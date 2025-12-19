/**
 * Staff Management Types
 * Types for staff directory, forms, commissions, and earnings
 */

import type { User, StaffCommission } from './database';

// ============================================
// Staff Directory Types
// ============================================

export interface StaffMemberWithStats {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'admin' | 'groomer';
  avatar_url: string | null;
  created_at: string;
  appointment_count: number;
  upcoming_appointments: number;
  avg_rating: number | null;
  commission_settings: StaffCommission | null;
}

export interface StaffDirectoryFilters {
  search: string;
  role: 'all' | 'admin' | 'groomer';
  status: 'all' | 'active' | 'inactive';
}

export type StaffViewMode = 'grid' | 'list';

// ============================================
// Staff Form Types
// ============================================

export interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'groomer';
  active?: boolean; // Only for edit mode
}

export interface StaffFormProps {
  staffId?: string; // undefined for create mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (staff: User) => void;
}

// ============================================
// Commission Settings Types
// ============================================

export type CommissionRateType = 'percentage' | 'flat_rate';

export interface ServiceOverride {
  service_id: string;
  rate: number;
}

export interface CommissionSettingsData {
  rate_type: CommissionRateType;
  rate: number;
  include_addons: boolean;
  service_overrides: ServiceOverride[] | null;
}

export interface CommissionPreviewCalculation {
  service_name: string;
  service_price: number;
  addons_total: number;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  notes: string[];
}

// ============================================
// Earnings Report Types
// ============================================

export interface EarningsReportFilters {
  start_date: string; // ISO date string
  end_date: string;
  groomer_id: string | 'all';
  group_by: 'day' | 'week' | 'month';
}

export interface EarningsSummary {
  total_services: number;
  total_revenue: number;
  total_commission: number;
  total_tips: number;
}

export interface GroomerEarnings {
  groomer_id: string;
  groomer_name: string;
  services_count: number;
  revenue: number;
  commission: number;
  tips: number;
}

export interface EarningsTimelineEntry {
  period: string;
  services_count: number;
  revenue: number;
  commission: number;
}

export interface EarningsReportData {
  summary: EarningsSummary;
  by_groomer: GroomerEarnings[];
  timeline: EarningsTimelineEntry[];
}

export type DatePreset = 'this_week' | 'this_month' | 'last_month' | 'custom';
