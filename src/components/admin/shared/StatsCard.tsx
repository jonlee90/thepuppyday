import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const COLOR_MAP = {
  default: { icon: 'bg-[#EAE0D5]', text: 'text-[#434E54]' },
  green:   { icon: 'bg-[#10B981]/10', text: 'text-[#065F46]' },
  blue:    { icon: 'bg-[#3B82F6]/10', text: 'text-[#1E40AF]' },
  amber:   { icon: 'bg-[#FCD34D]/20', text: 'text-[#92400E]' },
  red:     { icon: 'bg-[#EF4444]/10', text: 'text-[#991B1B]' },
};

export interface StatsCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage?: number;
    label?: string;
  };
  color?: 'default' | 'green' | 'blue' | 'amber' | 'red';
  className?: string;
}

export function StatsCard({ icon, value, label, trend, color = 'default', className = '' }: StatsCardProps) {
  const colors = COLOR_MAP[color];
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend?.direction === 'up' ? 'text-[#10B981]' : trend?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#9CA3AF]';

  return (
    <div className={`bg-white rounded-xl p-4 flex flex-col gap-1 ${className}`}>
      <div className={`p-2 rounded-lg w-fit ${colors.icon}`}>
        {icon}
      </div>
      <span className={`text-2xl font-bold ${colors.text} mt-1`}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-[#434E54]/60">{label}</span>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {trend.percentage != null && <span>{trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%</span>}
          {trend.label && <span className="text-[#9CA3AF] font-normal">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}

export interface StatsRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsRow({ children, className = '' }: StatsRowProps) {
  const childArray = React.Children.toArray(children);
  return (
    <div className={`flex items-center ${className}`}>
      {childArray.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className="w-px h-8 bg-[#F0EAE0] flex-shrink-0" />}
          <div className="flex-1">{child}</div>
        </React.Fragment>
      ))}
    </div>
  );
}
