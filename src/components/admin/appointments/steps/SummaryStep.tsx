/**
 * Summary & Confirmation Step
 * Task 0018: Review all selections before submitting
 * Redesigned with mobile-first, touch-friendly UI matching customer booking flow
 */

'use client';

import { useMemo } from 'react';
import { CheckCircle, AlertTriangle, Calendar, Clock, User, Heart, Scissors, DollarSign } from 'lucide-react';
import type { ManualAppointmentState } from '@/types/admin-appointments';
import { formatCurrency, getSizeLabel } from '@/lib/booking/pricing';

interface SummaryStepProps {
  state: ManualAppointmentState;
  onSuccess: () => void;
}

export function SummaryStep({ state }: SummaryStepProps) {
  // Calculate total price
  const totalPrice = useMemo(() => {
    const servicePrice = state.selectedService?.price || 0;
    const addonsTotal = Array.isArray(state.selectedAddons)
      ? state.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
      : 0;
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
  }, [state.selectedDateTime]);

  return (
    <div className="space-y-6">
      {/* Header with icon badge and paw print decoration */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute -top-2 -left-2 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <CheckCircle className="w-5 h-5 text-[#434E54]" />
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Review Appointment</h2>
        </div>
        <p className="text-[#434E54]/70">Please review all details before creating the appointment</p>
      </div>

      {/* Past Date Warning */}
      {state.selectedDateTime?.isPastDate && (
        <div className="alert bg-[#FFB347]/10 border border-[#FFB347] rounded-lg p-4" role="alert">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#434E54]" />
          <span className="font-medium text-[#434E54]">
            Warning: This appointment is scheduled for a past date
          </span>
        </div>
      )}

      {/* Summary Cards - Staggered animation via CSS */}
      <div className="space-y-4">
        {/* Customer Info */}
        <div className="p-6 bg-white rounded-xl border border-[#E5E5E5] shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <User className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="font-semibold text-[#434E54]">Customer Information</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Name:</span>
              <span className="font-medium text-[#434E54] text-right">
                {state.selectedCustomer?.first_name} {state.selectedCustomer?.last_name}
                {state.selectedCustomer?.isNew && (
                  <span className="ml-2 badge badge-sm bg-[#434E54] text-white border-none">New</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Email:</span>
              <span className="font-medium text-[#434E54] text-right break-all">{state.selectedCustomer?.email}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Phone:</span>
              <span className="font-medium text-[#434E54] text-right">{state.selectedCustomer?.phone}</span>
            </div>
          </div>
        </div>

        {/* Pet Info */}
        <div className="p-6 bg-white rounded-xl border border-[#E5E5E5] shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <Heart className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="font-semibold text-[#434E54]">Pet Information</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Name:</span>
              <span className="font-medium text-[#434E54] text-right">
                {state.selectedPet?.name}
                {state.selectedPet?.isNew && (
                  <span className="ml-2 badge badge-sm bg-[#434E54] text-white border-none">New</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Breed:</span>
              <span className="font-medium text-[#434E54] text-right">{state.selectedPet?.breed_name}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Size:</span>
              <span className="font-medium text-[#434E54] text-right">
                {state.selectedPet && getSizeLabel(state.selectedPet.size)}
              </span>
            </div>
            {state.selectedPet && state.selectedPet.weight > 0 && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-[#6B7280]">Weight:</span>
                <span className="font-medium text-[#434E54] text-right">{state.selectedPet.weight} lbs</span>
              </div>
            )}
          </div>
        </div>

        {/* Service Info */}
        <div className="p-6 bg-white rounded-xl border border-[#E5E5E5] shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <Scissors className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="font-semibold text-[#434E54]">Service Details</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Service:</span>
              <span className="font-medium text-[#434E54] text-right">{state.selectedService?.name}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Price:</span>
              <span className="font-medium text-[#434E54] text-right">
                {state.selectedService && formatCurrency(state.selectedService.price)}
              </span>
            </div>
            {Array.isArray(state.selectedAddons) && state.selectedAddons.length > 0 && (
              <>
                <div className="border-t border-[#E5E5E5] my-3"></div>
                <div className="text-sm font-semibold text-[#434E54] mb-2">Add-ons:</div>
                {state.selectedAddons.map((addon) => (
                  <div key={addon.id} className="flex justify-between items-start gap-4 text-sm">
                    <span className="text-[#6B7280]">{addon.name}</span>
                    <span className="font-medium text-[#434E54] text-right">
                      {formatCurrency(addon.price)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Date & Time Info */}
        <div className="p-6 bg-white rounded-xl border border-[#E5E5E5] shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <Calendar className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="font-semibold text-[#434E54]">Appointment Schedule</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Date:</span>
              <span className="font-medium text-[#434E54] text-right">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Time:</span>
              <span className="font-medium text-[#434E54] text-right flex items-center justify-end gap-1">
                <Clock className="w-4 h-4" />
                {state.selectedDateTime?.time}
              </span>
            </div>
            {state.notes && (
              <>
                <div className="border-t border-[#E5E5E5] my-3"></div>
                <div>
                  <span className="text-[#6B7280] block mb-2">Notes:</span>
                  <p className="text-sm text-[#434E54] bg-[#FFFBF7] p-3 rounded-lg leading-relaxed">
                    {state.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="p-6 bg-white rounded-xl border border-[#E5E5E5] shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EAE0D5] rounded-lg">
              <DollarSign className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="font-semibold text-[#434E54]">Payment Information</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Total Price:</span>
              <span className="font-bold text-lg text-[#434E54] text-right">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[#6B7280]">Payment Status:</span>
              <span className="font-medium text-[#434E54] text-right capitalize">
                {state.paymentStatus.replace('_', ' ')}
              </span>
            </div>
            {state.paymentDetails && (
              <>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[#6B7280]">Amount Paid:</span>
                  <span className="font-medium text-[#434E54] text-right">
                    {formatCurrency(state.paymentDetails.amount_paid)}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[#6B7280]">Payment Method:</span>
                  <span className="font-medium text-[#434E54] text-right capitalize">
                    {state.paymentDetails.payment_method}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
