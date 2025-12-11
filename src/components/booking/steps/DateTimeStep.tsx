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
  const { slots, isLoading: slotsLoading, error } = useAvailability({
    date: selectedDate,
    serviceId: selectedService?.id || null,
  });

  // TODO: In future, fetch business hours from settings
  // For now, using default business hours
  const businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS;

  // Calculate disabled dates
  const disabledDates = useMemo(() => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 2);
    return getDisabledDates(today, maxDate, businessHours);
  }, [businessHours]);

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
          <p className="text-[#6B7280]">Choose when you&apos;d like to bring your pet in</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#EF4444]"
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
          <p className="text-[#6B7280] mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#363F44] transition-colors duration-200"
          >
            Retry
          </button>
        </div>

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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select Date & Time</h2>
        <p className="text-[#6B7280]">Choose when you&apos;d like to bring your pet in</p>
      </div>

      {/* Selected datetime banner */}
      {selectedDate && selectedTimeSlot && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary"
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
                <p className="font-medium text-base-content">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-primary font-medium">
                  {formatTimeDisplay(selectedTimeSlot)}
                </p>
              </div>
            </div>
            <button onClick={clearDateTime} className="btn btn-ghost btn-sm">
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
          />
        </div>

        {/* Time slots */}
        <div>
          {!selectedDate ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#6B7280]"
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
              <p className="text-[#6B7280]">Select a date to see available times</p>
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
          onClick={handleContinue}
          disabled={!canContinue}
          className="btn btn-primary btn-lg"
        >
          Continue
          <svg
            className="w-5 h-5 ml-2"
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
