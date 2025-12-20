/**
 * CSV Import Modal Shell
 * Task 0019: Multi-step CSV import workflow
 * Steps: Upload → Validate → Review Duplicates → Import → Summary
 */

'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type {
  CSVValidationResponse,
  CSVImportResult,
  DuplicateMatch,
} from '@/types/admin-appointments';
import { FileUploadStep } from './csv/FileUploadStep';
import { ValidationPreview } from './csv/ValidationPreview';
import { DuplicateHandler } from './csv/DuplicateHandler';
import { ImportProgress } from './csv/ImportProgress';
import { ImportSummary } from './csv/ImportSummary';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'validating' | 'review' | 'duplicates' | 'importing' | 'summary';

interface ImportState {
  currentStep: ImportStep;
  selectedFile: File | null;
  validationResults: CSVValidationResponse | null;
  duplicateResolution: 'skip' | 'overwrite';
  importResults: CSVImportResult | null;
  error: string | null;
}

const STEP_TITLES: Record<ImportStep, string> = {
  upload: 'Upload CSV File',
  validating: 'Validating...',
  review: 'Review Validation Results',
  duplicates: 'Resolve Duplicates',
  importing: 'Importing Appointments',
  summary: 'Import Complete',
};

export function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [state, setState] = useState<ImportState>({
    currentStep: 'upload',
    selectedFile: null,
    validationResults: null,
    duplicateResolution: 'skip',
    importResults: null,
    error: null,
  });

  // Reset state on close
  const handleClose = useCallback(() => {
    setState({
      currentStep: 'upload',
      selectedFile: null,
      validationResults: null,
      duplicateResolution: 'skip',
      importResults: null,
      error: null,
    });
    onClose();
  }, [onClose]);

  // Handle file selection
  const handleFileSelected = useCallback((file: File) => {
    setState((prev) => ({
      ...prev,
      selectedFile: file,
      validationResults: null,
      error: null,
    }));
  }, []);

  // Handle validation complete
  const handleValidationComplete = useCallback((results: CSVValidationResponse) => {
    setState((prev) => ({
      ...prev,
      validationResults: results,
      currentStep: results.duplicates_found > 0 ? 'duplicates' : 'review',
    }));
  }, []);

  // Handle validation error
  const handleValidationError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      error,
      currentStep: 'upload',
    }));
  }, []);

  // Handle continue from validation review
  const handleContinueFromReview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: 'importing',
    }));
  }, []);

  // Handle duplicate resolution
  const handleDuplicateResolution = useCallback((strategy: 'skip' | 'overwrite') => {
    setState((prev) => ({
      ...prev,
      duplicateResolution: strategy,
      currentStep: 'importing',
    }));
  }, []);

  // Handle import complete
  const handleImportComplete = useCallback((results: CSVImportResult) => {
    setState((prev) => ({
      ...prev,
      importResults: results,
      currentStep: 'summary',
    }));
  }, []);

  // Handle import error
  const handleImportError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      error,
      currentStep: 'upload',
    }));
  }, []);

  // Handle finish
  const handleFinish = useCallback(() => {
    handleClose();
    onSuccess();
  }, [handleClose, onSuccess]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep === 'review' || prev.currentStep === 'duplicates') {
        return { ...prev, currentStep: 'upload' };
      }
      return prev;
    });
  }, []);

  if (!isOpen) return null;

  const canClose = state.currentStep !== 'validating' && state.currentStep !== 'importing';

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-5xl w-full h-[90vh] max-h-[900px] p-0 bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-[#434E54]">Import Appointments from CSV</h2>
            <p className="text-sm text-[#6B7280] mt-1">{STEP_TITLES[state.currentStep]}</p>
          </div>
          {canClose && (
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-sm btn-circle text-[#6B7280] hover:text-[#434E54] hover:bg-[#EAE0D5]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Indicator - Only show for non-error steps */}
        {state.currentStep !== 'upload' && state.currentStep !== 'summary' && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex-1 h-2 rounded-full transition-all ${
                  state.currentStep === 'validating'
                    ? 'bg-[#434E54]'
                    : state.currentStep === 'review' || state.currentStep === 'duplicates'
                    ? 'bg-[#6BCB77]'
                    : 'bg-[#EAE0D5]'
                }`}
              />
              <div
                className={`flex-1 h-2 rounded-full transition-all ${
                  state.currentStep === 'importing'
                    ? 'bg-[#434E54]'
                    : state.currentStep === 'summary'
                    ? 'bg-[#6BCB77]'
                    : 'bg-[#EAE0D5]'
                }`}
              />
              <div
                className={`flex-1 h-2 rounded-full transition-all ${
                  state.currentStep === 'summary' ? 'bg-[#6BCB77]' : 'bg-[#EAE0D5]'
                }`}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Upload Step */}
          {state.currentStep === 'upload' && (
            <FileUploadStep
              selectedFile={state.selectedFile}
              error={state.error}
              onFileSelected={handleFileSelected}
              onValidationStart={() => setState((prev) => ({ ...prev, currentStep: 'validating' }))}
              onValidationComplete={handleValidationComplete}
              onValidationError={handleValidationError}
            />
          )}

          {/* Validating Step */}
          {state.currentStep === 'validating' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="loading loading-spinner loading-lg text-[#434E54]"></div>
              <p className="text-lg font-medium text-[#434E54] mt-4">Validating CSV file...</p>
              <p className="text-sm text-[#6B7280] mt-2">
                This may take a moment for large files
              </p>
            </div>
          )}

          {/* Validation Review Step */}
          {state.currentStep === 'review' && state.validationResults && (
            <ValidationPreview
              results={state.validationResults}
              onContinue={handleContinueFromReview}
              onBack={handleBack}
            />
          )}

          {/* Duplicate Resolution Step */}
          {state.currentStep === 'duplicates' && state.validationResults && (
            <DuplicateHandler
              duplicates={state.validationResults.duplicates}
              onResolve={handleDuplicateResolution}
              onBack={handleBack}
            />
          )}

          {/* Importing Step */}
          {state.currentStep === 'importing' && state.selectedFile && (
            <ImportProgress
              file={state.selectedFile}
              duplicateStrategy={state.duplicateResolution}
              onComplete={handleImportComplete}
              onError={handleImportError}
            />
          )}

          {/* Summary Step */}
          {state.currentStep === 'summary' && state.importResults && (
            <ImportSummary results={state.importResults} onClose={handleFinish} />
          )}
        </div>

        {/* Footer - Only show back/cancel on certain steps */}
        {(state.currentStep === 'review' || state.currentStep === 'duplicates') && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-[#FFFBF7]">
            <button
              onClick={handleBack}
              className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5] font-medium"
            >
              Back
            </button>
            <div className="text-sm text-[#6B7280]">
              {state.currentStep === 'duplicates'
                ? `${state.validationResults?.duplicates_found || 0} duplicates to resolve`
                : `${state.validationResults?.valid_rows || 0} valid rows ready to import`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
