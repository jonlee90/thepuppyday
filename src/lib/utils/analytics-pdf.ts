/**
 * Analytics PDF Export Utility
 * Task 0057: Export analytics report as PDF
 *
 * Note: This is a simplified implementation using browser print.
 * For production, consider using libraries like jsPDF or react-pdf
 */

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string | number): string {
  const stringText = String(text);
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return stringText.replace(/[&<>"']/g, (m) => map[m]);
}

interface ReportData {
  kpis: any;
  operations?: any;
  reportCards?: any;
  waitlist?: any;
}

/**
 * Generate HTML content for PDF report
 */
export function generateAnalyticsReportHTML(
  data: ReportData | any,
  dateRange: { start: Date; end: Date }
): string {
  // Support both old signature (kpis, dateRange) and new (data, dateRange)
  const kpis = data.kpis ?? data;
  const operations = data.operations;
  const reportCards = data.reportCards;
  const waitlist = data.waitlist;

  const startDate = dateRange.start.toLocaleDateString();
  const endDate = dateRange.end.toLocaleDateString();
  const generatedDate = new Date().toLocaleString();

  let operationsSection = '';
  if (operations) {
    operationsSection = `
    <h2>Operational Metrics</h2>
    <table class="data-table">
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Add-on Attachment Rate</td><td>${operations.addonAttachmentRate?.toFixed(1) ?? 0}%</td></tr>
        <tr><td>Cancellation Rate</td><td>${operations.cancellationRate?.toFixed(1) ?? 0}%</td></tr>
        <tr><td>No-Show Rate</td><td>${operations.noShowRate?.toFixed(1) ?? 0}%</td></tr>
        <tr><td>Avg Appointment Duration</td><td>${Math.round(operations.avgAppointmentDuration ?? 0)} min</td></tr>
        <tr><td>Groomer Productivity</td><td>${operations.groomerProductivity?.toFixed(1) ?? 0} appts/day</td></tr>
      </tbody>
    </table>`;
  }

  let reportCardsSection = '';
  if (reportCards) {
    reportCardsSection = `
    <h2>Report Card Performance</h2>
    <table class="data-table">
      <thead><tr><th>Stage</th><th>Count</th><th>Rate</th></tr></thead>
      <tbody>
        <tr><td>Reports Sent</td><td>${reportCards.sent?.count ?? 0}</td><td>${reportCards.sent?.percentage?.toFixed(1) ?? 0}%</td></tr>
        <tr><td>Reports Opened</td><td>${reportCards.opened?.count ?? 0}</td><td>${reportCards.opened?.percentage?.toFixed(1) ?? 0}%</td></tr>
        <tr><td>Reviews Submitted</td><td>${reportCards.reviewed?.count ?? 0}</td><td>${reportCards.reviewed?.percentage?.toFixed(1) ?? 0}%</td></tr>
        <tr><td>Public Reviews</td><td>${reportCards.publicReviews?.count ?? 0}</td><td>${reportCards.publicReviews?.percentage?.toFixed(1) ?? 0}%</td></tr>
      </tbody>
    </table>`;
  }

  let waitlistSection = '';
  if (waitlist) {
    waitlistSection = `
    <h2>Waitlist Performance</h2>
    <table class="data-table">
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Active Waitlist</td><td>${waitlist.activeCount ?? 0}</td></tr>
        <tr><td>Fill Rate</td><td>${waitlist.fillRate?.percentage?.toFixed(1) ?? 0}% (${waitlist.fillRate?.filled ?? 0} / ${waitlist.fillRate?.total ?? 0})</td></tr>
        <tr><td>Response Rate</td><td>${waitlist.responseRate?.percentage?.toFixed(1) ?? 0}%</td></tr>
        <tr><td>Avg Wait Time</td><td>${waitlist.avgWaitTime?.toFixed(1) ?? 0} hrs</td></tr>
        <tr><td>Conversion Rate</td><td>${waitlist.conversionRate?.percentage?.toFixed(1) ?? 0}%</td></tr>
      </tbody>
    </table>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Analytics Report - The Puppy Day</title>
  <style>
    @media print {
      @page {
        margin: 1in;
      }
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #434E54;
    }
    h1 {
      color: #434E54;
      border-bottom: 3px solid #434E54;
      padding-bottom: 10px;
    }
    h2 {
      color: #434E54;
      margin-top: 30px;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 5px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .date-range {
      text-align: center;
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 20px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .kpi-card {
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 15px;
      background: #F9FAFB;
    }
    .kpi-label {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 5px;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: bold;
      color: #434E54;
      margin-bottom: 10px;
    }
    .kpi-change {
      font-size: 14px;
    }
    .positive {
      color: #10b981;
    }
    .negative {
      color: #ef4444;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .data-table th, .data-table td {
      border: 1px solid #E5E7EB;
      padding: 8px 12px;
      text-align: left;
    }
    .data-table th {
      background: #F9FAFB;
      font-weight: 600;
      font-size: 12px;
      color: #6B7280;
    }
    .data-table td {
      font-size: 14px;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #6B7280;
      border-top: 1px solid #E5E7EB;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Analytics Report</h1>
    <div class="subtitle">The Puppy Day - Dog Grooming Analytics</div>
  </div>

  <div class="date-range">
    Report Period: <strong>${startDate}</strong> to <strong>${endDate}</strong><br>
    Generated: ${generatedDate}
  </div>

  <h2>Key Performance Indicators</h2>
  <div class="kpi-grid">
    ${generateKPICard('Total Revenue', kpis.total_revenue)}
    ${generateKPICard('Total Appointments', kpis.total_appointments)}
    ${generateKPICard('Avg Booking Value', kpis.avg_booking_value)}
    ${generateKPICard('Retention Rate', kpis.retention_rate)}
    ${generateKPICard('Review Generation', kpis.review_generation_rate)}
    ${generateKPICard('Waitlist Fill Rate', kpis.waitlist_fill_rate)}
  </div>

  ${operationsSection}
  ${reportCardsSection}
  ${waitlistSection}

  <div class="footer">
    <p>This report was automatically generated by The Puppy Day Analytics Dashboard</p>
    <p>14936 Leffingwell Rd, La Mirada, CA 90638 | (657) 252-2903</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML for a single KPI card
 */
function generateKPICard(label: string, kpi: any): string {
  const formattedValue = formatKPIValue(kpi.value, kpi.format);
  const changeClass = kpi.change > 0 ? 'positive' : kpi.change < 0 ? 'negative' : '';
  const changeSymbol = kpi.change > 0 ? '+' : '';

  return `
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(label)}</div>
      <div class="kpi-value">${escapeHtml(formattedValue)}</div>
      <div class="kpi-change ${changeClass}">
        ${changeSymbol}${escapeHtml(kpi.change.toFixed(1))}% vs previous period
      </div>
    </div>
  `;
}

/**
 * Format KPI value based on format type
 */
function formatKPIValue(value: number, format: 'currency' | 'number' | 'percentage'): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } else if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  } else {
    return new Intl.NumberFormat('en-US').format(value);
  }
}

/**
 * Export analytics report as PDF using browser print
 */
export function exportAnalyticsPDF(kpis: any, dateRange: { start: Date; end: Date }): void {
  const html = generateAnalyticsReportHTML(kpis, dateRange);

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the PDF report');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close after printing (user can cancel)
      setTimeout(() => {
        printWindow.close();
      }, 100);
    }, 500);
  };
}
