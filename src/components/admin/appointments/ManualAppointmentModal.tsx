/**
 * Manual Appointment Modal Shell
 * Task 0013: 5-step wizard for admins to manually create appointments
 */

'use client';

import { useState, useCallback } from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { ManualAppointmentState } from '@/types/admin-appointments';
import { CustomerSelectionStep } from './steps/CustomerSelectionStep';
import { PetSelectionStep } from './steps/PetSelectionStep';
import { ServiceSelectionStep } from './steps/ServiceSelectionStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { SummaryStep } from './steps/SummaryStep';

interface ManualAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  'Select Customer',
  'Select Pet',
  'Select Service',
  'Choose Date & Time',
  'Review & Confirm',
];

export function ManualAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualAppointmentModalProps) {
  const [state, setState] = useState<ManualAppointmentState>({
    currentStep: 1,
    selectedCustomer: null,
    selectedPet: null,
    selectedService: null,
    selectedAddons: [],
    selectedDateTime: null,
    notes: '',
    paymentStatus: 'pending',
    paymentDetails: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset state on close
  const handleClose = useCallback(() => {
    setState({
      currentStep: 1,
      selectedCustomer: null,
      selectedPet: null,
      selectedService: null,
      selectedAddons: [],
      selectedDateTime: null,
      notes: '',
      paymentStatus: 'pending',
      paymentDetails: undefined,
    });
    onClose();
  }, [onClose]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, TOTAL_STEPS),
    }));
  }, []);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  // Update state
  const updateState = useCallback((updates: Partial<ManualAppointmentState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle successful creation
  const handleCreationSuccess = useCallback(() => {
    handleClose();
    onSuccess();
  }, [handleClose, onSuccess]);

  // Check if current step is valid (for enabling Next button)
  const isCurrentStepValid = useCallback(() => {
    switch (state.currentStep) {
      case 1:
        return !!state.selectedCustomer;
      case 2:
        return !!state.selectedPet;
      case 3:
        return !!state.selectedService;
      case 4:
        return !!state.selectedDateTime;
      case 5:
        return true; // Summary step - always valid for display
      default:
        return false;
    }
  }, [state.currentStep, state.selectedCustomer, state.selectedPet, state.selectedService, state.selectedDateTime]);

  // Get next button label based on current step
  const getNextButtonLabel = () => {
    switch (state.currentStep) {
      case 1:
        return 'Next: Select Pet';
      case 2:
        return 'Next: Select Service';
      case 3:
        return 'Next: Choose Date & Time';
      case 4:
        return 'Next: Review';
      default:
        return 'Next';
    }
  };

  // Handle final submission
  const handleSubmit = useCallback(async () => {
    if (!state.selectedCustomer || !state.selectedPet || !state.selectedService || !state.selectedDateTime) {
      setSubmitError('Missing required information');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const addonIds = Array.isArray(state.selectedAddons)
        ? state.selectedAddons.map((a) => a.id)
        : [];

      const payload = {
        customer: state.selectedCustomer,
        pet: state.selectedPet,
        service_id: state.selectedService.id,
        addon_ids: addonIds,
        appointment_date: state.selectedDateTime.date,
        appointment_time: state.selectedDateTime.time,
        notes: state.notes || undefined,
        payment_status: state.paymentStatus,
        payment_details: state.paymentDetails,
        send_notification: true,
      };

      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to create appointment';
        throw new Error(errorMessage);
      }

      handleCreationSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [state, handleCreationSuccess]);

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl w-full h-[90vh] max-h-[900px] p-0 bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-[#434E54]">Create Appointment</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Step {state.currentStep} of {TOTAL_STEPS}: {STEP_TITLES[state.currentStep - 1]}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle text-[#6B7280] hover:text-[#434E54] hover:bg-[#EAE0D5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-colors ${
                    step < state.currentStep
                      ? 'bg-[#6BCB77] text-white'
                      : step === state.currentStep
                      ? 'bg-[#434E54] text-white'
                      : 'bg-[#EAE0D5] text-[#9CA3AF]'
                  }`}
                >
                  {step}
                </div>
                {step < TOTAL_STEPS && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                      step < state.currentStep ? 'bg-[#6BCB77]' : 'bg-[#EAE0D5]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {state.currentStep === 1 && (
            <CustomerSelectionStep
              state={state}
              updateState={updateState}
              onNext={handleNext}
            />
          )}
          {state.currentStep === 2 && (
            <PetSelectionStep state={state} updateState={updateState} onNext={handleNext} />
          )}
          {state.currentStep === 3 && (
            <ServiceSelectionStep
              state={state}
              updateState={updateState}
              onNext={handleNext}
            />
          )}
          {state.currentStep === 4 && (
            <DateTimeStep state={state} updateState={updateState} onNext={handleNext} />
          )}
          {state.currentStep === 5 && (
            <SummaryStep state={state} onSuccess={handleCreationSuccess} />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-[#FFFBF7]">
          <button
            onClick={state.currentStep === 1 ? handleClose : handleBack}
            className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5] font-medium"
            disabled={isSubmitting}
          >
            {state.currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {/* Next / Create Appointment Button */}
          {state.currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
              className={`btn ${
                isCurrentStepValid()
                  ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
                  : 'btn-disabled bg-gray-300 text-gray-500'
              }`}
            >
              {getNextButtonLabel()}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`btn btn-lg ${
                isSubmitting
                  ? 'btn-disabled bg-gray-300 text-gray-500'
                  : 'bg-[#6BCB77] text-white hover:bg-[#5BB967]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Create Appointment
                </>
              )}
            </button>
          )}
        </div>

        {/* Submit Error Display */}
        {submitError && (
          <div className="px-6 pb-4">
            <div className="alert alert-error">
              <span>{submitError}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
