/**
 * Service Popularity Chart Component
 * Task 0053: Pie chart and table showing service popularity
 */

'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { CHART_PALETTE, CHART_CONFIG, formatCurrency, formatNumber } from './index';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ServicePopularityChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface ServiceData {
  name: string;
  count: number;
  revenue: number;
  avgPrice: number;
  [key: string]: string | number; // Add index signature for Recharts compatibility
}

export function ServicePopularityChart({ dateRange }: ServicePopularityChartProps) {
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof ServiceData>('count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchServiceData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/services?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch service data');
        }

        const result = await response.json();
        setServiceData(result.data);
      } catch (err) {
        console.error('Error fetching service data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceData();
  }, [dateRange]);

  const handleSort = (column: keyof ServiceData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedData = [...serviceData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return aValue > bValue ? modifier : -modifier;
  });

  if (isLoading) {
    return <ChartWrapper height={400} isLoading={true}><div /></ChartWrapper>;
  }

  if (error) {
    return <ChartWrapper height={400} error={error}><div /></ChartWrapper>;
  }

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <ChartWrapper height={350}>
        <PieChart>
          <Pie
            data={serviceData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
          >
            {serviceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            {...CHART_CONFIG.tooltip}
            formatter={(value: number) => formatNumber(value)}
          />
          <Legend />
        </PieChart>
      </ChartWrapper>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Service
                  {sortColumn === 'name' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    ))}
                </div>
              </th>
              <th
                onClick={() => handleSort('count')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Count
                  {sortColumn === 'count' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    ))}
                </div>
              </th>
              <th
                onClick={() => handleSort('revenue')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Revenue
                  {sortColumn === 'revenue' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    ))}
                </div>
              </th>
              <th
                onClick={() => handleSort('avgPrice')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Avg Price
                  {sortColumn === 'avgPrice' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    ))}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((service, index) => (
              <tr key={index}>
                <td className="font-medium">{service.name}</td>
                <td>{formatNumber(service.count)}</td>
                <td>{formatCurrency(service.revenue)}</td>
                <td>{formatCurrency(service.avgPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
