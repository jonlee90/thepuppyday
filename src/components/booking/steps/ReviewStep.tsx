/**
 * Review step for booking wizard
 */

'use client';

import { useState } from 'react';
import { useBookingStore, type GuestInfo } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { useBooking } from '@/hooks/useBooking';
import { GuestInfoForm } from '../GuestInfoForm';
import { AddonCard } from '../AddonCard';
import { useAddons } from '@/hooks/useAddons';
import { formatCurrency, formatDuration, getSizeShortLabel } from '@/lib/booking/pricing';
import { formatTimeDisplay } from '@/lib/booking/availability';
import type { Addon } from '@/types/database';

interface ReviewStepProps {
  onComplete?: () => Promise<void>;
  adminMode?: boolean;
  customerId?: string | null;
}

export function ReviewStep({ onComplete, adminMode = false, customerId }: ReviewStepProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestFormSubmitted, setGuestFormSubmitted] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { isAuthenticated, user } = useAuthStore();
  const { createBooking } = useBooking();
  const {
    selectedService,
    selectedPet,
    newPetData,
    petSize,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    selectedAddonIds,
    toggleAddon,
    servicePrice,
    addonsTotal,
    totalPrice,
    guestInfo,
    setGuestInfo,
    setStep,
    nextStep,
    prevStep,
    setBookingResult,
  } = useBookingStore();

  // Fetch add-ons for selection
  const { addons, isLoading: isLoadingAddons, getUpsellAddons } = useAddons();

  const handleGuestInfoSubmit = (info: GuestInfo) => {
    setGuestInfo(info);
    setGuestFormSubmitted(true);
  };

  const handleConfirm = async () => {
    // For guests (not admin mode), trigger form submission if not yet submitted
    if (!adminMode && !isAuthenticated && !guestInfo) {
      // Submit the form programmatically
      const form = document.getElementById('guest-info-form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
        return;
      }
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      // Admin mode uses different API endpoint
      if (adminMode && customerId) {
        const result = await createAdminBooking();
        if (result.success) {
          if (onComplete) {
            await onComplete();
          } else {
            nextStep();
          }
        } else {
          console.error('Admin booking failed:', result.error);
          setBookingError(result.error || 'Failed to create booking. Please try again.');
        }
      } else {
        // Regular customer booking
        const result = await createBooking();
        if (result.success) {
          if (onComplete) {
            await onComplete();
          } else {
            nextStep();
          }
        } else {
          console.error('Booking failed:', result.error);
          setBookingError(result.error || 'Failed to create booking. Please try again.');
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin booking creation (calls /api/admin/appointments)
  const createAdminBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot || !customerId) {
      return { success: false, error: 'Missing required booking information' };
    }

    // Get pet data
    const pet = selectedPet || newPetData;
    if (!pet) {
      return { success: false, error: 'Pet information required' };
    }

    try {
      // Get customer info from the booking store's guest info (set by CustomerSelectionStep)
      // Note: In admin mode, guestInfo is repurposed to store the selected customer's info
      const customerInfo = guestInfo || {
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      };

      const payload = {
        customer: {
          id: customerId,
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
        appointment_date: selectedDate,
        appointment_time: selectedTimeSlot,
        payment_status: 'pending' as const,
        send_notification: false, // Don't send notifications for manually created appointments
      };

      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create appointment' }));
        return { success: false, error: errorData.error || 'Failed to create appointment' };
      }

      const data = await response.json();
      setBookingResult(data.appointment_id, data.appointment_id);

      return { success: true, appointmentId: data.appointment_id };
    } catch (error) {
      console.error('Admin booking creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const petName = selectedPet?.name || newPetData?.name || 'Your pet';

  // Get pet breed for upsell matching
  const petBreedId = selectedPet?.breed_id || null;

  // Separate upsell add-ons (matching pet's breed)
  const upsellAddons = getUpsellAddons(petBreedId);
  const regularAddons = addons.filter((addon) => {
    if (!petBreedId) return true;
    return !upsellAddons.some((upsell) => upsell.id === addon.id);
  });

  const handleToggleAddon = (addon: Addon) => {
    toggleAddon(addon);
  };

  // For guests: check if the form has valid data (even if not submitted yet)
  // Button should always be enabled - clicking it will trigger form validation if needed
  const canConfirm = true;

  // Debug logging
  console.log('[ReviewStep] State:', {
    isAuthenticated,
    hasGuestInfo: guestInfo !== null,
    canConfirm,
    isSubmitting,
    user: user ? { email: user.email } : null,
    guestInfo: guestInfo ? { email: guestInfo.email } : null
  });

  return (
    <div className="space-y-6">
      {/* Subtitle */}
      <p className="text-[#434E54]/70 leading-relaxed">Double-check everything looks perfect for your pup&apos;s visit</p>

      {/* Booking summary */}
      <div className="bg-white rounded-xl border border-[#434E54]/20 overflow-hidden">
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
            <button
              onClick={() => setStep(0)}
              className="text-[#434E54] font-medium py-1 px-2 rounded text-xs
                       hover:bg-[#EAE0D5] transition-colors duration-200"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Date & Time */}
        <div className="p-4 border-b border-[#434E54]/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#434E54]/70">Date & Time</p>
              <p className="font-semibold text-[#434E54]">
                {selectedDate &&
                  new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </p>
              <p className="text-sm text-[#434E54]/70">
                {selectedTimeSlot && formatTimeDisplay(selectedTimeSlot)}
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-[#434E54] font-medium py-1 px-2 rounded text-xs
                       hover:bg-[#EAE0D5] transition-colors duration-200"
            >
              Edit
            </button>
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
            <button
              onClick={() => setStep(3)}
              className="text-[#434E54] font-medium py-1 px-2 rounded text-xs
                       hover:bg-[#EAE0D5] transition-colors duration-200"
            >
              Edit
            </button>
          </div>
        </div>

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

      {/* Add-ons Selection */}
      {!isLoadingAddons && addons.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-[#434E54] text-lg">Add Extra Services</h3>
          <p className="text-[#434E54]/70 text-sm">Enhance your pet&apos;s grooming experience with these optional add-ons</p>

          {/* Upsell add-ons */}
          {upsellAddons.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#434E54] flex items-center gap-2 bg-[#434E54]/5 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                Recommended for your pet
              </h4>
              <div className="space-y-3">
                {upsellAddons.map((addon) => (
                  <AddonCard
                    key={addon.id}
                    addon={addon}
                    isSelected={selectedAddonIds.includes(addon.id)}
                    isUpsell
                    onToggle={() => handleToggleAddon(addon)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular add-ons */}
          {regularAddons.length > 0 && (
            <div className="space-y-3">
              {upsellAddons.length > 0 && (
                <h4 className="text-sm font-medium text-[#434E54]/60">Other add-ons</h4>
              )}
              <div className="space-y-3">
                {regularAddons.map((addon) => (
                  <AddonCard
                    key={addon.id}
                    addon={addon}
                    isSelected={selectedAddonIds.includes(addon.id)}
                    onToggle={() => handleToggleAddon(addon)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guest info form */}
      {!isAuthenticated && (
        <div className="bg-white rounded-xl border border-[#434E54]/20 p-6">
          <h3 className="font-semibold text-[#434E54] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Your Information
          </h3>

          {guestInfo ? (
            <div className="space-y-2">
              <p className="text-[#434E54]">
                <span className="font-medium">{guestInfo.firstName} {guestInfo.lastName}</span>
              </p>
              <p className="text-sm text-[#434E54]/70">{guestInfo.email}</p>
              <p className="text-sm text-[#434E54]/70">{guestInfo.phone}</p>
              <button
                onClick={() => {
                  setGuestInfo(null as unknown as GuestInfo);
                  setGuestFormSubmitted(false);
                }}
                className="text-[#434E54] font-medium py-1.5 px-3 rounded-lg text-sm mt-2
                         hover:bg-[#EAE0D5] transition-colors duration-200"
              >
                Edit
              </button>
            </div>
          ) : (
            <GuestInfoForm onSubmit={handleGuestInfoSubmit} initialData={guestInfo || undefined} />
          )}
        </div>
      )}

      {/* Authenticated user info */}
      {isAuthenticated && user && (
        <div className="bg-white rounded-xl border border-[#434E54]/20 p-6">
          <h3 className="font-semibold text-[#434E54] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Your Information
          </h3>
          <div className="space-y-2">
            <p className="text-[#434E54]">
              <span className="font-medium">{user.first_name} {user.last_name}</span>
            </p>
            <p className="text-sm text-[#434E54]/70">{user.email}</p>
            {user.phone && <p className="text-sm text-[#434E54]/70">{user.phone}</p>}
          </div>
        </div>
      )}

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
          disabled={!canConfirm || isSubmitting}
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
              Confirm Booking
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
