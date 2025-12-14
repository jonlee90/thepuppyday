'use client';

import { useState } from 'react';
import { X, Calendar, Clock, DollarSign, AlertCircle } from 'lucide-react';
import type { WaitlistEntry } from '@/types/database';

interface BookFromWaitlistModalProps {
  entry: WaitlistEntry & {
    customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
    pet?: { id: string; name: string };
    service?: { id: string; name: string };
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * BookFromWaitlistModal - Manual booking from waitlist entry
 * Pre-fills customer, pet, and service from waitlist entry
 * Allows admin to select date/time and apply optional discount
 */
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!appointmentDate || !appointmentTime) {
        setError('Please select both date and time');
        setIsSubmitting(false);
        return;
      }

      // Combine date and time into ISO string
      const scheduledAt = new Date(`${appointmentDate}T${appointmentTime}`).toISOString();

      // Call booking API
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

      // Success
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error booking from waitlist:', err);
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

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-bold text-foreground">
            Book from Waitlist
          </h3>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pre-filled Info */}
        <div className="bg-base-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-sm text-gray-700 mb-3">Booking Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-600">Customer:</span>{' '}
              <span className="text-foreground">
                {entry.customer
                  ? `${entry.customer.first_name} ${entry.customer.last_name}`
                  : 'Unknown'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Phone:</span>{' '}
              <span className="text-foreground">{entry.customer?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Pet:</span>{' '}
              <span className="text-foreground">{entry.pet?.name || 'Unknown'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Service:</span>{' '}
              <span className="text-foreground">{entry.service?.name || 'Unknown'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-600">Requested Date:</span>{' '}
              <span className="text-foreground">
                {new Date(entry.requested_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Appointment Date
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={today}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Appointment Time
                </span>
              </label>
              <input
                type="time"
                className="input input-bordered"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Discount */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Discount (Optional)
              </span>
            </label>
            <div className="join">
              <input
                type="number"
                className="input input-bordered join-item flex-1"
                placeholder="Enter discount percentage"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                min={0}
                max={100}
                disabled={isSubmitting}
              />
              <span className="btn btn-outline join-item">%</span>
            </div>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Apply a discount for booking from waitlist (0-100%)
              </span>
            </label>
          </div>

          {/* Notes */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium">Notes (Optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-20"
              placeholder="Add any additional notes for this appointment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
