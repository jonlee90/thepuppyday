/**
 * Report Card Analytics Component
 * Task 0058: Report card metrics and review funnel visualization
 */

'use client';

import { useEffect, useState } from 'react';
import { FileText, Eye, Star, ThumbsUp, TrendingUp } from 'lucide-react';
import { ChartWrapper } from './charts/ChartWrapper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { CHART_COLORS, CHART_CONFIG, formatNumber, formatPercentage } from './charts/index';

interface ReportCardAnalyticsProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface ReportCardMetrics {
  sent: {
    count: number;
    percentage: number;
  };
  opened: {
    count: number;
    percentage: number;
    avgTimeToOpen: number; // in hours
  };
  reviewed: {
    count: number;
    percentage: number;
    avgRating: number;
  };
  publicReviews: {
    count: number;
    percentage: number;
  };
}

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export function ReportCardAnalytics({ dateRange }: ReportCardAnalyticsProps) {
  const [metrics, setMetrics] = useState<ReportCardMetrics | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportCardMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/report-cards?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch report card metrics');
        }

        const result = await response.json();
        setMetrics(result.data);

        // Build funnel data
        if (result.data) {
          const funnel: FunnelData[] = [
            {
              stage: 'Sent',
              count: result.data.sent.count,
              percentage: 100,
            },
            {
              stage: 'Opened',
              count: result.data.opened.count,
              percentage: result.data.opened.percentage,
            },
            {
              stage: 'Rated',
              count: result.data.reviewed.count,
              percentage: result.data.reviewed.percentage,
            },
            {
              stage: 'Public Review',
              count: result.data.publicReviews.count,
              percentage: result.data.publicReviews.percentage,
            },
          ];
          setFunnelData(funnel);
        }
      } catch (err) {
        console.error('Error fetching report card metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportCardMetrics();
  }, [dateRange]);

  const formatHours = (hours: number | undefined | null): string => {
    if (hours == null) return '0 min';
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card bg-gray-100 shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        {/* Skeleton for chart */}
        <div className="card bg-gray-100 shadow-sm p-6 animate-pulse">
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 shadow-sm p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="card bg-white shadow-sm p-6">
        <p className="text-gray-500">No report card data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sent */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <FileText className="w-5 h-5 text-[#434E54]" />
            </div>
            <div className="text-sm font-medium text-gray-600">Reports Sent</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.sent.count)}
          </div>
          <div className="text-sm text-gray-500">
            {formatPercentage(metrics.sent.percentage)} of appointments
          </div>
        </div>

        {/* Opened */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Reports Opened</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.opened.count)}
          </div>
          <div className="text-sm text-gray-500">
            {formatPercentage(metrics.opened.percentage)} open rate
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Avg: {formatHours(metrics.opened.avgTimeToOpen)} to open
          </div>
        </div>

        {/* Reviewed */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Reviews Submitted</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.reviewed.count)}
          </div>
          <div className="text-sm text-gray-500">
            {formatPercentage(metrics.reviewed.percentage)} review rate
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            Avg: {(metrics.reviewed.avgRating ?? 0).toFixed(1)} stars
          </div>
        </div>

        {/* Public Reviews */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Public Reviews</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.publicReviews.count)}
          </div>
          <div className="text-sm text-gray-500">
            {formatPercentage(metrics.publicReviews.percentage)} went public
          </div>
        </div>
      </div>

      {/* Review Funnel Visualization */}
      <div className="card bg-white shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#434E54]" />
          <h3 className="text-lg font-bold text-[#434E54]">Review Funnel</h3>
        </div>

        <ChartWrapper height={300}>
          <BarChart data={funnelData} layout="vertical" margin={CHART_CONFIG.margin}>
            <CartesianGrid {...CHART_CONFIG.grid} />
            <XAxis type="number" {...CHART_CONFIG.axis} />
            <YAxis type="category" dataKey="stage" {...CHART_CONFIG.axis} width={100} />
            <Tooltip
              {...CHART_CONFIG.tooltip}
              formatter={(value: number, name: string) => {
                if (name === 'count') return formatNumber(value);
                return value;
              }}
            />
            <Legend />
            <Bar dataKey="count" name="Count" radius={[0, 8, 8, 0]}>
              {funnelData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0
                      ? CHART_COLORS.primary
                      : index === 1
                      ? CHART_COLORS.info
                      : index === 2
                      ? CHART_COLORS.warning
                      : CHART_COLORS.success
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartWrapper>

        {/* Funnel Conversion Rates */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Open Rate</div>
            <div className="text-xl font-bold text-[#434E54]">
              {formatPercentage(metrics.opened.percentage)}
            </div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Review Rate</div>
            <div className="text-xl font-bold text-[#434E54]">
              {formatPercentage(metrics.reviewed.percentage)}
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Public Rate</div>
            <div className="text-xl font-bold text-[#434E54]">
              {formatPercentage(metrics.publicReviews.percentage)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
