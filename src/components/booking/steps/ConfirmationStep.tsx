/**
 * Confirmation step for booking wizard
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatDuration, getSizeShortLabel } from '@/lib/booking/pricing';
import { formatTimeDisplay } from '@/lib/booking/availability';

export function ConfirmationStep() {
  const { isAuthenticated } = useAuthStore();
  const {
    selectedService,
    selectedPet,
    newPetData,
    petSize,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    totalPrice,
    guestInfo,
    bookingReference,
    reset,
  } = useBookingStore();

  const petName = selectedPet?.name || newPetData?.name || 'Your pet';

  // Generate a reference number if not set (using useMemo to avoid impure function call)
  const referenceNumber = bookingReference || `TPD-PENDING`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-8"
      >
        <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-12 h-12 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        </div>
        <h2 className="text-3xl font-bold text-base-content mb-2">Booking Confirmed!</h2>
        <p className="text-base-content/70">
          We&apos;ve sent a confirmation to your email
        </p>
      </motion.div>

      {/* Reference number */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center mb-6"
      >
        <p className="text-sm text-base-content/70 mb-1">Confirmation Number</p>
        <p className="text-2xl font-mono font-bold text-primary">{referenceNumber}</p>
      </motion.div>

      {/* Booking details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-base-100 rounded-xl border border-base-300 overflow-hidden mb-6"
      >
        <div className="p-4 bg-base-200 border-b border-base-300">
          <h3 className="font-semibold text-base-content">Appointment Details</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-base-content">
                {selectedDate &&
                  new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
              </p>
              <p className="text-sm text-base-content/70">
                {selectedTimeSlot && formatTimeDisplay(selectedTimeSlot)}
              </p>
            </div>
          </div>

          {/* Service */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-base-content">{selectedService?.name}</p>
              <p className="text-sm text-base-content/70">
                {formatDuration(selectedService?.duration_minutes || 0)}
              </p>
            </div>
          </div>

          {/* Pet */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-base-content">{petName}</p>
              <p className="text-sm text-base-content/70">
                {petSize && getSizeShortLabel(petSize)}
              </p>
            </div>
          </div>

          {/* Add-ons */}
          {selectedAddons.length > 0 && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-base-content">Add-ons</p>
                <ul className="text-sm text-base-content/70">
                  {selectedAddons.map((addon) => (
                    <li key={addon.id}>{addon.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-base-300 pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-base-content">Total Due</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
            </div>
            <p className="text-xs text-base-content/50 mt-1">Payment collected at checkout</p>
          </div>
        </div>
      </motion.div>

      {/* What's next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-base-100 rounded-xl border border-base-300 p-6 mb-6"
      >
        <h3 className="font-semibold text-base-content mb-4">What&apos;s Next?</h3>
        <ul className="space-y-3 text-sm text-base-content/70">
          <li className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>You&apos;ll receive a confirmation email with all the details</span>
          </li>
          <li className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>We&apos;ll send a reminder 24 hours before your appointment</span>
          </li>
          <li className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Arrive 5 minutes early so we can get started on time</span>
          </li>
        </ul>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {isAuthenticated ? (
          <Link href="/dashboard/appointments" className="btn btn-primary flex-1">
            View My Appointments
          </Link>
        ) : (
          <Link href="/register" className="btn btn-primary flex-1">
            Create Account
          </Link>
        )}
        <Link href="/" onClick={reset} className="btn btn-ghost flex-1">
          Back to Home
        </Link>
      </motion.div>

      {/* Guest account prompt */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-base-content/60"
        >
          <p>
            Create an account to track your appointments, manage your pets, and earn rewards!
          </p>
        </motion.div>
      )}
    </div>
  );
}
