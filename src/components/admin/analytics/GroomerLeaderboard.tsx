'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  TrendingUp,
  Star,
  DollarSign,
  Calendar,
  Package,
  Clock,
  ChevronDown,
  AlertCircle,
  Award,
} from 'lucide-react';

interface GroomerRanking {
  groomer_id: string;
  groomer_name: string;
  groomer_email: string;
  score: number;
  rank: number;
  appointments: number;
  average_rating: number;
  revenue: number;
  addon_rate: number;
  on_time_percentage: number;
}

interface GroomerLeaderboardData {
  rankings: GroomerRanking[];
  metric: string;
}

interface GroomerLeaderboardProps {
  dateRange: {
    start: string;
    end: string;
  };
}

type MetricOption = {
  value: string;
  label: string;
  icon: any;
  color: string;
};

const METRICS: MetricOption[] = [
  {
    value: 'revenue',
    label: 'Revenue',
    icon: DollarSign,
    color: '#6BCB77',
  },
  {
    value: 'rating',
    label: 'Average Rating',
    icon: Star,
    color: '#FFB347',
  },
  {
    value: 'appointments',
    label: 'Appointments',
    icon: Calendar,
    color: '#434E54',
  },
  {
    value: 'addon_rate',
    label: 'Add-on Attachment',
    icon: Package,
    color: '#74B9FF',
  },
  {
    value: 'on_time',
    label: 'On-Time Performance',
    icon: Clock,
    color: '#A29BFE',
  },
];

export function GroomerLeaderboard({ dateRange }: GroomerLeaderboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  const [data, setData] = useState<GroomerLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [dateRange, selectedMetric]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
        metric: selectedMetric,
        leaderboard: 'true',
      });

      const response = await fetch(`/api/admin/analytics/groomers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard data');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricConfig = () => {
    return METRICS.find((m) => m.value === selectedMetric) || METRICS[0];
  };

  const getScoreDisplay = (groomer: GroomerRanking) => {
    switch (selectedMetric) {
      case 'revenue':
        return `$${groomer.revenue.toLocaleString()}`;
      case 'rating':
        return `${groomer.average_rating.toFixed(2)} / 5.0`;
      case 'appointments':
        return `${groomer.appointments} appts`;
      case 'addon_rate':
        return `${groomer.addon_rate.toFixed(1)}%`;
      case 'on_time':
        return `${groomer.on_time_percentage.toFixed(1)}%`;
      default:
        return groomer.score.toString();
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full shadow-lg">
          <Medal className="w-6 h-6 text-white" />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg">
          <Award className="w-6 h-6 text-white" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-[#EAE0D5] rounded-full">
          <span className="text-lg font-bold text-[#434E54]">#{rank}</span>
        </div>
      );
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMaxScore = () => {
    if (!data || data.rankings.length === 0) return 100;
    return Math.max(...data.rankings.map((r) => r.score));
  };

  const getProgressWidth = (score: number) => {
    const maxScore = getMaxScore();
    return (score / maxScore) * 100;
  };

  const metricConfig = getMetricConfig();
  const MetricIcon = metricConfig.icon;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="skeleton h-6 w-48"></div>
          <div className="skeleton h-10 w-48"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-20 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#434E54] mb-2">Error Loading Data</h3>
        <p className="text-[#6B7280] mb-4">{error}</p>
        <button
          onClick={fetchLeaderboardData}
          className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.rankings.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm text-center">
        <Trophy className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#434E54] mb-2">No Rankings Available</h3>
        <p className="text-[#6B7280]">
          No groomer performance data found for the selected date range
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
            <Trophy className="w-5 h-5 text-[#434E54]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#434E54]">Groomer Leaderboard</h3>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Top performers ranked by selected metric
            </p>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="dropdown dropdown-end">
          <label
            tabIndex={0}
            className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none gap-2 normal-case"
          >
            <MetricIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{metricConfig.label}</span>
            <ChevronDown className="w-4 h-4" />
          </label>

          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-xl w-56 mt-2"
          >
            {METRICS.map((metric) => {
              const Icon = metric.icon;
              return (
                <li key={metric.value}>
                  <button
                    onClick={() => setSelectedMetric(metric.value)}
                    className={`${
                      selectedMetric === metric.value
                        ? 'bg-[#EAE0D5] text-[#434E54] font-semibold'
                        : 'text-[#6B7280] hover:bg-[#F8EEE5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                    {metric.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Leaderboard Rankings */}
      <div className="space-y-3">
        {data.rankings.map((groomer, index) => (
          <div
            key={groomer.groomer_id}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              groomer.rank <= 3
                ? 'bg-gradient-to-r from-[#FFFBF7] to-white border-[#EAE0D5] shadow-md'
                : 'bg-white border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Rank Badge */}
              <div className="flex-shrink-0">
                {getRankBadge(groomer.rank)}
              </div>

              {/* Groomer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 bg-[#434E54] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {getInitials(groomer.groomer_name)}
                  </div>

                  {/* Name and Score */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#434E54] truncate">
                      {groomer.groomer_name || 'Unknown Groomer'}
                    </h4>
                    <p className="text-sm text-[#9CA3AF] truncate">
                      {groomer.groomer_email}
                    </p>
                  </div>

                  {/* Score Display */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-[#434E54]">
                      {getScoreDisplay(groomer)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getProgressWidth(groomer.score)}%`,
                      backgroundColor: metricConfig.color,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Additional Stats - Only for Top 3 */}
            {groomer.rank <= 3 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-[#9CA3AF] mb-1">Appointments</div>
                    <div className="font-semibold text-[#434E54]">
                      {groomer.appointments}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#9CA3AF] mb-1">Rating</div>
                    <div className="font-semibold text-[#434E54]">
                      {groomer.average_rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#9CA3AF] mb-1">Revenue</div>
                    <div className="font-semibold text-[#434E54]">
                      ${groomer.revenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#9CA3AF] mb-1">Add-on Rate</div>
                    <div className="font-semibold text-[#434E54]">
                      {groomer.addon_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Training Opportunities - Bottom Performers */}
      {data.rankings.length > 3 && (
        <div className="mt-6 p-4 bg-[#FFB347]/5 border border-[#FFB347]/20 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#FFB347]" />
            <h4 className="text-sm font-semibold text-[#434E54]">
              Training Opportunities
            </h4>
          </div>
          <div className="space-y-2">
            {data.rankings.slice(-3).reverse().map((groomer) => (
              <div
                key={groomer.groomer_id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[#6B7280]">{groomer.groomer_name || 'Unknown'}</span>
                <span className="text-[#FFB347] font-medium">
                  Rank #{groomer.rank} - {getScoreDisplay(groomer)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6B7280] mt-3">
            Consider providing additional training or support to improve performance
          </p>
        </div>
      )}
    </div>
  );
}
