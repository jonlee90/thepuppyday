/**
 * Date & Time Selection Step
 * Task 0017: Calendar picker, time slots, notes, and payment fields
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import type {
  ManualAppointmentState,
  SelectedDateTime,
  PaymentStatus,
  PaymentDetails,
  TimeSlot,
} from '@/types/admin-appointments';
import { formatCurrency } from '@/lib/booking/pricing';

interface DateTimeStepProps {
  state: ManualAppointmentState;
  updateState: (updates: Partial<ManualAppointmentState>) => void;
  onNext: () => void;
}

export function DateTimeStep({ state, updateState, onNext }: DateTimeStepProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    state.selectedDateTime?.date || ''
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    state.selectedDateTime?.time || ''
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [notes, setNotes] = useState(state.notes || '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    state.paymentStatus || 'pending'
  );
  const [paymentAmount, setPaymentAmount] = useState(
    state.paymentDetails?.amount_paid?.toString() || ''
  );
  const [paymentMethod, setPaymentMethod] = useState(
    state.paymentDetails?.payment_method || ''
  );
  const [adminOverridePastDate, setAdminOverridePastDate] = useState(false);

  // Calculate min date (today)
  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // Check if selected date is in the past
  const isPastDate = useMemo(() => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  }, [selectedDate]);

  // Check if selected date is Sunday
  const isSunday = useMemo(() => {
    if (!selectedDate) return false;
    const date = new Date(selectedDate);
    return date.getDay() === 0;
  }, [selectedDate]);

  // Load available time slots when date changes
  useEffect(() => {
    if (!selectedDate || isSunday) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const duration = state.selectedService?.duration_minutes || 60;
        const response = await fetch(
          `/api/admin/appointments/availability?date=${selectedDate}&duration_minutes=${duration}`
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots || []);
        }
      } catch (error) {
        console.error('Fetch slots error:', error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, isSunday, state.selectedService?.duration_minutes]);

  // Handle date change
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  }, []);

  // Handle time selection
  const handleTimeSelection = useCallback((time: string) => {
    setSelectedTime(time);
  }, []);

  // Handle payment status change
  const handlePaymentStatusChange = useCallback((status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'pending') {
      setPaymentAmount('');
      setPaymentMethod('');
    }
  }, []);

  // Update state when selections change
  useEffect(() => {
    if (selectedDate && selectedTime) {
      updateState({
        selectedDateTime: {
          date: selectedDate,
          time: selectedTime,
          isPastDate: isPastDate && !adminOverridePastDate,
        },
        notes,
        paymentStatus,
        paymentDetails:
          paymentStatus !== 'pending'
            ? {
                amount_paid: parseFloat(paymentAmount) || 0,
                payment_method: paymentMethod,
              }
            : undefined,
      });
    }
  }, [
    selectedDate,
    selectedTime,
    isPastDate,
    adminOverridePastDate,
    notes,
    paymentStatus,
    paymentAmount,
    paymentMethod,
    updateState,
  ]);

  // Handle next button
  const handleNext = useCallback(() => {
    if (selectedDate && selectedTime && (paymentStatus === 'pending' || paymentAmount)) {
      onNext();
    }
  }, [selectedDate, selectedTime, paymentStatus, paymentAmount, onNext]);

  const canProceed = selectedDate && selectedTime && (paymentStatus === 'pending' || paymentAmount);

  // Calculate total price
  const totalPrice = useMemo(() => {
    const servicePrice = state.selectedService?.price || 0;
    const addonsTotal = state.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return servicePrice + addonsTotal;
  }, [state.selectedService, state.selectedAddons]);

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Select Date <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="input input-bordered w-full pl-10 bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
          />
        </div>
        {isSunday && (
          <div className="alert alert-warning mt-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Business is closed on Sundays</span>
          </div>
        )}
        {isPastDate && !adminOverridePastDate && (
          <div className="alert alert-warning mt-2">
            <AlertTriangle className="w-4 h-4" />
            <div className="flex-1">
              <span className="text-sm">This date is in the past</span>
              <button
                onClick={() => setAdminOverridePastDate(true)}
                className="btn btn-xs btn-ghost ml-2"
              >
                Override
              </button>
            </div>
          </div>
        )}
        {isPastDate && adminOverridePastDate && (
          <div className="alert alert-info mt-2">
            <span className="text-sm">Admin override: past date allowed</span>
          </div>
        )}
      </div>

      {/* Time Selection */}
      {selectedDate && !isSunday && (
        <div>
          <label className="block text-sm font-semibold text-[#434E54] mb-2">
            Select Time <span className="text-red-500">*</span>
          </label>

          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md text-[#434E54]"></span>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {availableSlots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const isFullyBooked = !slot.available;

                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => !isFullyBooked && handleTimeSelection(slot.time)}
                    disabled={isFullyBooked}
                    className={`btn btn-sm ${
                      isSelected
                        ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
                        : isFullyBooked
                        ? 'btn-disabled bg-gray-200 text-gray-400'
                        : 'btn-outline border-gray-200 hover:border-[#434E54] text-[#434E54]'
                    }`}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {slot.time}
                    {isFullyBooked && (
                      <span className="ml-1 text-xs">(Full)</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {availableSlots.length === 0 && !isLoadingSlots && (
            <div className="text-center py-6 text-[#6B7280]">
              No available time slots for this date
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Notes <span className="text-[#9CA3AF]">(Optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={4}
          className="textarea textarea-bordered w-full bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
          placeholder="Add any special instructions or notes..."
        />
        <div className="text-right text-xs text-[#9CA3AF] mt-1">
          {notes.length} / 1000 characters
        </div>
      </div>

      {/* Payment Status */}
      <div>
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Payment Status <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {(['pending', 'paid', 'partially_paid'] as PaymentStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handlePaymentStatusChange(status)}
              className={`btn flex-1 ${
                paymentStatus === status
                  ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
                  : 'btn-outline border-gray-200 hover:border-[#434E54] text-[#434E54]'
              }`}
            >
              {status === 'pending' && 'Pending'}
              {status === 'paid' && 'Paid'}
              {status === 'partially_paid' && 'Partially Paid'}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Details (Conditional) */}
      {(paymentStatus === 'paid' || paymentStatus === 'partially_paid') && (
        <div className="p-6 bg-[#FFFBF7] rounded-xl border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#434E54] mb-1">
              Amount Paid <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="input input-bordered w-full pl-10 bg-white"
                placeholder="0.00"
                min="0"
                step="0.01"
                max={totalPrice}
              />
            </div>
            <div className="text-sm text-[#6B7280] mt-1">
              Total: {formatCurrency(totalPrice)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#434E54] mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="select select-bordered w-full bg-white"
            >
              <option value="">Select method...</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="check">Check</option>
              <option value="venmo">Venmo</option>
              <option value="zelle">Zelle</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`btn ${
            canProceed
              ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
              : 'btn-disabled bg-gray-300 text-gray-500'
          }`}
        >
          Next: Review & Confirm
        </button>
      </div>
    </div>
  );
}
