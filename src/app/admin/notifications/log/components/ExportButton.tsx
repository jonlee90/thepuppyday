/**
 * Export CSV Button Component
 * Task 0147: Export notification logs as CSV
 */

'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { NotificationLogListItem, NotificationLogFilters } from '@/types/notification-log';
import { generateCSV, generateCSVFilename, downloadCSV } from '../utils';

interface ExportButtonProps {
  logs: NotificationLogListItem[];
  filters: NotificationLogFilters;
  totalCount: number;
  onExportAll?: () => Promise<NotificationLogListItem[]>;
}

export function ExportButton({ logs, filters, totalCount, onExportAll }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);

      // If current page has all logs or no onExportAll function, just export current logs
      const logsToExport =
        !onExportAll || logs.length >= totalCount ? logs : await onExportAll();

      if (logsToExport.length === 0) {
        alert('No logs to export');
        return;
      }

      // Generate CSV content
      const csvContent = generateCSV(logsToExport);

      // Generate filename
      const filename = generateCSVFilename(filters);

      // Download file
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Failed to export logs:', error);
      alert('Failed to export logs. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || logs.length === 0}
      className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none
               disabled:bg-gray-300 disabled:text-gray-500"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export CSV
          {logs.length < totalCount && ` (${totalCount} logs)`}
        </>
      )}
    </button>
  );
}
