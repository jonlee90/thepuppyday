'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, XCircle } from 'lucide-react';
import { createFocusTrap } from '@/lib/accessibility/focus';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { toast } from '@/hooks/use-toast';
import type { WaitlistEntry } from '@/types/database';

type WaitlistEntryWithJoins = WaitlistEntry & {
  customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
  pet?: { id: string; name: string };
  service?: { id: string; name: string };
  preferred_time?: string | null;
};

interface EditWaitlistModalProps {
  entry: WaitlistEntryWithJoins;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCancelEntry: () => void;
}

const PRIORITIES = [
  { value: 1, label: 'Low' },
  { value: 0, label: 'Normal' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Urgent' },
  { value: 5, label: 'Critical' },
] as const;

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function EditWaitlistModal({ entry, isOpen, onClose, onSuccess, onCancelEntry }: EditWaitlistModalProps) {
  const [requestedDate, setRequestedDate] = useState('');
  const [preferenceMode, setPreferenceMode] = useState<'named' | 'specific'>('named');
  const [namedPreference, setNamedPreference] = useState<'morning' | 'afternoon' | 'any'>('any');
  const [specificTime, setSpecificTime] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync form state when entry changes
  useEffect(() => {
    if (entry) {
      setRequestedDate(entry.requested_date || '');
      setNotes(entry.notes || '');
      setPriority(entry.priority || 0);

      const pref = entry.time_preference || 'any';
      const prefTime = (entry as WaitlistEntryWithJoins).preferred_time;

      if (prefTime) {
        setPreferenceMode('specific');
        setSpecificTime(prefTime);
        setNamedPreference(pref as 'morning' | 'afternoon' | 'any');
      } else {
        setPreferenceMode('named');
        setNamedPreference(pref as 'morning' | 'afternoon' | 'any');
        setSpecificTime('');
      }
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
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        requested_date: requestedDate,
        time_preference: preferenceMode === 'specific'
          ? (parseInt(specificTime.split(':')[0]) < 12 ? 'morning' : 'afternoon')
          : namedPreference,
        preferred_time: preferenceMode === 'specific' && specificTime ? specificTime : null,
        notes,
        priority,
      };

      const res = await fetch(`/api/admin/waitlist/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success('Waitlist entry updated');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('[EditWaitlistModal] Error:', err);
      toast.error('Failed to update waitlist entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const customerName = entry.customer
    ? `${entry.customer.first_name} ${entry.customer.last_name}`
    : 'Unknown Customer';

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
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-waitlist-title"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAE0D5] flex items-center justify-center">
                    <Edit className="w-4 h-4 text-[#434E54]" />
                  </div>
                  <div>
                    <h3 id="edit-waitlist-title" className="text-lg font-bold text-[#434E54] leading-tight">Edit Waitlist Entry</h3>
                    <p className="text-xs text-[#434E54]/50 mt-0.5">Update preferences and details</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-lg text-[#434E54]/60 hover:bg-[#EAE0D5] transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Read-only Info Card */}
              <div className="px-6">
                <div className="bg-[#F8EEE5] rounded-xl p-4">
                  <p className="text-sm text-[#434E54]/70">Customer</p>
                  <p className="font-medium text-[#434E54]">{customerName}</p>
                  <div className="flex gap-4 mt-1 text-sm text-[#434E54]/70">
                    {entry.pet ? <span>Pet: {entry.pet.name}</span> : null}
                    {entry.service ? <span>Service: {entry.service.name}</span> : null}
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 space-y-4 mt-4">
                  {/* Requested Date */}
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      Requested Date
                    </label>
                    <input
                      type="date"
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Time Preference */}
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      Time Preference
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          preferenceMode === 'named'
                            ? 'bg-[#434E54] text-white border-none hover:bg-[#363F44]'
                            : 'btn-outline border-[#434E54] text-[#434E54] hover:bg-[#434E54] hover:text-white'
                        }`}
                        onClick={() => setPreferenceMode('named')}
                        disabled={isSubmitting}
                      >
                        Morning / Afternoon
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          preferenceMode === 'specific'
                            ? 'bg-[#434E54] text-white border-none hover:bg-[#363F44]'
                            : 'btn-outline border-[#434E54] text-[#434E54] hover:bg-[#434E54] hover:text-white'
                        }`}
                        onClick={() => setPreferenceMode('specific')}
                        disabled={isSubmitting}
                      >
                        Exact Time
                      </button>
                    </div>
                    {preferenceMode === 'named' ? (
                      <select
                        value={namedPreference}
                        onChange={(e) => setNamedPreference(e.target.value as 'morning' | 'afternoon' | 'any')}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors"
                        disabled={isSubmitting}
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="any">Any Time</option>
                      </select>
                    ) : (
                      <div>
                        <input
                          type="time"
                          value={specificTime}
                          onChange={(e) => setSpecificTime(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors"
                          required={preferenceMode === 'specific'}
                          disabled={isSubmitting}
                        />
                        {specificTime && (
                          <p className="text-xs text-[#434E54]/60 mt-1">
                            Selected: {formatTime12h(specificTime)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors"
                      disabled={isSubmitting}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors resize-none"
                      rows={3}
                      placeholder="Additional notes..."
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 mt-4 border-t border-[#434E54]/10 bg-[#EAE0D5]/30 flex items-center justify-between">
                  {entry.status !== 'cancelled' && entry.status !== 'booked' ? (
                    <AdminButton
                      type="button"
                      variant="danger"
                      onClick={onCancelEntry}
                      disabled={isSubmitting}
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Waitlist Entry
                    </AdminButton>
                  ) : (
                    <div />
                  )}
                  <AdminButton
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    loadingText="Saving..."
                  >
                    Save Changes
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
