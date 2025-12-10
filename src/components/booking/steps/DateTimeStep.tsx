/**
 * Date and time selection step for booking wizard
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { CalendarPicker } from '../CalendarPicker';
import { TimeSlotGrid } from '../TimeSlotGrid';
import { WaitlistModal } from '../WaitlistModal';
import {
  getAvailableSlots,
  getDisabledDates,
  formatTimeDisplay,
  type BusinessHours,
  type TimeSlot,
} from '@/lib/booking/availability';
import { getMockStore } from '@/mocks/supabase/store';
import type { Appointment, Setting } from '@/types/database';

// Default business hours if not in settings
const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '18:00', is_open: true },
  tuesday: { open: '09:00', close: '18:00', is_open: true },
  wednesday: { open: '09:00', close: '18:00', is_open: true },
  thursday: { open: '09:00', close: '18:00', is_open: true },
  friday: { open: '09:00', close: '18:00', is_open: true },
  saturday: { open: '09:00', close: '16:00', is_open: true },
  sunday: { open: '09:00', close: '16:00', is_open: false },
};

export function DateTimeStep() {
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Load business hours and appointments
  useEffect(() => {
    const loadData = () => {
      const store = getMockStore();

      // Get business hours from settings
      const settings = store.select('settings', {
        column: 'key',
        value: 'business_hours',
      }) as unknown as Setting[];

      if (settings.length > 0 && settings[0].value) {
        const hoursData = settings[0].value as Record<
          string,
          { open: string; close: string } | null
        >;
        const parsed: BusinessHours = {
          monday: hoursData.monday
            ? { ...hoursData.monday, is_open: true }
            : { open: '09:00', close: '18:00', is_open: false },
          tuesday: hoursData.tuesday
            ? { ...hoursData.tuesday, is_open: true }
            : { open: '09:00', close: '18:00', is_open: false },
          wednesday: hoursData.wednesday
            ? { ...hoursData.wednesday, is_open: true }
            : { open: '09:00', close: '18:00', is_open: false },
          thursday: hoursData.thursday
            ? { ...hoursData.thursday, is_open: true }
            : { open: '09:00', close: '18:00', is_open: false },
          friday: hoursData.friday
            ? { ...hoursData.friday, is_open: true }
            : { open: '09:00', close: '18:00', is_open: false },
          saturday: hoursData.saturday
            ? { ...hoursData.saturday, is_open: true }
            : { open: '09:00', close: '16:00', is_open: false },
          sunday: hoursData.sunday
            ? { ...hoursData.sunday, is_open: true }
            : { open: '09:00', close: '16:00', is_open: false },
        };
        setBusinessHours(parsed);
      }

      // Get existing appointments
      const appts = store.select('appointments') as unknown as Appointment[];
      setAppointments(appts);

      setLoading(false);
    };

    loadData();
  }, []);

  // Calculate disabled dates
  const disabledDates = useMemo(() => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 2);
    return getDisabledDates(today, maxDate, businessHours);
  }, [businessHours]);

  // Load time slots when date changes
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setSlots([]);
      return;
    }

    setSlotsLoading(true);

    // Simulate a small delay for UX
    const timer = setTimeout(() => {
      const availableSlots = getAvailableSlots(
        selectedDate,
        selectedService.duration_minutes,
        appointments,
        businessHours
      );
      setSlots(availableSlots);
      setSlotsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedDate, selectedService, appointments, businessHours]);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Select Date & Time</h2>
          <p className="text-base-content/70">Choose when you&apos;d like to bring your pet in</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-base-100 rounded-xl border border-base-300 p-4 animate-pulse">
            <div className="h-64 bg-base-300 rounded-lg" />
          </div>
          <div className="bg-base-100 rounded-xl border border-base-300 p-4 animate-pulse">
            <div className="h-64 bg-base-300 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-base-content mb-2">Select Date & Time</h2>
        <p className="text-base-content/70">Choose when you&apos;d like to bring your pet in</p>
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
            <div className="bg-base-100 rounded-xl border border-base-300 p-6 text-center h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-base-content/50"
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
              <p className="text-base-content/70">Select a date to see available times</p>
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
