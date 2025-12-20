/**
 * Import Summary Component
 * Task 0024: Display final import results with account activation messaging
 */

'use client';

import { CheckCircle, XCircle, Users, Dog, AlertCircle, Download, ExternalLink } from 'lucide-react';
import type { CSVImportResult } from '@/types/admin-appointments';
import { useRouter } from 'next/navigation';

interface ImportSummaryProps {
  results: CSVImportResult;
  onClose: () => void;
}

export function ImportSummary({ results, onClose }: ImportSummaryProps) {
  const router = useRouter();

  const hasErrors = results.failed_count > 0;
  const hasInactiveProfiles = results.inactive_profiles_created > 0;

  // Download error report
  const handleDownloadErrors = () => {
    if (results.errors.length === 0) return;

    const header = 'Field,Error\n';
    const rows = results.errors
      .map((error) => `"${error.field}","${error.message}"`)
      .join('\n');

    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleViewAppointments = () => {
    router.push('/admin/appointments');
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-[#434E54] mb-2">Import Complete!</h3>
        <p className="text-[#6B7280]">
          {results.created_count} appointment{results.created_count !== 1 ? 's' : ''} successfully
          imported
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Processed */}
        <div className="bg-[#FFFBF7] rounded-lg p-6 border border-[#EAE0D5]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#434E54]">{results.total_rows}</p>
              <p className="text-sm text-[#6B7280]">Total Rows</p>
            </div>
          </div>
        </div>

        {/* Successful */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-700">{results.created_count}</p>
              <p className="text-sm text-green-600">Imported</p>
            </div>
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Failed/Skipped */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-700">
                {results.failed_count + results.skipped_count}
              </p>
              <p className="text-sm text-red-600">Failed/Skipped</p>
            </div>
            <div className="p-2.5 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Records Created */}
      {(results.customers_created > 0 || results.pets_created > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-[#434E54] mb-4">Additional Records Created</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customers Created */}
            {results.customers_created > 0 && (
              <div className="flex items-center gap-3 p-4 bg-[#FFFBF7] rounded-lg">
                <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
                  <Users className="w-5 h-5 text-[#434E54]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#434E54]">{results.customers_created}</p>
                  <p className="text-sm text-[#6B7280]">New Customer{results.customers_created !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {/* Pets Created */}
            {results.pets_created > 0 && (
              <div className="flex items-center gap-3 p-4 bg-[#FFFBF7] rounded-lg">
                <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
                  <Dog className="w-5 h-5 text-[#434E54]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#434E54]">{results.pets_created}</p>
                  <p className="text-sm text-[#6B7280]">New Pet{results.pets_created !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Activation Notice */}
      {hasInactiveProfiles && (
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-blue-100 rounded-lg mt-0.5">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                {results.inactive_profiles_created} Inactive Customer Profile{results.inactive_profiles_created !== 1 ? 's' : ''} Created
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                These customers don't have accounts yet. They can claim their accounts by
                registering with the same email address used in the CSV import. Once registered,
                they'll have access to:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>View and manage their appointments</li>
                <li>Update pet information</li>
                <li>Access booking history and loyalty points</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Failed Imports */}
      {hasErrors && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-[#434E54]">
              Failed Imports ({results.failed_count})
            </h4>
            {results.errors.length > 0 && (
              <button
                onClick={handleDownloadErrors}
                className="btn btn-ghost btn-sm text-[#434E54] hover:bg-[#EAE0D5] gap-2"
              >
                <Download className="w-4 h-4" />
                Download Errors
              </button>
            )}
          </div>

          {results.errors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="bg-red-50 border-b border-red-200">
                    <th className="text-red-900 font-semibold">Field</th>
                    <th className="text-red-900 font-semibold">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {results.errors.slice(0, 10).map((error, index) => (
                    <tr key={index} className="hover:bg-red-50">
                      <td className="font-medium text-[#434E54]">{error.field}</td>
                      <td className="text-red-700">{error.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.errors.length > 10 && (
                <p className="text-sm text-[#6B7280] mt-3 text-center">
                  Showing first 10 errors. Download full error report for complete list.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">
              {results.skipped_count} row{results.skipped_count !== 1 ? 's' : ''} skipped due to duplicates
            </p>
          )}
        </div>
      )}

      {/* Import Details */}
      <div className="bg-[#FFFBF7] rounded-lg p-4 border border-[#EAE0D5]">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#9CA3AF] uppercase tracking-wide text-xs mb-1">Valid Rows</p>
            <p className="font-semibold text-[#434E54]">{results.valid_rows}</p>
          </div>
          <div>
            <p className="text-[#9CA3AF] uppercase tracking-wide text-xs mb-1">Invalid Rows</p>
            <p className="font-semibold text-[#434E54]">{results.invalid_rows}</p>
          </div>
          <div>
            <p className="text-[#9CA3AF] uppercase tracking-wide text-xs mb-1">Duplicates Found</p>
            <p className="font-semibold text-[#434E54]">{results.duplicates_found}</p>
          </div>
          <div>
            <p className="text-[#9CA3AF] uppercase tracking-wide text-xs mb-1">Skipped</p>
            <p className="font-semibold text-[#434E54]">{results.skipped_count}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          onClick={onClose}
          className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5] font-medium"
        >
          Close
        </button>
        <button
          onClick={handleViewAppointments}
          className="btn bg-[#434E54] text-white hover:bg-[#363F44] font-medium gap-2 px-8"
        >
          View Appointments
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
