'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { createFocusTrap } from '@/lib/accessibility/focus';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { toast } from '@/hooks/use-toast';
import type { WaitlistEntry } from '@/types/database';
import { formatLocalDate } from '@/lib/utils/date-validation';

interface BookFromWaitlistModalProps {
  entry: WaitlistEntry & {
    customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
    pet?: { id: string; name: string };
    service?: { id: string; name: string };
    preferred_time?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookFromWaitlistModal({
  entry,
  isOpen,
  onClose,
  onSuccess,
}: BookFromWaitlistModalProps) {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Prefill date/time from waitlist entry
  useEffect(() => {
    if (entry) {
      setAppointmentDate(entry.requested_date || '');
      setAppointmentTime(entry.preferred_time || '');
    }
  }, [entry]);

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen && modalRef.current) {
      document.body.style.overflow = 'hidden';
      const focusTrap = createFocusTrap(modalRef.current);
      focusTrap.activate();

      return () => {
        focusTrap.deactivate();
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!appointmentDate || !appointmentTime) {
        setError('Please select both date and time');
        setIsSubmitting(false);
        return;
      }

      // Send local datetime with timezone offset to preserve the intended date
      const local = new Date(`${appointmentDate}T${appointmentTime}`);
      const offset = -local.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
      const scheduledAt = `${appointmentDate}T${appointmentTime}:00${sign}${pad(Math.floor(offset / 60))}:${pad(offset % 60)}`;

      const response = await fetch(`/api/admin/waitlist/${entry.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_at: scheduledAt,
          discount_percentage: discount,
          notes: notes || `Booked from waitlist. ${discount > 0 ? `${discount}% discount applied.` : ''}`.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      toast.success('Appointment booked');
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('[BookFromWaitlistModal] error:', err);
      toast.error('Failed to book appointment');
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAppointmentDate('');
    setAppointmentTime('');
    setDiscount(0);
    setNotes('');
    setError(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

  const today = formatLocalDate(new Date());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />

          {/* Modal container */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="book-waitlist-title"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAE0D5] flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[#434E54]" />
                  </div>
                  <div>
                    <h3 id="book-waitlist-title" className="text-lg font-bold text-[#434E54] leading-tight">Book from Waitlist</h3>
                    <p className="text-xs text-[#434E54]/50 mt-0.5">Schedule appointment from waitlist entry</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-lg text-[#434E54]/60 hover:bg-[#EAE0D5] transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Pre-filled Info Card */}
              <div className="px-6">
                <div className="bg-[#F8EEE5] rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-[#434E54] mb-3">Booking Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-[#434E54]/70">Customer:</span>{' '}
                      <span className="text-[#434E54]">
                        {entry.customer
                          ? `${entry.customer.first_name} ${entry.customer.last_name}`
                          : 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-[#434E54]/70">Phone:</span>{' '}
                      <span className="text-[#434E54]">{entry.customer?.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#434E54]/70">Pet:</span>{' '}
                      <span className="text-[#434E54]">{entry.pet?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#434E54]/70">Service:</span>{' '}
                      <span className="text-[#434E54]">{entry.service?.name || 'Unknown'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-[#434E54]/70">Requested Date & Time:</span>{' '}
                      <span className="text-[#434E54]">
                        {new Date(entry.requested_date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {entry.preferred_time
                          ? ` at ${new Date('2000-01-01T' + entry.preferred_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                          : entry.time_preference && entry.time_preference !== 'any'
                            ? ` (${entry.time_preference.charAt(0).toUpperCase() + entry.time_preference.slice(1)})`
                            : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 space-y-4 mt-4">
                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        min={today}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Appointment Time
                      </label>
                      <input
                        type="time"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Discount (Optional)
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-1 px-3 py-2.5 rounded-l-lg border border-r-0 border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors"
                        placeholder="Enter discount percentage"
                        value={discount === 0 ? '' : discount}
                        onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                        min={0}
                        max={100}
                        disabled={isSubmitting}
                      />
                      <span className="flex items-center px-4 bg-[#EAE0D5] text-[#434E54]/70 text-sm font-medium rounded-r-lg border border-l-0 border-[#434E54]/20">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-[#434E54]/60 mt-1.5">
                      Apply a discount for booking from waitlist (0-100%)
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      Notes (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors resize-none"
                      rows={3}
                      placeholder="Add any additional notes for this appointment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 mt-4 border-t border-[#434E54]/10 bg-[#EAE0D5]/30 flex gap-3 justify-end">
                  <AdminButton
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </AdminButton>
                  <AdminButton
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    loadingText="Creating..."
                  >
                    Book Appointment
                  </AdminButton>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
