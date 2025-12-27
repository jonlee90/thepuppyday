/**
 * Walk-In Review Step - Combined Addons + Review
 * Shows add-ons selection and booking summary in one step
 */

'use client';

import { useState } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatDuration, getSizeShortLabel } from '@/lib/booking/pricing';
import { Scissors, Check } from 'lucide-react';

interface WalkinReviewStepProps {
  onComplete?: () => Promise<void>;
  customerId?: string | null;
}

export function WalkinReviewStep({ onComplete, customerId }: WalkinReviewStepProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const {
    selectedService,
    selectedPet,
    newPetData,
    petSize,
    selectedAddons,
    servicePrice,
    addonsTotal,
    totalPrice,
    guestInfo,
    availableAddons,
    toggleAddon,
    nextStep,
    prevStep,
    setBookingResult,
  } = useBookingStore();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setBookingError(null);

    try {
      const result = await createWalkinBooking();
      if (result.success) {
        if (onComplete) {
          await onComplete();
        } else {
          nextStep();
        }
      } else {
        console.error('Walk-in booking failed:', result.error);
        setBookingError(result.error || 'Failed to create walk-in appointment. Please try again.');
      }
    } catch (error) {
      console.error('Walk-in booking error:', error);
      setBookingError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Walk-in booking creation (calls /api/admin/appointments with walk-in specific settings)
  const createWalkinBooking = async () => {
    if (!selectedService || !customerId) {
      return { success: false, error: 'Missing required booking information' };
    }

    // Get pet data
    const pet = selectedPet || newPetData;
    if (!pet) {
      return { success: false, error: 'Pet information required' };
    }

    try {
      // Get customer info from the booking store's guest info (set by CustomerSelectionStep)
      const customerInfo = guestInfo || {
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      };

      // Set appointment to NOW for walk-in
      const now = new Date();
      const appointmentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const appointmentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; // HH:MM

      const payload = {
        customer: {
          id: customerId === 'new' ? undefined : customerId, // Don't send 'new' as UUID
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
        },
        pet: {
          id: selectedPet?.id,
          name: pet.name,
          breed_id: selectedPet?.breed_id || newPetData?.breed_id,
          breed_name: selectedPet?.breed_custom || newPetData?.breed_custom,
          size: petSize || pet.size,
          weight: selectedPet?.weight || newPetData?.weight,
        },
        service_id: selectedService.id,
        addon_ids: selectedAddons.map(addon => addon.id),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        payment_status: 'pending' as const,
        send_notification: false, // Don't send notifications for walk-ins
        source: 'walk_in' as const, // Mark as walk-in appointment
      };

      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create walk-in appointment' }));
        return { success: false, error: errorData.error || 'Failed to create walk-in appointment' };
      }

      const data = await response.json();
      setBookingResult(data.appointment_id, data.appointment_id);

      return { success: true, appointmentId: data.appointment_id };
    } catch (error) {
      console.error('Walk-in booking creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const petName = selectedPet?.name || newPetData?.name || 'Your pet';

  return (
    <div className="space-y-6">
      {/* Subtitle */}
      <p className="text-[#434E54]/70 leading-relaxed">
        Add any extras and review the walk-in appointment details
      </p>

      {/* Add-ons Section */}
      {availableAddons && availableAddons.length > 0 && (
        <div className="bg-white rounded-xl border border-[#434E54]/20 overflow-hidden">
          <div className="p-5 border-b border-[#434E54]/10">
            <h3 className="text-lg font-semibold text-[#434E54] flex items-center gap-2">
              <Scissors className="w-5 h-5 text-[#434E54]" />
              Recommended for your pet
            </h3>
            <p className="text-sm text-[#434E54]/70 mt-1">
              Optional services to pamper {petName}
            </p>
          </div>

          <div className="divide-y divide-[#434E54]/10">
            {availableAddons.map((addon) => {
              const isSelected = selectedAddons.some((a) => a.id === addon.id);

              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon)}
                  className="w-full p-5 flex items-center gap-4 hover:bg-[#EAE0D5]/30 transition-colors duration-200 text-left"
                >
                  {/* Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#434E54] border-[#434E54]'
                        : 'border-[#434E54]/30 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#434E54]">{addon.name}</p>
                    {addon.description && (
                      <p className="text-sm text-[#434E54]/70 mt-1">{addon.description}</p>
                    )}
                    {addon.duration_minutes && (
                      <p className="text-xs text-[#434E54]/60 mt-1">
                        +{formatDuration(addon.duration_minutes)}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-[#434E54]">
                      +{formatCurrency(addon.price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Summary */}
      <div className="bg-white rounded-xl border border-[#434E54]/20 overflow-hidden">
        <div className="p-5 border-b border-[#434E54]/10">
          <h3 className="text-lg font-semibold text-[#434E54]">Walk-In Summary</h3>
        </div>

        {/* Service */}
        <div className="p-4 border-b border-[#434E54]/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#434E54]/70">Service</p>
              <p className="font-semibold text-[#434E54]">{selectedService?.name}</p>
              <p className="text-sm text-[#434E54]/70">
                {formatDuration(selectedService?.duration_minutes || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Pet */}
        <div className="p-4 border-b border-[#434E54]/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#434E54]/70">Pet</p>
              <p className="font-semibold text-[#434E54]">{petName}</p>
              <p className="text-sm text-[#434E54]/70">
                {petSize ? getSizeShortLabel(petSize) : ''}
                {(selectedPet?.breed_custom || selectedPet?.breed?.name || newPetData?.breed_custom) && (
                  <> • {selectedPet?.breed_custom || selectedPet?.breed?.name || newPetData?.breed_custom}</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="p-4 border-b border-[#434E54]/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#434E54]/70">Customer</p>
              <p className="font-semibold text-[#434E54]">
                {guestInfo?.firstName} {guestInfo?.lastName}
              </p>
              {guestInfo?.phone && (
                <p className="text-sm text-[#434E54]/70">{guestInfo.phone}</p>
              )}
              {guestInfo?.email && (
                <p className="text-sm text-[#434E54]/70">{guestInfo.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="p-4 border-b border-[#434E54]/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#434E54]/70">Appointment Time</p>
              <p className="font-semibold text-[#434E54]">Now (Walk-In)</p>
              <p className="text-sm text-[#434E54]/70">
                {new Date().toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Add-ons */}
        {selectedAddons.length > 0 && (
          <div className="p-4 border-b border-[#434E54]/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#434E54]/70">Add-ons</p>
                <ul className="mt-1 space-y-1">
                  {selectedAddons.map((addon) => (
                    <li key={addon.id} className="text-sm text-[#434E54]">
                      {addon.name} <span className="text-[#434E54]/70">+{formatCurrency(addon.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="p-4 bg-[#FFFBF7]">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#434E54]/70">{selectedService?.name}</span>
              <span className="text-[#434E54]">{formatCurrency(servicePrice)}</span>
            </div>
            {selectedAddons.map((addon) => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span className="text-[#434E54]/70">{addon.name}</span>
                <span className="text-[#434E54]">{formatCurrency(addon.price)}</span>
              </div>
            ))}
            <div className="border-t border-[#434E54]/20 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-[#434E54]">Total</span>
                <span className="text-xl font-bold text-[#434E54]">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {bookingError && (
        <div className="bg-[#434E54]/10 border border-[#434E54]/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-[#434E54] flex-shrink-0 mt-0.5">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[#434E54] mb-1">Booking Error</h4>
              <p className="text-sm text-[#434E54]">{bookingError}</p>
            </div>
            <button
              onClick={() => setBookingError(null)}
              className="text-[#434E54] hover:text-[#434E54]/80 p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={prevStep}
          className="text-[#434E54] font-medium py-2.5 px-5 rounded-lg
                   hover:bg-[#EAE0D5] transition-colors duration-200
                   flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg
                   hover:bg-[#434E54]/90 transition-all duration-200 shadow-md hover:shadow-lg
                   disabled:bg-[#434E54]/40 disabled:cursor-not-allowed disabled:opacity-50
                   flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Confirm Walk-In
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
