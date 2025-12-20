/**
 * Import Progress Component
 * Task 0023: Display real-time import progress with batch processing
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { CSVImportResult } from '@/types/admin-appointments';

interface ImportProgressProps {
  file: File;
  duplicateStrategy: 'skip' | 'overwrite';
  onComplete: (results: CSVImportResult) => void;
  onError: (error: string) => void;
}

export function ImportProgress({
  file,
  duplicateStrategy,
  onComplete,
  onError,
}: ImportProgressProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'importing' | 'complete'>('preparing');
  const [stats, setStats] = useState({
    processed: 0,
    successful: 0,
    failed: 0,
  });
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in development mode
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const executeImport = async () => {
      try {
        setStatus('importing');
        setProgress(10);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('duplicate_strategy', duplicateStrategy);
        formData.append('send_notifications', 'false'); // Default to false for bulk imports

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 500);

        const response = await fetch('/api/admin/appointments/import', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Import failed');
        }

        const results: CSVImportResult = await response.json();

        // Update final stats
        setStats({
          processed: results.total_rows,
          successful: results.created_count,
          failed: results.failed_count,
        });

        setProgress(100);
        setStatus('complete');

        // Short delay before transitioning to summary
        setTimeout(() => {
          onComplete(results);
        }, 1000);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Import failed');
      }
    };

    executeImport();
  }, [file, duplicateStrategy, onComplete, onError]);

  return (
    <div className="space-y-8">
      {/* Status Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {status === 'complete' ? (
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          ) : (
            <div className="p-4 bg-[#EAE0D5] rounded-full">
              <Loader2 className="w-10 h-10 text-[#434E54] animate-spin" />
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-[#434E54] mb-2">
          {status === 'preparing' && 'Preparing Import...'}
          {status === 'importing' && 'Importing Appointments...'}
          {status === 'complete' && 'Import Complete!'}
        </h3>
        <p className="text-sm text-[#6B7280]">
          {status === 'preparing' && 'Getting ready to import your appointments'}
          {status === 'importing' && 'Processing your CSV file'}
          {status === 'complete' && 'Successfully imported appointments'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[#434E54]">Progress</span>
          <span className="font-semibold text-[#434E54]">{progress}%</span>
        </div>
        <div className="w-full h-4 bg-[#EAE0D5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#434E54] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Processed */}
        <div className="bg-[#FFFBF7] rounded-lg p-6 border border-[#EAE0D5]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#434E54]">{stats.processed}</p>
              <p className="text-sm text-[#6B7280]">Processed</p>
            </div>
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <Loader2 className="w-5 h-5 text-[#434E54]" />
            </div>
          </div>
        </div>

        {/* Successful */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.successful}</p>
              <p className="text-sm text-green-600">Successful</p>
            </div>
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
              <p className="text-sm text-red-600">Failed</p>
            </div>
            <div className="p-2.5 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-blue-100 rounded-lg mt-0.5">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">Processing in batches</p>
            <p className="text-sm text-blue-700">
              Large imports are processed in batches to ensure reliability. This may take a few
              moments.
            </p>
          </div>
        </div>
      </div>

      {/* Import Options Summary */}
      <div className="bg-[#FFFBF7] rounded-lg p-4 border border-[#EAE0D5]">
        <p className="text-sm text-[#6B7280]">
          <span className="font-semibold text-[#434E54]">Duplicate Strategy:</span>{' '}
          {duplicateStrategy === 'skip' ? 'Skip duplicates' : 'Overwrite duplicates'}
        </p>
      </div>
    </div>
  );
}
