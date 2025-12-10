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

    try {
      const result = await createBooking();

      if (result.success) {
        nextStep();
      } else {
        console.error('Booking failed:', result.error);
        // Could show an error toast here
      }
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const petName = selectedPet?.name || newPetData?.name || 'Your pet';
  const canConfirm = isAuthenticated || guestInfo !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-base-content mb-2">Review Your Booking</h2>
        <p className="text-base-content/70">Please confirm all details are correct</p>
      </div>

      {/* Booking summary */}
      <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
        {/* Service */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-base-content/60">Service</p>
              <p className="font-semibold text-base-content">{selectedService?.name}</p>
              <p className="text-sm text-base-content/70">
                {formatDuration(selectedService?.duration_minutes || 0)}
              </p>
            </div>
            <button
              onClick={() => setStep(0)}
              className="btn btn-ghost btn-xs"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Pet */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-base-content/60">Pet</p>
              <p className="font-semibold text-base-content">{petName}</p>
              <p className="text-sm text-base-content/70">
                {petSize ? getSizeShortLabel(petSize) : ''}
                {(selectedPet?.breed_custom || selectedPet?.breed?.name || newPetData?.breed_custom) && (
                  <> • {selectedPet?.breed_custom || selectedPet?.breed?.name || newPetData?.breed_custom}</>
                )}
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="btn btn-ghost btn-xs"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Date & Time */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-base-content/60">Date & Time</p>
              <p className="font-semibold text-base-content">
                {selectedDate &&
                  new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </p>
              <p className="text-sm text-base-content/70">
                {selectedTimeSlot && formatTimeDisplay(selectedTimeSlot)}
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="btn btn-ghost btn-xs"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Add-ons */}
        {selectedAddons.length > 0 && (
          <div className="p-4 border-b border-base-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-base-content/60">Add-ons</p>
                <ul className="mt-1 space-y-1">
                  {selectedAddons.map((addon) => (
                    <li key={addon.id} className="text-sm text-base-content">
                      {addon.name} <span className="text-base-content/60">+{formatCurrency(addon.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setStep(3)}
                className="btn btn-ghost btn-xs"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="p-4 bg-base-200">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">{selectedService?.name}</span>
              <span className="text-base-content">{formatCurrency(servicePrice)}</span>
            </div>
            {selectedAddons.map((addon) => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span className="text-base-content/70">{addon.name}</span>
                <span className="text-base-content">{formatCurrency(addon.price)}</span>
              </div>
            ))}
            <div className="border-t border-base-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-base-content">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest info form */}
      {!isAuthenticated && (
        <div className="bg-base-100 rounded-xl border border-base-300 p-6">
          <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <p className="text-base-content">
                <span className="font-medium">{guestInfo.firstName} {guestInfo.lastName}</span>
              </p>
              <p className="text-sm text-base-content/70">{guestInfo.email}</p>
              <p className="text-sm text-base-content/70">{guestInfo.phone}</p>
              <button
                onClick={() => {
                  setGuestInfo(null as unknown as GuestInfo);
                  setGuestFormSubmitted(false);
                }}
                className="btn btn-ghost btn-sm mt-2"
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
        <div className="bg-base-100 rounded-xl border border-base-300 p-6">
          <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <p className="text-base-content">
              <span className="font-medium">{user.first_name} {user.last_name}</span>
            </p>
            <p className="text-sm text-base-content/70">{user.email}</p>
            {user.phone && <p className="text-sm text-base-content/70">{user.phone}</p>}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="btn btn-ghost">
          <svg
            className="w-5 h-5 mr-2"
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
          className="btn btn-primary btn-lg"
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Confirming...
            </>
          ) : (
            <>
              Confirm Booking
              <svg
                className="w-5 h-5 ml-2"
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
