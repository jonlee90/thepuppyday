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

  // Generate Google Calendar link
  const generateGoogleCalendarLink = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedService) return '#';

    const startDateTime = new Date(`${selectedDate}T${selectedTimeSlot}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (selectedService.duration_minutes || 60) * 60000);

    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Dog Grooming - ${selectedService.name} for ${petName}`,
      dates: `${formatDateTime(startDateTime)}/${formatDateTime(endDateTime)}`,
      details: `Service: ${selectedService.name}\nPet: ${petName}\nLocation: 14936 Leffingwell Rd, La Mirada, CA 90638\nConfirmation: ${referenceNumber}`,
      location: '14936 Leffingwell Rd, La Mirada, CA 90638',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success animation with dog theme */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-8 relative"
      >
        {/* Subtle celebration paw prints */}
        <div className="absolute -top-4 left-1/4 opacity-[0.06]">
          <svg className="w-12 h-12 text-[#6BCB77]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>
        <div className="absolute -top-2 right-1/4 opacity-[0.06]">
          <svg className="w-10 h-10 text-[#6BCB77]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="w-24 h-24 bg-[#6BCB77]/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-12 h-12 text-[#6BCB77]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        </div>
        <h2 className="text-3xl font-bold text-[#434E54] mb-2">Booking Confirmed!</h2>
        <p className="text-[#6B7280]">
          Your pup's spa day is all set! We've sent a confirmation to your email
        </p>
      </motion.div>

      {/* Reference number */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#434E54]/10 border border-[#434E54]/30 rounded-xl p-6 text-center mb-6"
      >
        <p className="text-sm text-[#6B7280] mb-1">Confirmation Number</p>
        <p className="text-2xl font-mono font-bold text-[#434E54]">{referenceNumber}</p>
      </motion.div>

      {/* Booking details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6"
      >
        <div className="p-4 bg-[#FFFBF7] border-b border-gray-200">
          <h3 className="font-semibold text-[#434E54]">Appointment Details</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EAE0D5] rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#434E54]"
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
              <p className="font-medium text-[#434E54]">
                {selectedDate &&
                  new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
              </p>
              <p className="text-sm text-[#6B7280]">
                {selectedTimeSlot && formatTimeDisplay(selectedTimeSlot)}
              </p>
            </div>
          </div>

          {/* Service */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EAE0D5] rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#434E54]"
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
              <p className="font-medium text-[#434E54]">{selectedService?.name}</p>
              <p className="text-sm text-[#6B7280]">
                {formatDuration(selectedService?.duration_minutes || 0)}
              </p>
            </div>
          </div>

          {/* Pet */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EAE0D5] rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#434E54]"
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
              <p className="font-medium text-[#434E54]">{petName}</p>
              <p className="text-sm text-[#6B7280]">
                {petSize && getSizeShortLabel(petSize)}
              </p>
            </div>
          </div>

          {/* Add-ons */}
          {selectedAddons.length > 0 && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#EAE0D5] rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-[#434E54]"
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
                <p className="font-medium text-[#434E54]">Add-ons</p>
                <ul className="text-sm text-[#6B7280]">
                  {selectedAddons.map((addon) => (
                    <li key={addon.id}>{addon.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-[#434E54]">Total Due</span>
              <span className="text-2xl font-bold text-[#434E54]">{formatCurrency(totalPrice)}</span>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Payment collected at checkout</p>
          </div>
        </div>
      </motion.div>

      {/* What's next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <h3 className="font-semibold text-[#434E54] mb-4">What&apos;s Next?</h3>
        <ul className="space-y-3 text-sm text-[#6B7280]">
          <li className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[#6BCB77] flex-shrink-0 mt-0.5"
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
              className="w-5 h-5 text-[#6BCB77] flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>We&apos;ll send a reminder 24 hours before your pup&apos;s appointment</span>
          </li>
          <li className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[#6BCB77] flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Arrive 5 minutes early so we can start pampering your furry friend on time</span>
          </li>
        </ul>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        {/* Add to Calendar */}
        <a
          href={generateGoogleCalendarLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-white border-2 border-[#434E54] text-[#434E54] font-semibold py-3 px-8 rounded-lg text-center
                   hover:bg-[#434E54] hover:text-white transition-all duration-200 shadow-md hover:shadow-lg
                   flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Add to Google Calendar
        </a>

        <div className="flex flex-col sm:flex-row gap-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard/appointments"
              className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg text-center
                       hover:bg-[#363F44] transition-all duration-200 shadow-md hover:shadow-lg
                       flex-1 flex items-center justify-center gap-2"
            >
              View My Appointments
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/register"
              className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg text-center
                       hover:bg-[#363F44] transition-all duration-200 shadow-md hover:shadow-lg
                       flex-1 flex items-center justify-center gap-2"
            >
              Create Account
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}
          <Link
            href="/"
            onClick={reset}
            className="text-[#434E54] font-medium py-3 px-8 rounded-lg text-center
                     hover:bg-[#EAE0D5] transition-colors duration-200
                     flex-1 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </motion.div>

      {/* Guest account prompt */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-[#6B7280]"
        >
          <p className="mb-2">
            Create an account to track your appointments, manage your pets, and book faster next time!
          </p>
          <p className="text-xs text-[#6B7280]">
            Location: 14936 Leffingwell Rd, La Mirada, CA 90638 | Phone: (657) 252-2903
          </p>
        </motion.div>
      )}
    </div>
  );
}
