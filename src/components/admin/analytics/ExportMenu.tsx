/**
 * Export Menu Component
 * Task 0057: Export analytics data as CSV or PDF
 */

'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { exportKPIsToCSV, exportChartDataToCSV } from '@/lib/utils/csv-export';
import { exportAnalyticsPDF } from '@/lib/utils/analytics-pdf';

interface ExportMenuProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

export function ExportMenu({ dateRange }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const buildParams = () =>
    new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    });

  const handleExportKPIsCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/admin/analytics/kpis?${buildParams()}`);
      if (!response.ok) throw new Error('Failed to fetch KPI data');
      const result = await response.json();
      exportKPIsToCSV(result.data, dateRange);
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting KPIs:', error);
      alert('Failed to export KPIs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportServicesCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/admin/analytics/charts/services?${buildParams()}`);
      if (!response.ok) throw new Error('Failed to fetch service data');
      const result = await response.json();
      exportChartDataToCSV(result.data, 'service_popularity', dateRange);
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting services:', error);
      alert('Failed to export service data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGroomerCSV = async () => {
    try {
      setIsExporting(true);
      const params = buildParams();
      params.set('comparison', 'true');
      const response = await fetch(`/api/admin/analytics/groomers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch groomer data');
      const result = await response.json();

      const headers = ['Groomer', 'Appointments', 'Avg Rating', 'Revenue', 'Add-on Rate', 'Completion %'];
      const rows = (result.groomers || []).map((g: any) => [
        g.groomer_name,
        g.appointments,
        g.average_rating?.toFixed(2),
        g.revenue?.toFixed(2),
        `${g.addon_rate?.toFixed(1)}%`,
        `${g.completion_rate?.toFixed(1)}%`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `groomer-performance-${dateRange.start.toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting groomers:', error);
      alert('Failed to export groomer data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWaitlistCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/admin/analytics/waitlist?${buildParams()}`);
      if (!response.ok) throw new Error('Failed to fetch waitlist data');
      const result = await response.json();
      const d = result.data;

      const headers = ['Metric', 'Value'];
      const rows = [
        ['Active Waitlist', d.activeCount],
        ['Fill Rate', `${d.fillRate?.percentage?.toFixed(1)}%`],
        ['Filled', d.fillRate?.filled],
        ['Total Requests', d.fillRate?.total],
        ['Response Rate', `${d.responseRate?.percentage?.toFixed(1)}%`],
        ['Avg Wait Time (hrs)', d.avgWaitTime?.toFixed(1)],
        ['Conversion Rate', `${d.conversionRate?.percentage?.toFixed(1)}%`],
        ['Bookings from Waitlist', d.conversionRate?.booked],
      ];

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waitlist-report-${dateRange.start.toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting waitlist:', error);
      alert('Failed to export waitlist data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const params = buildParams();

      // Fetch multiple endpoints in parallel for comprehensive report
      const [kpiRes, operationsRes, reportCardsRes, waitlistRes] = await Promise.all([
        fetch(`/api/admin/analytics/kpis?${params}`),
        fetch(`/api/admin/analytics/charts/operations?${params}`),
        fetch(`/api/admin/analytics/report-cards?${params}`),
        fetch(`/api/admin/analytics/waitlist?${params}`),
      ]);

      if (!kpiRes.ok) throw new Error('Failed to fetch KPI data');

      const kpiData = await kpiRes.json();
      const operationsData = operationsRes.ok ? (await operationsRes.json()).data : null;
      const reportCardsData = reportCardsRes.ok ? (await reportCardsRes.json()).data : null;
      const waitlistData = waitlistRes.ok ? (await waitlistRes.json()).data : null;

      exportAnalyticsPDF(
        {
          kpis: kpiData.data,
          operations: operationsData,
          reportCards: reportCardsData,
          waitlist: waitlistData,
        },
        dateRange
      );

      setIsOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="btn bg-[#434E54] text-white hover:bg-[#363F44] gap-2"
      >
        <Download className="w-4 h-4" />
        Export Report
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
              CSV Exports
            </div>

            <button
              onClick={handleExportKPIsCSV}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">KPIs as CSV</div>
                <div className="text-xs text-gray-500">Export all key metrics</div>
              </div>
            </button>

            <button
              onClick={handleExportServicesCSV}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Services as CSV</div>
                <div className="text-xs text-gray-500">Export service popularity data</div>
              </div>
            </button>

            <button
              onClick={handleExportGroomerCSV}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Groomer Performance CSV</div>
                <div className="text-xs text-gray-500">All groomers comparison data</div>
              </div>
            </button>

            <button
              onClick={handleExportWaitlistCSV}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Waitlist Report CSV</div>
                <div className="text-xs text-gray-500">Waitlist performance metrics</div>
              </div>
            </button>

            <div className="border-t border-gray-200 my-2"></div>

            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
              PDF Export
            </div>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Full Report as PDF</div>
                <div className="text-xs text-gray-500">KPIs + Operations + Report Cards + Waitlist</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
}
