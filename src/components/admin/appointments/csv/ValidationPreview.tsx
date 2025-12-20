/**
 * Validation Preview Component
 * Task 0021: Display validation results with error highlighting
 */

'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import type { CSVValidationResponse, ValidatedCSVRow } from '@/types/admin-appointments';

interface ValidationPreviewProps {
  results: CSVValidationResponse;
  onContinue: () => void;
  onBack: () => void;
}

export function ValidationPreview({ results, onContinue, onBack }: ValidationPreviewProps) {
  const [activeTab, setActiveTab] = useState<'valid' | 'errors'>('valid');

  // Download error report
  const handleDownloadErrors = () => {
    if (results.errors.length === 0) return;

    // Create CSV content
    const header = 'Row,Field,Error\n';
    const rows = results.errors
      .map((error) => {
        const row = error.field === 'general' ? 'N/A' : error.field;
        return `${row},"${error.field}","${error.message}"`;
      })
      .join('\n');

    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation-errors.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const canContinue = results.valid_rows > 0;
  const hasErrors = results.invalid_rows > 0;
  const hasDuplicates = results.duplicates_found > 0;

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Rows */}
        <div className="bg-[#FFFBF7] rounded-lg p-6 border border-[#EAE0D5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#434E54]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#434E54]">{results.total_rows}</p>
              <p className="text-sm text-[#6B7280]">Total Rows</p>
            </div>
          </div>
        </div>

        {/* Valid Rows */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{results.valid_rows}</p>
              <p className="text-sm text-green-600">Valid Rows</p>
            </div>
          </div>
        </div>

        {/* Invalid Rows */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{results.invalid_rows}</p>
              <p className="text-sm text-red-600">Invalid Rows</p>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Warning */}
      {hasDuplicates && (
        <div className="alert bg-amber-50 border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">
              {results.duplicates_found} potential duplicate{results.duplicates_found !== 1 ? 's' : ''} detected
            </p>
            <p className="text-sm text-amber-700">
              You will be able to review and resolve duplicates in the next step
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-[#EAE0D5] p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('valid')}
          className={`tab flex-1 font-medium transition-all ${
            activeTab === 'valid'
              ? 'tab-active bg-white text-[#434E54] rounded-lg shadow-sm'
              : 'text-[#6B7280] hover:text-[#434E54]'
          }`}
        >
          Valid Rows ({results.valid_rows})
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`tab flex-1 font-medium transition-all ${
            activeTab === 'errors'
              ? 'tab-active bg-white text-[#434E54] rounded-lg shadow-sm'
              : 'text-[#6B7280] hover:text-[#434E54]'
          }`}
        >
          Errors ({results.invalid_rows})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 min-h-[300px]">
        {activeTab === 'valid' && (
          <div className="p-4">
            {results.valid_rows === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="w-12 h-12 text-[#9CA3AF] mb-3" />
                <p className="text-[#6B7280]">No valid rows found</p>
                <p className="text-sm text-[#9CA3AF] mt-1">
                  Please fix the errors and re-upload the CSV file
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#434E54]">
                    Preview (first 10 rows)
                  </p>
                  <span className="badge bg-[#EAE0D5] text-[#434E54] border-0">
                    {results.valid_rows} total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr className="bg-[#FFFBF7] border-b border-gray-200">
                        <th className="text-[#434E54] font-semibold">Row</th>
                        <th className="text-[#434E54] font-semibold">Customer</th>
                        <th className="text-[#434E54] font-semibold">Pet</th>
                        <th className="text-[#434E54] font-semibold">Service</th>
                        <th className="text-[#434E54] font-semibold">Date</th>
                        <th className="text-[#434E54] font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.preview.slice(0, 10).map((row) => (
                        <tr key={row.rowNumber} className="hover:bg-[#FFFBF7]">
                          <td className="text-[#6B7280]">{row.rowNumber}</td>
                          <td className="text-[#434E54]">{row.customer_name}</td>
                          <td className="text-[#434E54]">{row.pet_name}</td>
                          <td className="text-[#6B7280]">{row.service_name}</td>
                          <td className="text-[#6B7280]">{row.date}</td>
                          <td className="text-[#6B7280]">{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="p-4">
            {results.errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-[#6B7280]">No errors found</p>
                <p className="text-sm text-[#9CA3AF] mt-1">All rows are valid</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#434E54]">
                    Validation Errors ({results.errors.length})
                  </p>
                  <button
                    onClick={handleDownloadErrors}
                    className="btn btn-ghost btn-sm text-[#434E54] hover:bg-[#EAE0D5] gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Errors
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr className="bg-red-50 border-b border-red-200">
                        <th className="text-red-900 font-semibold">Field</th>
                        <th className="text-red-900 font-semibold">Error Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.errors.map((error, index) => (
                        <tr key={index} className="hover:bg-red-50">
                          <td className="font-medium text-[#434E54]">{error.field}</td>
                          <td className="text-red-700">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button onClick={onBack} className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5] font-medium">
          Upload Different File
        </button>
        {canContinue && (
          <button
            onClick={onContinue}
            className="btn bg-[#434E54] text-white hover:bg-[#363F44] font-medium px-8"
          >
            {hasErrors ? 'Continue with Valid Rows' : 'Continue to Import'}
          </button>
        )}
      </div>
    </div>
  );
}
