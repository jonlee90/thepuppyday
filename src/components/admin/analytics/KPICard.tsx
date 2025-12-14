/**
 * KPI Card Component
 * Task 0050: Individual KPI metric card
 */

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPIData {
  label: string;
  value: string | number;
  change: number; // Percentage change
  previous?: string | number; // Previous period value
  format?: 'currency' | 'number' | 'percentage';
}

interface KPICardProps {
  data: KPIData;
  onClick?: () => void;
}

export function KPICard({ data, onClick }: KPICardProps) {
  const { label, value, change, format = 'number' } = data;

  // Format the main value
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  // Determine change indicator
  const getChangeIndicator = () => {
    if (change > 0) {
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: `+${change.toFixed(1)}%`,
      };
    } else if (change < 0) {
      return {
        icon: <TrendingDown className="w-4 h-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: `${change.toFixed(1)}%`,
      };
    } else {
      return {
        icon: <Minus className="w-4 h-4" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        label: '0%',
      };
    }
  };

  const indicator = getChangeIndicator();

  return (
    <div
      onClick={onClick}
      className={`card bg-white shadow-sm hover:shadow-md transition-shadow p-6 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Label */}
      <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>

      {/* Value */}
      <div className="text-3xl font-bold text-[#434E54] mb-3">{formatValue(value)}</div>

      {/* Change Indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${indicator.bgColor}`}>
          <span className={indicator.color}>{indicator.icon}</span>
          <span className={`text-sm font-semibold ${indicator.color}`}>{indicator.label}</span>
        </div>
        <span className="text-xs text-gray-500">vs previous period</span>
      </div>
    </div>
  );
}
