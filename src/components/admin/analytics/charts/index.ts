/**
 * Chart Configuration and Base Components
 * Task 0049: Recharts setup with design system
 */

// Design system colors for charts
export const CHART_COLORS = {
  primary: '#434E54', // Charcoal
  secondary: '#EAE0D5', // Light cream
  accent: '#F8EEE5', // Warm cream
  success: '#10b981', // Green
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red
  info: '#3b82f6', // Blue
  purple: '#a855f7',
  teal: '#14b8a6',
  pink: '#ec4899',
  indigo: '#6366f1',
};

// Color palette for multiple series
export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.pink,
  CHART_COLORS.indigo,
];

// Common chart configuration
export const CHART_CONFIG = {
  margin: { top: 5, right: 30, left: 20, bottom: 5 },
  grid: {
    strokeDasharray: '3 3',
    stroke: '#E5E7EB',
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      padding: '12px',
    },
    labelStyle: {
      color: '#434E54',
      fontWeight: 600,
      marginBottom: '4px',
    },
    itemStyle: {
      color: '#6B7280',
    },
  },
  axis: {
    tick: { fill: '#6B7280' },
    line: { stroke: '#E5E7EB' },
  },
};

// Format currency for charts
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage for charts
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Format number with commas
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Export chart components
export * from './ChartWrapper';
