'use client';

/**
 * Campaign Performance Dashboard
 * Task 0047: Display campaign analytics with KPIs and A/B test comparison
 */

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Send,
  CheckCircle,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  TrendingDown,
  Percent,
} from 'lucide-react';
import type { CampaignPerformanceMetrics } from '@/types/marketing';
import type { ABTestComparison, ConversionData } from '@/lib/admin/campaign-analytics';

interface CampaignPerformanceProps {
  campaignId: string;
}

interface AnalyticsResponse {
  performance: CampaignPerformanceMetrics;
  ab_test_comparison: {
    variant_a: ABTestComparison;
    variant_b: ABTestComparison;
  } | null;
  conversions: ConversionData[];
}

export default function CampaignPerformance({ campaignId }: CampaignPerformanceProps) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/campaigns/${campaignId}/analytics`);

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching campaign analytics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="alert alert-error">
        <AlertCircle className="w-5 h-5" />
        <span>Failed to load campaign analytics: {error}</span>
      </div>
    );
  }

  const { performance, ab_test_comparison, conversions } = analytics;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#434E54] mb-2">Campaign Performance</h2>
        <p className="text-sm text-gray-600">Track engagement, conversions, and ROI</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Sent"
          value={performance.sent_count}
          icon={<Send className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <KPICard
          label="Delivered"
          value={performance.delivered_count}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          bgColor="bg-green-50"
          percentage={performance.sent_count > 0 ? (performance.delivered_count / performance.sent_count) * 100 : 0}
        />
        <KPICard
          label="Clicked"
          value={performance.clicked_count}
          icon={<MousePointerClick className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50"
          percentage={performance.click_rate}
          percentageLabel="CTR"
        />
        <KPICard
          label="Conversions"
          value={performance.conversion_count}
          icon={<ShoppingCart className="w-5 h-5 text-orange-600" />}
          bgColor="bg-orange-50"
          percentage={performance.conversion_rate}
        />
      </div>

      {/* Revenue & Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-white shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Revenue Generated</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-[#434E54]">
              ${performance.revenue_generated.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ${performance.avg_revenue_per_send.toFixed(2)} per send
            </p>
          </div>
        </div>

        <div className="card bg-white shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Click Rate</h3>
              <Percent className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-[#434E54]">
              {performance.click_rate.toFixed(1)}%
            </p>
            <div className="mt-2">
              <progress
                className="progress progress-purple w-full"
                value={performance.click_rate}
                max={100}
              ></progress>
            </div>
          </div>
        </div>

        <div className="card bg-white shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">ROI</h3>
              {performance.roi >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p
              className={`text-3xl font-bold ${
                performance.roi >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {performance.roi >= 0 ? '+' : ''}
              {performance.roi.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Return on investment</p>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <ConversionFunnel performance={performance} />

      {/* A/B Test Comparison */}
      {ab_test_comparison && (
        <ABTestComparisonTable
          variantA={ab_test_comparison.variant_a}
          variantB={ab_test_comparison.variant_b}
        />
      )}

      {/* Conversion Details */}
      {conversions.length > 0 && <ConversionTable conversions={conversions} />}
    </div>
  );
}

/**
 * KPI Card Component
 */
interface KPICardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  percentage?: number;
  percentageLabel?: string;
}

function KPICard({ label, value, icon, bgColor, percentage, percentageLabel }: KPICardProps) {
  return (
    <div className="card bg-white shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{label}</h3>
          <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-[#434E54]">{value.toLocaleString()}</p>
        {percentage !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            {percentage.toFixed(1)}% {percentageLabel || 'rate'}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Conversion Funnel Visualization
 */
interface ConversionFunnelProps {
  performance: CampaignPerformanceMetrics;
}

function ConversionFunnel({ performance }: ConversionFunnelProps) {
  const stages = [
    { label: 'Sent', value: performance.sent_count, color: 'bg-blue-500' },
    { label: 'Delivered', value: performance.delivered_count, color: 'bg-green-500' },
    { label: 'Clicked', value: performance.clicked_count, color: 'bg-purple-500' },
    { label: 'Converted', value: performance.conversion_count, color: 'bg-orange-500' },
  ];

  const maxValue = performance.sent_count;

  return (
    <div className="card bg-white shadow-sm">
      <div className="card-body">
        <h3 className="text-lg font-semibold text-[#434E54] mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            const dropoffFromPrevious =
              index > 0 ? stages[index - 1].value - stage.value : 0;

            return (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  <span className="text-sm text-gray-600">
                    {stage.value.toLocaleString()} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className={`${stage.color} h-6 rounded-full flex items-center justify-end px-3 transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 15 && (
                        <span className="text-xs font-medium text-white">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {dropoffFromPrevious > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    -{dropoffFromPrevious.toLocaleString()} dropoff from previous stage
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * A/B Test Comparison Table
 */
interface ABTestComparisonTableProps {
  variantA: ABTestComparison;
  variantB: ABTestComparison;
}

function ABTestComparisonTable({ variantA, variantB }: ABTestComparisonTableProps) {
  const metrics = [
    { label: 'Sent', keyA: 'sent_count', keyB: 'sent_count' },
    { label: 'Delivered', keyA: 'delivered_count', keyB: 'delivered_count' },
    { label: 'Clicked', keyA: 'clicked_count', keyB: 'clicked_count' },
    { label: 'Click Rate', keyA: 'click_rate', keyB: 'click_rate', isPercentage: true },
    { label: 'Conversions', keyA: 'conversion_count', keyB: 'conversion_count' },
    {
      label: 'Conversion Rate',
      keyA: 'conversion_rate',
      keyB: 'conversion_rate',
      isPercentage: true,
    },
    {
      label: 'Revenue',
      keyA: 'revenue_generated',
      keyB: 'revenue_generated',
      isCurrency: true,
    },
    {
      label: 'Avg Revenue/Send',
      keyA: 'avg_revenue_per_send',
      keyB: 'avg_revenue_per_send',
      isCurrency: true,
    },
  ];

  return (
    <div className="card bg-white shadow-sm">
      <div className="card-body">
        <h3 className="text-lg font-semibold text-[#434E54] mb-4">A/B Test Comparison</h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th className="text-gray-700">Metric</th>
                <th className="text-center bg-blue-50 text-blue-700">Variant A</th>
                <th className="text-center bg-purple-50 text-purple-700">Variant B</th>
                <th className="text-center text-gray-700">Winner</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const valueA = variantA[metric.keyA as keyof ABTestComparison] as number;
                const valueB = variantB[metric.keyB as keyof ABTestComparison] as number;
                const winner = valueA > valueB ? 'A' : valueB > valueA ? 'B' : '-';

                return (
                  <tr key={metric.label}>
                    <td className="font-medium">{metric.label}</td>
                    <td className="text-center">
                      {metric.isCurrency && '$'}
                      {valueA.toLocaleString()}
                      {metric.isPercentage && '%'}
                    </td>
                    <td className="text-center">
                      {metric.isCurrency && '$'}
                      {valueB.toLocaleString()}
                      {metric.isPercentage && '%'}
                    </td>
                    <td className="text-center">
                      {winner === 'A' && (
                        <span className="badge badge-primary badge-sm">A</span>
                      )}
                      {winner === 'B' && (
                        <span className="badge badge-secondary badge-sm">B</span>
                      )}
                      {winner === '-' && <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Conversion Details Table
 */
interface ConversionTableProps {
  conversions: ConversionData[];
}

function ConversionTable({ conversions }: ConversionTableProps) {
  return (
    <div className="card bg-white shadow-sm">
      <div className="card-body">
        <h3 className="text-lg font-semibold text-[#434E54] mb-4">
          Conversions ({conversions.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Booking Date</th>
                <th className="text-right">Revenue</th>
                <th className="text-center">Days to Convert</th>
              </tr>
            </thead>
            <tbody>
              {conversions.map((conversion) => (
                <tr key={conversion.booking_id}>
                  <td className="font-medium">{conversion.customer_name}</td>
                  <td>{new Date(conversion.booking_date).toLocaleDateString()}</td>
                  <td className="text-right font-semibold text-green-600">
                    ${conversion.revenue.toFixed(2)}
                  </td>
                  <td className="text-center">
                    <span className="badge badge-ghost badge-sm">
                      {conversion.days_to_conversion}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2}>Total</th>
                <th className="text-right font-bold text-green-600">
                  ${conversions.reduce((sum, c) => sum + c.revenue, 0).toFixed(2)}
                </th>
                <th className="text-center">
                  {(
                    conversions.reduce((sum, c) => sum + c.days_to_conversion, 0) /
                    conversions.length
                  ).toFixed(1)}
                  d avg
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
