/**
 * Date and time selection step for booking wizard
 */

'use client';

import { useState, useMemo } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { CalendarPicker } from '../CalendarPicker';
import { TimeSlotGrid } from '../TimeSlotGrid';
import { WaitlistModal } from '../WaitlistModal';
import { useAvailability } from '@/hooks/useAvailability';
import {
  getDisabledDates,
  formatTimeDisplay,
  DEFAULT_BUSINESS_HOURS,
  type BusinessHours,
} from '@/lib/booking/availability';

export function DateTimeStep() {
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [waitlistTime, setWaitlistTime] = useState<string | undefined>();

  const {
    selectedService,
    selectedDate,
    selectedTimeSlot,
    selectDateTime,
    clearDateTime,
    nextStep,
    prevStep,
  } = useBookingStore();

  // Fetch availability for selected date and service
  const { slots, isLoading: slotsLoading, error, bookingSettings } = useAvailability({
    date: selectedDate,
    serviceId: selectedService?.id || null,
  });

  // Use business hours from booking settings or default
  const businessHours: BusinessHours = bookingSettings?.business_hours || DEFAULT_BUSINESS_HOURS;

  // Calculate disabled dates with booking settings
  const disabledDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to avoid UTC conversion issues
    const maxDate = new Date(today);

    // Use max_advance_days from settings if available
    if (bookingSettings?.max_advance_days) {
      maxDate.setDate(maxDate.getDate() + bookingSettings.max_advance_days);
    } else {
      maxDate.setMonth(maxDate.getMonth() + 2);
    }

    return getDisabledDates(today, maxDate, businessHours, bookingSettings || undefined);
  }, [businessHours, bookingSettings]);

  // Calculate min and max dates for calendar based on booking settings
  const minDate = useMemo(() => {
    if (!bookingSettings?.min_advance_hours) return undefined;
    const now = new Date();
    const minDateTime = new Date(now.getTime() + bookingSettings.min_advance_hours * 60 * 60 * 1000);
    return minDateTime.toISOString().split('T')[0];
  }, [bookingSettings]);

  const maxDate = useMemo(() => {
    if (!bookingSettings?.max_advance_days) return undefined;
    const today = new Date();
    const maxDateTime = new Date(today);
    maxDateTime.setDate(maxDateTime.getDate() + bookingSettings.max_advance_days);
    return maxDateTime.toISOString().split('T')[0];
  }, [bookingSettings]);

  const handleDateSelect = (date: string) => {
    // Clear time when date changes
    if (date !== selectedDate) {
      selectDateTime(date, '');
    }
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      selectDateTime(selectedDate, time);
    }
  };

  const handleJoinWaitlist = (time: string) => {
    setWaitlistTime(time);
    setWaitlistModalOpen(true);
  };

  const handleContinue = () => {
    if (selectedDate && selectedTimeSlot) {
      nextStep();
    }
  };

  const canContinue = selectedDate !== null && selectedTimeSlot !== null;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select Date & Time</h2>
          <p className="text-[#434E54]/70">Choose when you&apos;d like to bring your pet in</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#434E54]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#434E54]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">Failed to Load Availability</h3>
          <p className="text-[#434E54]/70 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#434E54]/90 transition-colors duration-200"
          >
            Retry
          </button>
        </div>

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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with dog theme */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Select Date & Time</h2>
        </div>
        <p className="text-[#434E54]/70 leading-relaxed">Pick a time that works best for you and your pup's schedule</p>
      </div>

      {/* Selected datetime banner */}
      {selectedDate && selectedTimeSlot && (
        <div className="bg-[#434E54]/10 border border-[#434E54]/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#434E54]/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#434E54]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#434E54]">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-[#434E54] font-medium">
                  {formatTimeDisplay(selectedTimeSlot)}
                </p>
              </div>
            </div>
            <button
              onClick={clearDateTime}
              className="text-[#434E54] font-medium py-1.5 px-3 rounded-lg text-sm
                       hover:bg-[#EAE0D5] transition-colors duration-200"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Calendar and time slots */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <CalendarPicker
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            disabledDates={disabledDates}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>

        {/* Time slots */}
        <div>
          {!selectedDate ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#434E54]/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-[#434E54]/70">Select a date to see available times</p>
            </div>
          ) : (
            <TimeSlotGrid
              slots={slots}
              selectedTime={selectedTimeSlot}
              onTimeSelect={handleTimeSelect}
              onJoinWaitlist={handleJoinWaitlist}
              loading={slotsLoading}
            />
          )}
        </div>
      </div>

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
          onClick={handleContinue}
          disabled={!canContinue}
          className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg
                   hover:bg-[#434E54]/90 transition-all duration-200 shadow-md hover:shadow-lg
                   disabled:bg-[#434E54]/40 disabled:cursor-not-allowed disabled:opacity-50
                   flex items-center gap-2"
        >
          Continue
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Waitlist Modal */}
      {selectedDate && (
        <WaitlistModal
          isOpen={waitlistModalOpen}
          onClose={() => {
            setWaitlistModalOpen(false);
            setWaitlistTime(undefined);
          }}
          date={selectedDate}
          time={waitlistTime}
        />
      )}
    </div>
  );
}
