/**
 * Review step for booking wizard
 */

'use client';

import { useState } from 'react';
import { useBookingStore, type GuestInfo } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { useBooking } from '@/hooks/useBooking';
import { GuestInfoForm } from '../GuestInfoForm';
import { formatCurrency, formatDuration, getSizeShortLabel } from '@/lib/booking/pricing';
import { formatTimeDisplay } from '@/lib/booking/availability';

export function ReviewStep() {
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
    servicePrice,
    addonsTotal,
    totalPrice,
    guestInfo,
    setGuestInfo,
    setStep,
    nextStep,
    prevStep,
  } = useBookingStore();

  const handleGuestInfoSubmit = (info: GuestInfo) => {
    setGuestInfo(info);
    setGuestFormSubmitted(true);
  };

  const handleConfirm = async () => {
    // For guests, trigger form submission if not yet submitted
    if (!isAuthenticated && !guestInfo) {
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
      const result = await createBooking();

      if (result.success) {
        nextStep();
      } else {
        console.error('Booking failed:', result.error);
        setBookingError(result.error || 'Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const petName = selectedPet?.name || newPetData?.name || 'Your pet';
  const canConfirm = isAuthenticated || guestInfo !== null;

  return (
    <div className="space-y-6">
      {/* Header with dog theme */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute top-0 left-0 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Review Your Booking</h2>
        </div>
        <p className="text-[#434E54]/70 leading-relaxed">Double-check everything looks perfect for your pup's visit</p>
      </div>

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
              onClick={() => setStep(1)}
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
              onClick={() => setStep(2)}
              className="text-[#434E54] font-medium py-1 px-2 rounded text-xs
                       hover:bg-[#EAE0D5] transition-colors duration-200"
            >
              Edit
            </button>
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
              <button
                onClick={() => setStep(3)}
                className="text-[#434E54] font-medium py-1 px-2 rounded text-xs
                         hover:bg-[#EAE0D5] transition-colors duration-200"
              >
                Edit
              </button>
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
          disabled={!canConfirm && !isAuthenticated || isSubmitting}
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
