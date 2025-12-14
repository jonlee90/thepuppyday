/**
 * Customer Type Chart Component
 * Task 0054: Pie chart showing new vs returning customers
 */

'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatNumber } from './index';

interface CustomerTypeChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface CustomerTypeData {
  name: string;
  value: number;
  [key: string]: string | number; // Add index signature for Recharts compatibility
}

export function CustomerTypeChart({ dateRange }: CustomerTypeChartProps) {
  const [customerData, setCustomerData] = useState<CustomerTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      setIsLoading(true);
      setError(null);

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
        setCustomerData(result.data.customerTypes);
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [dateRange]);

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
