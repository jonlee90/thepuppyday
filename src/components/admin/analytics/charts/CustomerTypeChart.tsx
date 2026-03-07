/**
 * Customer Type Chart Component
 * Task 0054: Pie chart showing new vs returning customers
 */

'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatNumber } from './index';

interface CustomerTypeData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface CustomerTypeChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  customerData?: CustomerTypeData[];
  isLoading?: boolean;
  error?: string | null;
}

export function CustomerTypeChart({ dateRange, customerData: propData, isLoading: propLoading, error: propError }: CustomerTypeChartProps) {
  const [selfData, setSelfData] = useState<CustomerTypeData[]>([]);
  const [selfLoading, setSelfLoading] = useState(!propData);
  const [selfError, setSelfError] = useState<string | null>(null);

  // Use props if provided, otherwise self-fetch (backwards compat)
  const customerData = propData ?? selfData;
  const isLoading = propData !== undefined ? (propLoading ?? false) : selfLoading;
  const error = propData !== undefined ? (propError ?? null) : selfError;

  useEffect(() => {
    if (propData !== undefined) return; // Skip fetch if data provided via props

    const fetchCustomerData = async () => {
      setSelfLoading(true);
      setSelfError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/customers?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch customer data');
        }

        const result = await response.json();
        setSelfData(result.data.customerTypes);
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setSelfError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setSelfLoading(false);
      }
    };

    fetchCustomerData();
  }, [dateRange, propData]);

  const COLORS = [CHART_COLORS.primary, CHART_COLORS.info];

  return (
    <ChartWrapper height={300} isLoading={isLoading} error={error}>
      <PieChart>
        <Pie
          data={customerData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
        >
          {customerData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...CHART_CONFIG.tooltip} formatter={(value: number) => formatNumber(value)} />
        <Legend />
      </PieChart>
    </ChartWrapper>
  );
}
