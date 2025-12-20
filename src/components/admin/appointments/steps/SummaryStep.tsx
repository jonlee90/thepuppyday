/**
 * Summary & Confirmation Step
 * Task 0018: Review all selections and submit appointment
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { CheckCircle, AlertTriangle, Calendar, Clock, User, Dog, Scissors, DollarSign } from 'lucide-react';
import type { ManualAppointmentState, CreateAppointmentPayload } from '@/types/admin-appointments';
import { formatCurrency, getSizeLabel } from '@/lib/booking/pricing';

interface SummaryStepProps {
  state: ManualAppointmentState;
  onSuccess: () => void;
}

export function SummaryStep({ state, onSuccess }: SummaryStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate total price
  const totalPrice = useMemo(() => {
    const servicePrice = state.selectedService?.price || 0;
    const addonsTotal = state.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return servicePrice + addonsTotal;
  }, [state.selectedService, state.selectedAddons]);

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!state.selectedDateTime?.date) return '';
    const date = new Date(state.selectedDateTime.date);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [state.selectedDateTime?.date]);

  // Handle submission
  const handleSubmit = useCallback(async () => {
    if (!state.selectedCustomer || !state.selectedPet || !state.selectedService || !state.selectedDateTime) {
      setError('Missing required information');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateAppointmentPayload = {
        customer: state.selectedCustomer,
        pet: state.selectedPet,
        service_id: state.selectedService.id,
        addon_ids: state.selectedAddons.map((a) => a.id),
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
        throw new Error(data.error || 'Failed to create appointment');
      }

      const data = await response.json();

      // Show success toast (you can implement this with a toast library)
      console.log('Appointment created successfully:', data);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [state, onSuccess]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-[#6BCB77] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[#434E54] mb-2">Review Appointment</h3>
        <p className="text-[#6B7280]">
          Please review all details before creating the appointment
        </p>
      </div>

      {/* Past Date Warning */}
      {state.selectedDateTime?.isPastDate && (
        <div className="alert alert-warning">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">
            Warning: This appointment is scheduled for a past date
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Customer Info */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <User className="w-5 h-5 text-[#434E54]" />
            </div>
            <h4 className="font-semibold text-[#434E54]">Customer Information</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Name:</span>
              <span className="font-medium text-[#434E54]">
                {state.selectedCustomer?.first_name} {state.selectedCustomer?.last_name}
                {state.selectedCustomer?.isNew && (
                  <span className="ml-2 badge badge-sm bg-[#434E54] text-white">New</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Email:</span>
              <span className="font-medium text-[#434E54]">{state.selectedCustomer?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Phone:</span>
              <span className="font-medium text-[#434E54]">{state.selectedCustomer?.phone}</span>
            </div>
          </div>
        </div>

        {/* Pet Info */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <Dog className="w-5 h-5 text-[#434E54]" />
            </div>
            <h4 className="font-semibold text-[#434E54]">Pet Information</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Name:</span>
              <span className="font-medium text-[#434E54]">
                {state.selectedPet?.name}
                {state.selectedPet?.isNew && (
                  <span className="ml-2 badge badge-sm bg-[#434E54] text-white">New</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Breed:</span>
              <span className="font-medium text-[#434E54]">{state.selectedPet?.breed_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Size:</span>
              <span className="font-medium text-[#434E54]">
                {state.selectedPet && getSizeLabel(state.selectedPet.size)}
              </span>
            </div>
            {state.selectedPet && state.selectedPet.weight > 0 && (
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Weight:</span>
                <span className="font-medium text-[#434E54]">{state.selectedPet.weight} lbs</span>
              </div>
            )}
          </div>
        </div>

        {/* Service Info */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <Scissors className="w-5 h-5 text-[#434E54]" />
            </div>
            <h4 className="font-semibold text-[#434E54]">Service Details</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Service:</span>
              <span className="font-medium text-[#434E54]">{state.selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Price:</span>
              <span className="font-medium text-[#434E54]">
                {state.selectedService && formatCurrency(state.selectedService.price)}
              </span>
            </div>
            {state.selectedAddons.length > 0 && (
              <>
                <div className="divider my-2"></div>
                <div className="text-sm font-semibold text-[#434E54] mb-2">Add-ons:</div>
                {state.selectedAddons.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">{addon.name}</span>
                    <span className="font-medium text-[#434E54]">
                      {formatCurrency(addon.price)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Date & Time Info */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <Calendar className="w-5 h-5 text-[#434E54]" />
            </div>
            <h4 className="font-semibold text-[#434E54]">Appointment Schedule</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Date:</span>
              <span className="font-medium text-[#434E54]">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Time:</span>
              <span className="font-medium text-[#434E54]">
                <Clock className="w-4 h-4 inline mr-1" />
                {state.selectedDateTime?.time}
              </span>
            </div>
            {state.notes && (
              <>
                <div className="divider my-2"></div>
                <div>
                  <span className="text-[#6B7280] block mb-1">Notes:</span>
                  <p className="text-sm text-[#434E54] bg-[#FFFBF7] p-3 rounded-lg">
                    {state.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <DollarSign className="w-5 h-5 text-[#434E54]" />
            </div>
            <h4 className="font-semibold text-[#434E54]">Payment Information</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Price:</span>
              <span className="font-bold text-lg text-[#434E54]">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Payment Status:</span>
              <span className="font-medium text-[#434E54] capitalize">
                {state.paymentStatus.replace('_', ' ')}
              </span>
            </div>
            {state.paymentDetails && (
              <>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Amount Paid:</span>
                  <span className="font-medium text-[#434E54]">
                    {formatCurrency(state.paymentDetails.amount_paid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Payment Method:</span>
                  <span className="font-medium text-[#434E54] capitalize">
                    {state.paymentDetails.payment_method}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
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
              Creating Appointment...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Create Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );
}
