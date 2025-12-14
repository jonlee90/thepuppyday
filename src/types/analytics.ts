/**
 * Analytics types for The Puppy Day
 * Phase 6: Business Analytics & Reporting
 */

import type { BaseEntity, AppointmentStatus, PaymentStatus } from "./database";

/**
 * Cache key for analytics metrics
 * Format: {metric_type}:{date_range}:{filters}
 */
export type MetricKey = string;

/**
 * Date range for analytics queries
 */
export interface DateRange {
  start_date: string;
  end_date: string;
}

/**
 * Predefined date range shortcuts
 */
export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "custom";

/**
 * Analytics cache entity
 * Stores pre-computed metrics for performance
 */
export interface AnalyticsCache extends BaseEntity {
  metric_key: MetricKey;
  metric_value: Record<string, unknown>;
  expires_at: string;
  updated_at: string;
}

/**
 * Trend direction indicator
 */
export type TrendDirection = "up" | "down" | "flat";

/**
 * Key Performance Indicator
 * Used in dashboard summary cards
 */
export interface AnalyticsKPI {
  label: string;
  value: number | string;
  change_percent: number | null;
  trend: TrendDirection;
  format: "currency" | "number" | "percentage";
  comparison_period?: string;
}

/**
 * Chart data point for time-series graphs
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Revenue breakdown by category
 */
export interface RevenueBreakdown {
  services: number;
  addons: number;
  memberships: number;
  tips: number;
  total: number;
}

/**
 * Customer acquisition and retention metrics
 */
export interface CustomerMetrics {
  new_customers: number;
  returning_customers: number;
  total_customers: number;
  retention_rate: number;
  churn_rate: number;
  avg_customer_lifetime_value: number;
  avg_visits_per_customer: number;
}

/**
 * Operational efficiency metrics
 */
export interface OperationalMetrics {
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  cancellation_rate: number;
  no_show_rate: number;
  completion_rate: number;
  avg_appointment_duration: number;
  capacity_utilization: number;
}

/**
 * Service performance metrics
 */
export interface ServiceMetrics {
  service_id: string;
  service_name: string;
  bookings_count: number;
  revenue: number;
  avg_rating: number;
  popularity_rank: number;
}

/**
 * Pet size distribution
 */
export interface SizeDistribution {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
}

/**
 * Top performing items
 */
export interface TopPerformer {
  id: string;
  name: string;
  count: number;
  revenue: number;
}

/**
 * Comprehensive dashboard analytics
 */
export interface DashboardAnalytics {
  date_range: DateRange;
  kpis: {
    total_revenue: AnalyticsKPI;
    total_appointments: AnalyticsKPI;
    new_customers: AnalyticsKPI;
    avg_ticket_size: AnalyticsKPI;
  };
  revenue_breakdown: RevenueBreakdown;
  revenue_trend: ChartDataPoint[];
  appointment_trend: ChartDataPoint[];
  customer_metrics: CustomerMetrics;
  operational_metrics: OperationalMetrics;
  top_services: ServiceMetrics[];
  top_addons: TopPerformer[];
  size_distribution: SizeDistribution;
  payment_status_breakdown: Record<PaymentStatus, number>;
  appointment_status_breakdown: Record<AppointmentStatus, number>;
}

/**
 * Customer analytics detail
 */
export interface CustomerAnalytics {
  customer_id: string;
  total_visits: number;
  total_spend: number;
  avg_ticket_size: number;
  lifetime_value: number;
  last_visit_date: string | null;
  favorite_service: string | null;
  preferred_addons: string[];
  appointment_frequency: number; // days between visits
  cancellation_rate: number;
  no_show_rate: number;
  loyalty_status: "active" | "at_risk" | "churned";
}

/**
 * Report generation request
 */
export interface ReportRequest {
  report_type:
    | "revenue"
    | "customers"
    | "services"
    | "operations"
    | "marketing";
  date_range: DateRange;
  filters?: {
    service_ids?: string[];
    customer_ids?: string[];
    groomer_ids?: string[];
  };
  format: "json" | "csv" | "pdf";
}

/**
 * Generated report metadata
 */
export interface GeneratedReport extends BaseEntity {
  report_type: string;
  date_range: DateRange;
  filters: Record<string, unknown>;
  file_url: string | null;
  generated_by: string;
  row_count: number;
}

/**
 * Analytics query filters
 */
export interface AnalyticsFilters {
  date_range?: DateRange;
  service_ids?: string[];
  groomer_ids?: string[];
  customer_ids?: string[];
  pet_sizes?: string[];
  appointment_statuses?: AppointmentStatus[];
  payment_statuses?: PaymentStatus[];
}

/**
 * Comparison period for trend analysis
 */
export interface ComparisonPeriod {
  current: DateRange;
  previous: DateRange;
}

/**
 * Revenue forecast data
 */
export interface RevenueForecast {
  date: string;
  projected_revenue: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
}
