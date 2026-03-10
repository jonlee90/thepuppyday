'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createFocusTrap } from '@/lib/accessibility/focus';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { SlotSummary } from './SlotSummary';
import { MatchingWaitlistList } from './MatchingWaitlistList';
import type { WaitlistEntry } from '@/types/database';

interface FillSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotDate: string;
  slotTime: string;
  serviceId: string;
  serviceName: string;
  onBookEntry: (entryId: string) => void;
}

/**
 * FillSlotModal - Modal for filling open calendar slots from waitlist
 * Shows matching waitlist entries and allows booking
 */
export function FillSlotModal({
  isOpen,
  onClose,
  slotDate,
  slotTime,
  serviceId,
  serviceName,
  onBookEntry,
}: FillSlotModalProps) {
  const [matches, setMatches] = useState<
    Array<
      WaitlistEntry & {
        customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
        pet?: { id: string; name: string };
        service?: { id: string; name: string };
      }
    >
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchMatchingEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calculate date range (±3 days)
      const slotDateObj = new Date(slotDate);
      const startDate = new Date(slotDateObj);
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date(slotDateObj);
      endDate.setDate(endDate.getDate() + 3);

      // Build query params
      const params = new URLSearchParams({
        service_id: serviceId,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        sort_by: 'created_at',
        sort_order: 'asc',
        limit: '100', // Get all matches
      });

      const response = await fetch(`/api/admin/waitlist?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch matching entries');
      }

      const data = await response.json();
      setMatches(data.entries || []);
    } catch (error) {
      console.error('Error fetching matching entries:', error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [slotDate, serviceId]);

  // Fetch matching waitlist entries when modal opens
  useEffect(() => {
    if (isOpen && slotDate && serviceId) {
      fetchMatchingEntries();
    }
  }, [isOpen, slotDate, serviceId, fetchMatchingEntries]);

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
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectEntry = (entryId: string) => {
    onBookEntry(entryId);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-6 pb-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAE0D5] flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-[#434E54]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#434E54] leading-tight">
                      Fill Open Slot from Waitlist
                    </h3>
                    <p className="text-xs text-[#434E54]/50 mt-0.5">
                      Select a waitlist entry to book for this available slot
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-[#434E54]/60 hover:bg-[#EAE0D5] transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="overflow-y-auto flex-1 px-6 pb-4">
                {/* Slot Summary */}
                <div className="mb-6">
                  <SlotSummary date={slotDate} time={slotTime} serviceName={serviceName} />
                </div>

                {/* Matching Entries List */}
                <div>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <span className="loading loading-spinner loading-lg text-[#434E54]"></span>
                    </div>
                  ) : (
                    <MatchingWaitlistList matches={matches} onSelect={handleSelectEntry} />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-[#434E54]/10 bg-[#EAE0D5]/30 flex gap-3 justify-end shrink-0">
                <AdminButton variant="ghost" onClick={onClose}>
                  Cancel
                </AdminButton>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
