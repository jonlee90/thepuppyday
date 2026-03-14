/**
 * PetCard Component
 * Displays a single pet's information in a card format with size-based accent strip.
 * Task 0060: Create PetCard Component
 */

'use client';

import { motion } from 'framer-motion';
import { PawPrint, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { getSizeLabel } from '@/lib/booking/pricing';
import type { Pet, PetSize } from '@/types/database';

export interface PetWithBreed extends Pet {
  breed?: {
    id: string;
    name: string;
    grooming_frequency_weeks: number;
    reminder_message: string | null;
    created_at: string;
  };
  // Extended fields added via schema migration (298e7b0)
  gender?: string | null;
  color?: string | null;
}

interface PetCardProps {
  pet: PetWithBreed;
  index: number;
  lastGroomDate?: string | null;
  lastGroomService?: string | null;
  onBook: (petId: string) => void;
  onEdit: (petId: string) => void;
}

const SIZE_ACCENT_COLORS: Record<PetSize, string> = {
  small: 'bg-[#7CB9E8]',
  medium: 'bg-[#77BFA3]',
  large: 'bg-[#D4A574]',
  xlarge: 'bg-[#C97B63]',
};

export function PetCard({ pet, index, lastGroomDate, lastGroomService, onBook, onEdit }: PetCardProps) {
  const accentColor = SIZE_ACCENT_COLORS[pet.size as PetSize] || SIZE_ACCENT_COLORS.medium;

  // Build details line: breed, size, gender, color -- omit falsy values
  const detailParts = [
    pet.breed?.name || pet.breed_custom || 'Unknown',
    getSizeLabel(pet.size as PetSize),
    pet.gender,
    pet.color,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Size-based accent strip */}
      <div className={`h-1.5 ${accentColor}`} />

      <div className="p-4 space-y-3" onClick={() => onEdit(pet.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onEdit(pet.id)} aria-label={`Edit ${pet.name}`}>
        {/* Pet identity row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <PawPrint className="w-4 h-4 text-[#D4A574] flex-shrink-0" />
            <span className="font-semibold text-[#434E54] truncate">{pet.name}</span>
          </div>
          <AdminButton
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); onBook(pet.id); }}
            className="flex-shrink-0"
          >
            Book
          </AdminButton>
        </div>

        {/* Details line */}
        <p className="text-sm text-[#434E54]/60">
          {detailParts.join(' · ')}
        </p>

        {/* Medical info -- always visible when present */}
        {pet.medical_info && (
          <div className="bg-amber-50/80 border-l-4 border-amber-400 p-3 rounded-r-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{pet.medical_info}</p>
          </div>
        )}

        {/* Optional notes */}
        {pet.notes && (
          <p className="text-sm text-[#434E54]/50 italic">{pet.notes}</p>
        )}

        {/* Last groom info */}
        {(lastGroomDate || lastGroomService) && (
          <p className="text-xs text-[#434E54]/40">
            Last groom:{' '}
            {lastGroomDate
              ? format(new Date(lastGroomDate), 'MMM d, yyyy')
              : null}
            {lastGroomDate && lastGroomService ? ' · ' : null}
            {lastGroomService}
          </p>
        )}
      </div>
    </motion.div>
  );
}
