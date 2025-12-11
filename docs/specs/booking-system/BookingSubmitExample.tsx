/**
 * Example component showing useBookingSubmit integration
 * This is a reference implementation for the booking review/submit step
 */

'use client';

import { useRouter } from 'next/navigation';
import { useBookingSubmit } from '@/hooks';
import { useBookingStore, usePriceSummary } from '@/stores/bookingStore';

export function BookingReviewStep() {
  const router = useRouter();
  const { submit, isSubmitting, error, clearError } = useBookingSubmit();

  const {
    selectedService,
    selectedPet,
    newPetData,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    guestInfo,
  } = useBookingStore();

  const { servicePrice, addonsTotal, totalPrice } = usePriceSummary();

  const handleSubmit = async () => {
    try {
      const result = await submit();
      // Navigate to confirmation page with reference
      router.push(`/booking/confirmation?ref=${result.reference}`);
    } catch (err) {
      // Error is already stored in hook state and displayed below
      console.error('Booking submission failed:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Review Your Booking</h2>

      {/* Error Display */}
      {error && (
        <div role="alert" className="alert alert-error mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">
              {error.type === 'SLOT_CONFLICT' && 'Time Slot Unavailable'}
              {error.type === 'VALIDATION' && 'Validation Error'}
              {error.type === 'NETWORK' && 'Connection Error'}
              {error.type === 'UNKNOWN' && 'Booking Error'}
            </h3>
            <div className="text-sm">{error.message}</div>
          </div>
          <button
            onClick={clearError}
            className="btn btn-sm btn-ghost"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Booking Summary Card */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          {/* Service */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Service</h3>
            <p className="text-gray-700">{selectedService?.name}</p>
            <p className="text-sm text-gray-500">{selectedService?.description}</p>
          </div>

          {/* Pet */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Pet</h3>
            <p className="text-gray-700">
              {selectedPet?.name || newPetData?.name}
            </p>
            <p className="text-sm text-gray-500">
              Size: {selectedPet?.size || newPetData?.size}
            </p>
          </div>

          {/* Date & Time */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Date & Time</h3>
            <p className="text-gray-700">
              {new Date(selectedDate || '').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-gray-500">{selectedTimeSlot}</p>
          </div>

          {/* Add-ons */}
          {selectedAddons.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">Add-ons</h3>
              <ul className="list-disc list-inside">
                {selectedAddons.map((addon) => (
                  <li key={addon.id} className="text-gray-700">
                    {addon.name} - ${addon.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          {guestInfo && (
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">Contact Information</h3>
              <p className="text-gray-700">
                {guestInfo.firstName} {guestInfo.lastName}
              </p>
              <p className="text-sm text-gray-500">{guestInfo.email}</p>
              <p className="text-sm text-gray-500">{guestInfo.phone}</p>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="divider"></div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Service Price</span>
              <span className="font-semibold">${servicePrice.toFixed(2)}</span>
            </div>
            {addonsTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Add-ons</span>
                <span className="font-semibold">${addonsTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="divider my-2"></div>
            <div className="flex justify-between text-lg">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="btn btn-outline flex-1"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn btn-primary flex-1"
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner"></span>
              Processing...
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </div>

      {/* Terms & Conditions */}
      <div className="mt-6 text-center text-sm text-gray-500">
        By confirming, you agree to our{' '}
        <a href="/terms" className="link link-primary">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="link link-primary">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}

/**
 * Alternative implementation with retry logic
 */
export function BookingReviewStepWithRetry() {
  const router = useRouter();
  const { submit, isSubmitting, error, clearError } = useBookingSubmit();

  const handleSubmit = async () => {
    clearError(); // Clear any previous errors
    try {
      const result = await submit();
      router.push(`/booking/confirmation?ref=${result.reference}`);
    } catch (err) {
      // Error is displayed automatically via the error state
    }
  };

  const handleRetry = () => {
    clearError();
    handleSubmit();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* ... same content as above ... */}

      {/* Error with Retry */}
      {error && (
        <div role="alert" className="alert alert-error mb-6">
          <div className="flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Booking Failed</h3>
              <div className="text-sm">{error.message}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {error.type !== 'SLOT_CONFLICT' && (
              <button onClick={handleRetry} className="btn btn-sm">
                Retry
              </button>
            )}
            <button onClick={clearError} className="btn btn-sm btn-ghost">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="btn btn-primary btn-block"
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner"></span>
            Processing...
          </>
        ) : (
          'Confirm Booking'
        )}
      </button>
    </div>
  );
}
