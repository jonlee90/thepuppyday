'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, Edit, Phone, X, MoreVertical } from 'lucide-react';
import type { WaitlistStatus } from '@/types/database';

interface WaitlistActionMenuProps {
  entryId: string;
  status: WaitlistStatus;
  onBookNow: (entryId: string) => void;
  onEdit: (entryId: string) => void;
  onContact: (entryId: string) => void;
  onCancel: (entryId: string) => void;
}

const INACTIVE_STATUSES: ReadonlySet<WaitlistStatus> = new Set(['cancelled', 'booked', 'expired', 'expired_offer']);

/**
 * WaitlistActionMenu - Dropdown action menu for waitlist rows
 * Disables mutating actions for cancelled/booked/expired entries
 */
export function WaitlistActionMenu({
  entryId,
  status,
  onBookNow,
  onEdit,
  onContact,
  onCancel,
}: WaitlistActionMenuProps) {
  const isInactive = INACTIVE_STATUSES.has(status);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1.5 rounded-lg text-[#434E54]/50 hover:bg-[#EAE0D5] hover:text-[#434E54] transition-colors"
        aria-label="Open actions menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 bg-white rounded-xl shadow-lg border border-[#434E54]/10 w-44 py-1 mt-1">
          <button
            onClick={() => handleAction(() => onBookNow(entryId))}
            disabled={isInactive}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-[#434E54] hover:bg-[#F8EEE5] transition-colors ${
              isInactive ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            <Calendar className="h-4 w-4" />
            Book Now
          </button>
          <button
            onClick={() => handleAction(() => onEdit(entryId))}
            disabled={isInactive}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-[#434E54] hover:bg-[#F8EEE5] transition-colors ${
              isInactive ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => handleAction(() => onContact(entryId))}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#434E54] hover:bg-[#F8EEE5] transition-colors"
          >
            <Phone className="h-4 w-4" />
            Contact
          </button>
          <div className="border-t border-[#434E54]/10 mt-1 pt-1">
            <button
              onClick={() => handleAction(() => onCancel(entryId))}
              disabled={isInactive}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors ${
                isInactive ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
