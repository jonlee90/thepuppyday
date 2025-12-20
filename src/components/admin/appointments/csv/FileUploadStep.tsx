/**
 * File Upload Step Component
 * Task 0020: Drag-and-drop CSV upload with template download
 */

'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, X, AlertCircle } from 'lucide-react';
import type { CSVValidationResponse } from '@/types/admin-appointments';

interface FileUploadStepProps {
  selectedFile: File | null;
  error: string | null;
  onFileSelected: (file: File) => void;
  onValidationStart: () => void;
  onValidationComplete: (results: CSVValidationResponse) => void;
  onValidationError: (error: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function FileUploadStep({
  selectedFile,
  error,
  onFileSelected,
  onValidationStart,
  onValidationComplete,
  onValidationError,
}: FileUploadStepProps) {
  // Handle file drop/selection
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          onValidationError('File size exceeds 5MB limit');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          onValidationError('Only CSV files are accepted');
        } else {
          onValidationError('Invalid file. Please select a valid CSV file.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected, onValidationError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/appointments/import/template');
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appointment-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      onValidationError('Failed to download template. Please try again.');
    }
  };

  // Handle clear file
  const handleClearFile = () => {
    onFileSelected(null as any);
  };

  // Handle validate and continue
  const handleValidate = async () => {
    if (!selectedFile) return;

    onValidationStart();

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/appointments/import/validate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Validation failed');
      }

      const results: CSVValidationResponse = await response.json();
      onValidationComplete(results);
    } catch (err) {
      onValidationError(err instanceof Error ? err.message : 'Validation failed');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-[#FFFBF7] rounded-lg p-4 border border-[#EAE0D5]">
        <h3 className="text-sm font-semibold text-[#434E54] mb-2">Import Instructions</h3>
        <ul className="text-sm text-[#6B7280] space-y-1 list-disc list-inside">
          <li>Download the CSV template and fill in appointment details</li>
          <li>Ensure all required fields are completed</li>
          <li>Upload the completed CSV file for validation</li>
          <li>Review validation results before importing</li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error bg-red-50 border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
            isDragActive
              ? 'border-[#434E54] bg-[#FFFBF7]'
              : 'border-gray-300 hover:border-[#434E54] hover:bg-[#FFFBF7]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-[#EAE0D5] rounded-full">
              <Upload className="w-8 h-8 text-[#434E54]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#434E54] mb-1">
                {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here'}
              </p>
              <p className="text-sm text-[#6B7280]">or click to browse files</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <FileText className="w-4 h-4" />
              <span>CSV files only, max 5MB</span>
            </div>
          </div>
        </div>
      ) : (
        // Selected File Display
        <div className="bg-[#FFFBF7] rounded-lg p-6 border border-[#EAE0D5]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <FileText className="w-6 h-6 text-[#434E54]" />
              </div>
              <div>
                <p className="font-semibold text-[#434E54] mb-1">{selectedFile.name}</p>
                <p className="text-sm text-[#6B7280]">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              className="btn btn-ghost btn-sm btn-circle text-[#6B7280] hover:text-[#434E54] hover:bg-[#EAE0D5]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Template Download */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleDownloadTemplate}
          className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5] font-medium gap-2"
        >
          <Download className="w-4 h-4" />
          Download CSV Template
        </button>
      </div>

      {/* Continue Button */}
      {selectedFile && (
        <div className="flex justify-end pt-4">
          <button
            onClick={handleValidate}
            className="btn bg-[#434E54] text-white hover:bg-[#363F44] font-medium px-8"
          >
            Validate & Continue
          </button>
        </div>
      )}
    </div>
  );
}
