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

  const handleExportKPIsCSV = async () => {
    try {
      setIsExporting(true);

      // Fetch KPI data
      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/admin/analytics/kpis?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch KPI data');
      }

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

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // Fetch KPI data for PDF
      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/admin/analytics/kpis?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data for PDF');
      }

      const result = await response.json();
      exportAnalyticsPDF(result.data, dateRange);

      setIsOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportServicesCSV = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/admin/analytics/charts/services?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch service data');
      }

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
                <div className="text-xs text-gray-500">Generate printable report</div>
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
