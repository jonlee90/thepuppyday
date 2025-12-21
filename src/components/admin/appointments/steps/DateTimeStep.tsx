/**
 * Date & Time Selection Step
 * Task 0017: Calendar picker, time slots, notes, and payment fields
 * Redesigned with mobile-first, touch-friendly UI matching customer booking flow
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import type {
  ManualAppointmentState,
  PaymentStatus,
  TimeSlot,
} from '@/types/admin-appointments';
import { formatCurrency } from '@/lib/booking/pricing';

/**
 * Format 24h time to 12h AM/PM format
 * e.g., "09:00" -> "9:00 AM", "14:30" -> "2:30 PM"
 */
function formatTimeToAMPM(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

interface DateTimeStepProps {
  state: ManualAppointmentState;
  updateState: (updates: Partial<ManualAppointmentState>) => void;
  onNext: () => void;
}

export function DateTimeStep({ state, updateState }: DateTimeStepProps) {
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
  const [dateBlockedReason, setDateBlockedReason] = useState<string | null>(null);
  const [isDateClosed, setIsDateClosed] = useState(false);

  // Check if selected date is in the past
  // Parse date string as local date to avoid UTC conversion issues
  const isPastDate = useMemo(() => {
    if (!selectedDate) return false;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selected = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  }, [selectedDate]);

  // Load available time slots when date changes
  // The API handles all blocking logic (recurring blocked days, specific blocked dates, business hours)
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setDateBlockedReason(null);
      setIsDateClosed(false);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setDateBlockedReason(null);
      setIsDateClosed(false);

      try {
        const duration = state.selectedService?.duration_minutes || 60;
        const response = await fetch(
          `/api/admin/appointments/availability?date=${selectedDate}&duration_minutes=${duration}`
        );
        if (response.ok) {
          const data = await response.json();

          // Check if date is closed/blocked
          if (data.is_closed) {
            setIsDateClosed(true);
            setDateBlockedReason(data.reason || 'This date is not available for appointments');
            setAvailableSlots([]);
          } else {
            setAvailableSlots(data.time_slots || []);
          }
        }
      } catch (error) {
        console.error('Fetch slots error:', error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, state.selectedService?.duration_minutes]);

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

  // Calculate total price
  const totalPrice = useMemo(() => {
    const servicePrice = state.selectedService?.price || 0;
    const addonsTotal = state.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return servicePrice + addonsTotal;
  }, [state.selectedService, state.selectedAddons]);

  return (
    <div className="space-y-6">
      {/* Header with icon badge and paw print decoration */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute -top-2 -right-2 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 text-[#434E54]" />
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Select Date & Time</h2>
        </div>
        <p className="text-[#434E54]/70">Pick the appointment date and time slot</p>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Select Date <span className="text-[#EF4444]">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="input input-bordered w-full h-12 pl-10 bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 rounded-lg transition-all duration-150"
          />
        </div>
        {isDateClosed && dateBlockedReason && (
          <div className="alert bg-[#FFB347]/10 border border-[#FFB347] rounded-lg p-3 mt-2" role="alert">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm text-[#434E54]">{dateBlockedReason}</span>
          </div>
        )}
        {isPastDate && !adminOverridePastDate && !isDateClosed && (
          <div className="alert bg-[#FFB347]/10 border border-[#FFB347] rounded-lg p-3 mt-2" role="alert">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm text-[#434E54] block mb-2">This date is in the past</span>
              <button
                onClick={() => setAdminOverridePastDate(true)}
                className="btn btn-xs bg-[#434E54] text-white hover:bg-[#363F44] border-none"
              >
                Override (Admin Only)
              </button>
            </div>
          </div>
        )}
        {isPastDate && adminOverridePastDate && (
          <div className="alert bg-[#74B9FF]/10 border border-[#74B9FF] rounded-lg p-3 mt-2" role="status">
            <span className="text-sm text-[#434E54]">Admin override: past date allowed</span>
          </div>
        )}
      </div>

      {/* Time Selection */}
      {selectedDate && !isDateClosed && (
        <div>
          <label className="block text-sm font-semibold text-[#434E54] mb-2">
            Select Time <span className="text-[#EF4444]">*</span>
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
                    className={`btn btn-sm min-h-[44px] h-11 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#434E54] text-white hover:bg-[#363F44] border-none shadow-md'
                        : isFullyBooked
                        ? 'bg-[#F5F5F5] text-[#9CA3AF] cursor-not-allowed border-[#E5E5E5]'
                        : 'btn-outline border-[#E5E5E5] hover:border-[#434E54] text-[#434E54]'
                    }`}
                    aria-label={`Select time ${formatTimeToAMPM(slot.time)}${isFullyBooked ? ' (Fully booked)' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatTimeToAMPM(slot.time)}</span>
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
          className="textarea textarea-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 rounded-lg transition-all duration-150"
          placeholder="Add any special instructions or notes..."
        />
        <div className="text-right text-xs text-[#9CA3AF] mt-1">
          {notes.length} / 1000 characters
        </div>
      </div>

      {/* Payment Status */}
      <div>
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Payment Status <span className="text-[#EF4444]">*</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          {(['pending', 'paid', 'partially_paid'] as PaymentStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handlePaymentStatusChange(status)}
              className={`btn flex-1 min-h-[48px] h-12 rounded-lg transition-all duration-200 ${
                paymentStatus === status
                  ? 'bg-[#434E54] text-white hover:bg-[#363F44] border-none shadow-md'
                  : 'btn-outline border-[#E5E5E5] hover:border-[#434E54] text-[#434E54]'
              }`}
              aria-pressed={paymentStatus === status}
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
        <div className="p-4 md:p-6 bg-[#FFFBF7] rounded-xl border border-[#E5E5E5] space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#434E54] mb-2">
              Amount Paid <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="input input-bordered w-full h-12 pl-10 bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 rounded-lg"
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
            <label className="block text-sm font-medium text-[#434E54] mb-2">
              Payment Method <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="select select-bordered w-full h-12 bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 rounded-lg"
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
    </div>
  );
}
