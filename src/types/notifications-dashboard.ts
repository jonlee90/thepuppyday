/**
 * Types for Notifications Dashboard Analytics
 */

export interface NotificationsPeriod {
  start: string;
  end: string;
  label: string;
}

export interface NotificationsTrends {
  sent_change_percent: number;
  delivery_rate_change_percent: number;
}

export interface NotificationsSummary {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  click_rate: number;
  sms_cost_cents: number;
  trends: NotificationsTrends;
}

export interface ChannelStats {
  sent: number;
  delivered: number;
  failed: number;
  delivery_rate: number;
}

export interface NotificationsByChannel {
  email: ChannelStats;
  sms: ChannelStats;
}

export interface NotificationTypeStats {
  type: string;
  sent: number;
  delivered: number;
  failed: number;
  success_rate: number;
}

export interface TimelineDataPoint {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface RecentFailure {
  id: string;
  type: string;
  channel: 'email' | 'sms';
  recipient: string;
  error_message: string;
  created_at: string;
}

export interface FailureReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface NotificationsDashboardData {
  period: NotificationsPeriod;
  summary: NotificationsSummary;
  by_channel: NotificationsByChannel;
  by_type: NotificationTypeStats[];
  timeline: TimelineDataPoint[];
  recent_failures: RecentFailure[];
  failure_reasons: FailureReason[];
}

export type PeriodOption = '7d' | '30d' | '90d';

export const PERIOD_LABELS: Record<PeriodOption, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
};
