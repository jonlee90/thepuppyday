'use client';

import { useState } from 'react';
import { MoreVertical, Calendar, Edit, Phone, X } from 'lucide-react';

interface WaitlistActionMenuProps {
  entryId: string;
  onBookNow: (entryId: string) => void;
  onEdit: (entryId: string) => void;
  onContact: (entryId: string) => void;
  onCancel: (entryId: string) => void;
}

/**
 * WaitlistActionMenu - Dropdown action menu for waitlist rows
 * Provides Book Now, Edit, Contact, and Cancel actions
 */
export function WaitlistActionMenu({
  entryId,
  onBookNow,
  onEdit,
  onContact,
  onCancel,
}: WaitlistActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-sm btn-circle"
        aria-label="Open actions menu"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {isOpen && (
        <ul
          tabIndex={0}
          className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300"
        >
          <li>
            <button
              onClick={() => handleAction(() => onBookNow(entryId))}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Book Now
            </button>
          </li>
          <li>
            <button
              onClick={() => handleAction(() => onEdit(entryId))}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </li>
          <li>
            <button
              onClick={() => handleAction(() => onContact(entryId))}
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              Contact
            </button>
          </li>
          <li className="border-t border-base-300 mt-1 pt-1">
            <button
              onClick={() => handleAction(() => onCancel(entryId))}
              className="gap-2 text-error hover:bg-error hover:text-white"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
