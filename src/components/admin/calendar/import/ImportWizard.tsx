/**
 * Import Wizard Component
 * Task 0044: Main wizard container with step management
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle } from 'lucide-react';
import { DateRangeStep } from './DateRangeStep';
import { EventSelectionStep } from './EventSelectionStep';
import { EventMappingForm } from './EventMappingForm';
import { ReviewStep } from './ReviewStep';
import { toast } from '@/hooks/use-toast';
import type { GoogleCalendarEvent } from '@/types/calendar';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EventMapping {
  eventId: string;
  customerId: string;
  petId: string;
  serviceId: string;
  addonIds: string[];
  notes: string;
  errors?: {
    customer?: string;
    pet?: string;
    service?: string;
  };
}

interface ImportPreview {
  events: GoogleCalendarEvent[];
  duplicates: Array<{
    eventId: string;
    appointmentId: string;
    matchScore: number;
  }>;
  suggestions: Array<{
    eventId: string;
    customerId?: string;
    petId?: string;
    serviceId?: string;
  }>;
}

type WizardStep = 1 | 2 | 3 | 4;

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

  // Step 3 state
  const [mappings, setMappings] = useState<Map<string, EventMapping>>(new Map());
  const [currentMappingIndex, setCurrentMappingIndex] = useState(0);

  // Step 4 state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: Array<{ eventId: string; message: string }>;
  } | null>(null);

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
        setMappings(new Map());
        setCurrentMappingIndex(0);
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
        throw new Error(error.message || 'Failed to fetch events');
      }

      const data = await response.json();
      setPreview({
        events: data.events,
        duplicates: data.duplicates || [],
        suggestions: data.suggestions || [],
      });
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
        // Remove mapping if event is deselected
        setMappings((prevMappings) => {
          const nextMappings = new Map(prevMappings);
          nextMappings.delete(eventId);
          return nextMappings;
        });
      } else {
        next.add(eventId);
        // Initialize mapping for new event
        setMappings((prevMappings) => {
          const nextMappings = new Map(prevMappings);
          nextMappings.set(eventId, {
            eventId,
            customerId: '',
            petId: '',
            serviceId: '',
            addonIds: [],
            notes: '',
          });
          return nextMappings;
        });
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!preview) return;
    const allIds = new Set(preview.events.map((e) => e.id));
    setSelectedEventIds(allIds);
    // Initialize mappings for all events
    setMappings((prevMappings) => {
      const nextMappings = new Map(prevMappings);
      preview.events.forEach((event) => {
        if (!nextMappings.has(event.id)) {
          nextMappings.set(event.id, {
            eventId: event.id,
            customerId: '',
            petId: '',
            serviceId: '',
            addonIds: [],
            notes: '',
          });
        }
      });
      return nextMappings;
    });
  };

  const handleDeselectAll = () => {
    setSelectedEventIds(new Set());
    setMappings(new Map());
  };

  // Handle mapping updates
  const handleUpdateMapping = (eventId: string, field: keyof EventMapping, value: string | string[]) => {
    setMappings((prev) => {
      const next = new Map(prev);
      const mapping = next.get(eventId);
      if (mapping) {
        next.set(eventId, { ...mapping, [field]: value });
      }
      return next;
    });
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
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Validate all mappings before proceeding
      let hasErrors = false;
      const updatedMappings = new Map(mappings);

      selectedEventIds.forEach((eventId) => {
        const mapping = mappings.get(eventId);
        if (mapping) {
          const errors: EventMapping['errors'] = {};
          if (!mapping.customerId) errors.customer = 'Customer is required';
          if (!mapping.petId) errors.pet = 'Pet is required';
          if (!mapping.serviceId) errors.service = 'Service is required';

          if (Object.keys(errors).length > 0) {
            hasErrors = true;
            updatedMappings.set(eventId, { ...mapping, errors });
          }
        }
      });

      if (hasErrors) {
        setMappings(updatedMappings);
        toast.error('Validation errors', {
          description: 'Please complete all required fields',
        });
        return;
      }

      setCurrentStep(4);
    }
  };

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

  // Handle import confirmation
  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedEventIds.size });

    try {
      const imports = Array.from(selectedEventIds).map((eventId) => {
        const mapping = mappings.get(eventId)!;
        return {
          event_id: eventId,
          customer_id: mapping.customerId,
          pet_id: mapping.petId,
          service_id: mapping.serviceId,
          addon_ids: mapping.addonIds,
          notes: mapping.notes,
        };
      });

      const response = await fetch('/api/admin/calendar/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imports }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import appointments');
      }

      const data = await response.json();

      interface ImportResultItem {
        success: boolean;
        event_id: string;
        error?: string;
      }

      setImportResults({
        successful: data.successful || 0,
        failed: data.failed || 0,
        errors: data.results
          ?.filter((r: ImportResultItem) => !r.success)
          .map((r: ImportResultItem) => ({ eventId: r.event_id, message: r.error || 'Unknown error' })) || [],
      });

      if (data.successful > 0) {
        toast.success('Import complete', {
          description: `Successfully imported ${data.successful} appointment${data.successful !== 1 ? 's' : ''}`,
        });
        onSuccess();
      }

      if (data.failed > 0) {
        toast.warning('Partial import', {
          description: `${data.failed} appointment${data.failed !== 1 ? 's' : ''} failed to import`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import appointments';
      toast.error('Import failed', {
        description: message,
      });
      setImportResults({
        successful: 0,
        failed: selectedEventIds.size,
        errors: [{ eventId: '', message }],
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Step indicator
  const steps = [
    { number: 1, label: 'Select Date Range' },
    { number: 2, label: 'Select Events' },
    { number: 3, label: 'Map Appointments' },
    { number: 4, label: 'Review & Confirm' },
  ];

  // Modal animations
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' },
    }),
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={handleCancel}
      >
        <motion.div
          className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wizard-title"
          aria-describedby="wizard-description"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between mb-4">
              <h2 id="wizard-title" className="text-xl font-semibold text-[#434E54]">
                Import Calendar Events
              </h2>
              <button
                onClick={handleCancel}
                className="btn btn-ghost btn-sm btn-circle hover:bg-[#F8EEE5]"
                aria-label="Close import wizard"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2" role="list" aria-label="Import wizard progress">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        currentStep > step.number
                          ? 'bg-[#10B981] text-white'
                          : currentStep === step.number
                          ? 'bg-[#434E54] text-white'
                          : 'bg-[#E5E5E5] text-[#9CA3AF]'
                      }`}
                      aria-current={currentStep === step.number ? 'step' : undefined}
                    >
                      {currentStep > step.number ? (
                        <Check className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <span className="text-sm font-medium">{step.number}</span>
                      )}
                    </div>
                    <span
                      className={`hidden md:inline text-sm ${
                        currentStep >= step.number ? 'text-[#434E54] font-medium' : 'text-[#9CA3AF]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 ${currentStep > step.number ? 'bg-[#10B981]' : 'bg-[#E5E5E5]'}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 240px)' }}>
            <AnimatePresence mode="wait" custom={isNavigatingBack ? -1 : 1}>
              <motion.div
                key={currentStep}
                custom={isNavigatingBack ? -1 : 1}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {currentStep === 1 && (
                  <DateRangeStep
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onChange={(field, value) => {
                      if (field === 'dateFrom') setDateFrom(value);
                      else setDateTo(value);
                    }}
                    onNext={handleNext}
                    isLoading={isLoadingPreview}
                    error={previewError}
                  />
                )}

                {currentStep === 2 && preview && (
                  <EventSelectionStep
                    events={preview.events}
                    duplicates={preview.duplicates}
                    suggestions={preview.suggestions}
                    selectedEventIds={selectedEventIds}
                    onToggleEvent={handleToggleEvent}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                )}

                {currentStep === 3 && (
                  <EventMappingForm
                    events={preview?.events || []}
                    selectedEventIds={selectedEventIds}
                    mappings={mappings}
                    suggestions={preview?.suggestions || []}
                    currentIndex={currentMappingIndex}
                    onUpdateMapping={handleUpdateMapping}
                    onChangeIndex={setCurrentMappingIndex}
                  />
                )}

                {currentStep === 4 && (
                  <ReviewStep
                    events={preview?.events || []}
                    mappings={Array.from(selectedEventIds).map((id) => mappings.get(id)!)}
                    duplicates={preview?.duplicates || []}
                    isImporting={isImporting}
                    progress={importProgress}
                    results={importResults}
                    onConfirm={handleConfirmImport}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          {!importResults && (
            <div className="p-6 border-t border-[#E5E5E5] flex items-center justify-between">
              <button
                onClick={handleBack}
                className="btn btn-ghost hover:bg-[#F8EEE5]"
                disabled={currentStep === 1 || isLoadingPreview || isImporting}
              >
                Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="btn btn-ghost hover:bg-[#F8EEE5] text-[#6B7280]"
                  disabled={isLoadingPreview || isImporting}
                >
                  Cancel
                </button>

                {currentStep < 4 && (
                  <button
                    onClick={handleNext}
                    className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] border-none text-white"
                    disabled={
                      isLoadingPreview ||
                      (currentStep === 1 && (!dateFrom || !dateTo)) ||
                      (currentStep === 2 && selectedEventIds.size === 0)
                    }
                  >
                    {isLoadingPreview ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Loading...
                      </>
                    ) : currentStep === 1 ? (
                      'Preview Events'
                    ) : currentStep === 2 ? (
                      'Continue to Mapping'
                    ) : (
                      'Review Import'
                    )}
                  </button>
                )}

                {currentStep === 4 && !importResults && (
                  <button
                    onClick={handleConfirmImport}
                    className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] border-none text-white"
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Importing...
                      </>
                    ) : (
                      'Confirm Import'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success/Results Footer */}
          {importResults && (
            <div className="p-6 border-t border-[#E5E5E5] flex justify-end">
              <button
                onClick={onClose}
                className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] border-none text-white"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>

        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCancelDialog(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#434E54] mb-2">Discard Import?</h3>
                  <p className="text-[#6B7280]">
                    All selected events and mappings will be lost. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="btn btn-ghost hover:bg-[#F8EEE5]"
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="btn btn-error bg-[#EF4444] hover:bg-[#DC2626] border-none text-white"
                >
                  Yes, Discard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
