'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
        customer?: { id: string; full_name: string; email: string; phone: string };
        pet?: { id: string; name: string };
        service?: { id: string; name: string };
      }
    >
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch matching waitlist entries when modal opens
  useEffect(() => {
    if (isOpen && slotDate && serviceId) {
      fetchMatchingEntries();
    }
  }, [isOpen, slotDate, serviceId]);

  const fetchMatchingEntries = async () => {
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
  };

  const handleSelectEntry = (entryId: string) => {
    onBookEntry(entryId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-2xl">Fill Open Slot from Waitlist</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select a waitlist entry to book for this available slot
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Slot Summary */}
        <div className="mb-6">
          <SlotSummary date={slotDate} time={slotTime} serviceName={serviceName} />
        </div>

        {/* Matching Entries List */}
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <MatchingWaitlistList matches={matches} onSelect={handleSelectEntry} />
          )}
        </div>

        {/* Footer */}
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
