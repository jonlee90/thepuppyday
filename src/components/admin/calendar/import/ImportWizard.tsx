/**
 * Import Wizard Component
 * Task 0044: Main wizard container with step management
 * FIXED: Refactored to 3 steps with automatic matching (Option B)
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle } from 'lucide-react';
import { DateRangeStep } from './DateRangeStep';
import { EventSelectionStep } from './EventSelectionStep';
import { ReviewStep } from './ReviewStep';
import { toast } from '@/hooks/use-toast';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GoogleCalendarEvent {
  google_event_id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  parsed_data?: {
    title: string;
    start: string;
    end: string;
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    pet?: {
      name?: string;
      size?: string;
    };
    service_name?: string;
    notes?: string;
  };
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  duplicate_match?: {
    appointment_id: string;
    confidence: number;
    matched_customer_id?: string;
    matched_pet_id?: string;
  } | null;
  importable: boolean;
}

interface ImportPreview {
  success: boolean;
  events: GoogleCalendarEvent[];
  summary: {
    total: number;
    importable: number;
    duplicates: number;
    invalid: number;
  };
}

interface ImportOptions {
  skip_duplicates: boolean;
  create_new_customers: boolean;
  default_service_id: string;
}

interface ImportResult {
  google_event_id: string;
  status: 'imported' | 'skipped' | 'failed';
  appointment_id?: string;
  error?: string;
  reason?: string;
}

interface ImportResponse {
  success: boolean;
  results: ImportResult[];
  summary: {
    total: number;
    imported: number;
    skipped: number;
    failed: number;
  };
}

type WizardStep = 1 | 2 | 3;

export function ImportWizard({ isOpen, onClose, onSuccess }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Step 1 state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Step 2 state
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<ImportOptions>({
    skip_duplicates: true,
    create_new_customers: false,
    default_service_id: '',
  });

  // Step 3 state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);

  // Initialize default dates
  useEffect(() => {
    if (isOpen && !dateFrom && !dateTo) {
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);

      setDateFrom(today.toISOString().split('T')[0]);
      setDateTo(in30Days.toISOString().split('T')[0]);
    }
  }, [isOpen, dateFrom, dateTo]);

  // Reset wizard when closed
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation completes
      setTimeout(() => {
        setCurrentStep(1);
        setDateFrom('');
        setDateTo('');
        setPreview(null);
        setSelectedEventIds(new Set());
        setOptions({
          skip_duplicates: true,
          create_new_customers: false,
          default_service_id: '',
        });
        setImportResults(null);
        setPreviewError(null);
      }, 300);
    }
  }, [isOpen]);

  // Handle date range preview
  const handlePreviewEvents = async () => {
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/admin/calendar/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom, dateTo }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch events');
      }

      const data: ImportPreview = await response.json();
      setPreview(data);
      setCurrentStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch events';
      setPreviewError(message);
      toast.error('Failed to fetch events', {
        description: message,
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle event selection
  const handleToggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!preview) return;
    const allIds = new Set(preview.events.filter(e => e.importable).map((e) => e.google_event_id));
    setSelectedEventIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedEventIds(new Set());
  };

  // Handle options update
  const handleUpdateOptions = (field: keyof ImportOptions, value: boolean | string) => {
    setOptions((prev) => ({ ...prev, [field]: value }));
  };

  // Navigation
  const handleBack = () => {
    if (currentStep > 1) {
      setIsNavigatingBack(true);
      setCurrentStep((prev) => (prev - 1) as WizardStep);
      setTimeout(() => setIsNavigatingBack(false), 300);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      handlePreviewEvents();
    } else if (currentStep === 2) {
      // Validation: At least one event must be selected
      if (selectedEventIds.size === 0) {
        toast.error('No Events Selected', {
          description: 'Please select at least one event to import',
        });
        return;
      }

      // Validation: Default service required if create_new_customers is enabled
      if (options.create_new_customers && !options.default_service_id) {
        toast.error('Default Service Required', {
          description: 'Please select a default service when auto-creating customers',
        });
        return;
      }

      setCurrentStep(3);
    }
  };

  // Handle import confirmation
  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedEventIds.size });

    try {
      const response = await fetch('/api/admin/calendar/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_ids: Array.from(selectedEventIds),
          options,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import events');
      }

      const data: ImportResponse = await response.json();
      setImportResults(data);

      // Show success toast
      if (data.summary.imported > 0) {
        toast.success('Import Complete', {
          description: `Successfully imported ${data.summary.imported} of ${data.summary.total} appointments`,
        });
      }

      // Call onSuccess callback if any imports succeeded
      if (data.summary.imported > 0) {
        onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import events';
      toast.error('Import Failed', {
        description: message,
      });
      setImportResults({
        success: false,
        results: [],
        summary: {
          total: selectedEventIds.size,
          imported: 0,
          skipped: 0,
          failed: selectedEventIds.size,
        },
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (currentStep > 1 || selectedEventIds.size > 0) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onClose();
  };

  // Step indicator
  const steps = [
    { number: 1, label: 'Date Range' },
    { number: 2, label: 'Select Events' },
    { number: 3, label: 'Review & Confirm' },
  ];

  // Modal variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCancel();
        }}
      >
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5] bg-[#FFFBF7]">
            <div>
              <h2 className="text-2xl font-semibold text-[#434E54]">Import from Google Calendar</h2>
              <p className="text-sm text-[#6B7280] mt-1">Import calendar events as appointments</p>
            </div>
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm btn-circle hover:bg-[#F8EEE5]"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 p-4 bg-[#F8EEE5]">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      transition-all duration-200
                      ${
                        currentStep === step.number
                          ? 'bg-[#F59E0B] text-white ring-4 ring-[#F59E0B]/20'
                          : currentStep > step.number
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#E5E5E5] text-[#9CA3AF]'
                      }
                    `}
                  >
                    {currentStep > step.number ? <Check className="w-4 h-4" /> : step.number}
                  </div>
                  <span
                    className={`
                      text-sm font-medium hidden md:inline
                      ${currentStep === step.number ? 'text-[#434E54]' : 'text-[#9CA3AF]'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 md:w-20 h-0.5 mx-2 bg-[#E5E5E5]" />
                )}
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <AnimatePresence mode="wait" custom={isNavigatingBack ? -1 : 1}>
              <motion.div
                key={currentStep}
                custom={isNavigatingBack ? -1 : 1}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', duration: 0.3 }}
              >
                {currentStep === 1 && (
                  <DateRangeStep
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    isLoading={isLoadingPreview}
                    error={previewError}
                  />
                )}
                {currentStep === 2 && preview && (
                  <EventSelectionStep
                    events={preview.events}
                    selectedEventIds={selectedEventIds}
                    onToggleEvent={handleToggleEvent}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    options={options}
                    onUpdateOptions={handleUpdateOptions}
                    summary={preview.summary}
                  />
                )}
                {currentStep === 3 && preview && (
                  <ReviewStep
                    events={preview.events.filter((e) => selectedEventIds.has(e.google_event_id))}
                    options={options}
                    isImporting={isImporting}
                    importProgress={importProgress}
                    importResults={importResults}
                    onConfirm={handleConfirmImport}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[#E5E5E5] bg-[#FFFBF7]">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isImporting || isLoadingPreview}
              className="btn btn-ghost hover:bg-[#F8EEE5] disabled:opacity-50"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={isImporting || isLoadingPreview}
                className="btn btn-ghost hover:bg-[#F8EEE5]"
              >
                Cancel
              </button>
              {currentStep < 3 && (
                <button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && (!dateFrom || !dateTo)) ||
                    (currentStep === 2 && selectedEventIds.size === 0) ||
                    isLoadingPreview ||
                    isImporting
                  }
                  className="btn bg-[#F59E0B] hover:bg-[#D97706] text-white border-none disabled:bg-[#E5E5E5] disabled:text-[#9CA3AF]"
                >
                  {currentStep === 1 && isLoadingPreview ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Loading Events...
                    </>
                  ) : (
                    'Next'
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 shadow-xl max-w-md"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#434E54] mb-2">Cancel Import?</h3>
                  <p className="text-sm text-[#6B7280] mb-4">
                    Are you sure you want to cancel? All progress will be lost.
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setShowCancelDialog(false)}
                      className="btn btn-ghost hover:bg-[#F8EEE5]"
                    >
                      Continue Import
                    </button>
                    <button
                      onClick={handleConfirmCancel}
                      className="btn bg-[#EF4444] hover:bg-[#DC2626] text-white border-none"
                    >
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
