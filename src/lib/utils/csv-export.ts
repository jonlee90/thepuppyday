/**
 * CSV Export Utility
 * Task 0057: Export analytics data as CSV
 */

/**
 * Sanitize CSV value to prevent injection attacks
 */
function sanitizeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  let stringValue = String(value);

  // Prevent CSV injection - prepend single quote to dangerous characters
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = "'" + stringValue;
  }

  // Handle special characters
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvRows = [
    // Header row
    csvHeaders.join(','),
    // Data rows
    ...data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header];
          return sanitizeCSVValue(value);
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export KPI data to CSV
 */
export function exportKPIsToCSV(kpis: any, dateRange: { start: Date; end: Date }): void {
  const data = [
    {
      metric: 'Total Revenue',
      current_value: kpis.total_revenue.value,
      previous_value: kpis.total_revenue.previous,
      change_percent: kpis.total_revenue.change.toFixed(1),
    },
    {
      metric: 'Total Appointments',
      current_value: kpis.total_appointments.value,
      previous_value: kpis.total_appointments.previous,
      change_percent: kpis.total_appointments.change.toFixed(1),
    },
    {
      metric: 'Avg Booking Value',
      current_value: kpis.avg_booking_value.value,
      previous_value: kpis.avg_booking_value.previous,
      change_percent: kpis.avg_booking_value.change.toFixed(1),
    },
    {
      metric: 'Retention Rate',
      current_value: kpis.retention_rate.value,
      previous_value: kpis.retention_rate.previous,
      change_percent: kpis.retention_rate.change.toFixed(1),
    },
    {
      metric: 'Review Generation Rate',
      current_value: kpis.review_generation_rate.value,
      previous_value: kpis.review_generation_rate.previous,
      change_percent: kpis.review_generation_rate.change.toFixed(1),
    },
    {
      metric: 'Waitlist Fill Rate',
      current_value: kpis.waitlist_fill_rate.value,
      previous_value: kpis.waitlist_fill_rate.previous,
      change_percent: kpis.waitlist_fill_rate.change.toFixed(1),
    },
  ];

  const csv = convertToCSV(data);
  const filename = `kpis_${formatDateForFilename(dateRange.start)}_to_${formatDateForFilename(
    dateRange.end
  )}.csv`;

  downloadCSV(csv, filename);
}

/**
 * Export chart data to CSV
 */
export function exportChartDataToCSV(
  data: any[],
  chartName: string,
  dateRange: { start: Date; end: Date }
): void {
  const csv = convertToCSV(data);
  const filename = `${chartName}_${formatDateForFilename(dateRange.start)}_to_${formatDateForFilename(
    dateRange.end
  )}.csv`;

  downloadCSV(csv, filename);
}

/**
 * Format date for filename (YYYY-MM-DD)
 */
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}
