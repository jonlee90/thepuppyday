/**
 * Pet card component for booking wizard
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getSizeShortLabel } from '@/lib/booking/pricing';
import type { Pet } from '@/types/database';

interface PetCardProps {
  pet: Pet;
  isSelected: boolean;
  onSelect: () => void;
}

export function PetCard({ pet, isSelected, onSelect }: PetCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-white rounded-xl overflow-hidden transition-all duration-200',
        'hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:ring-offset-2',
        isSelected ? 'shadow-lg ring-2 ring-[#434E54]' : 'shadow-md'
      )}
    >
      <div className="p-5 flex items-center gap-4">
        {/* Pet avatar */}
        <div className="relative w-16 h-16 rounded-full bg-[#EAE0D5] overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
          {pet.photo_url ? (
            <Image
              src={pet.photo_url}
              alt={pet.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[#434E54]/40">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Pet info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#434E54] text-lg truncate">{pet.name}</h3>
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EAE0D5] text-[#434E54] font-medium text-xs">
              {getSizeShortLabel(pet.size)}
            </span>
            {(pet.breed_custom || pet.breed?.name) && (
              <span className="truncate">{pet.breed_custom || pet.breed?.name}</span>
            )}
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-9 h-9 bg-[#434E54] rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

interface AddPetCardProps {
  onClick: () => void;
}

export function AddPetCard({ onClick }: AddPetCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-white rounded-xl overflow-hidden border-2 border-dashed border-[#EAE0D5]',
        'hover:border-[#434E54] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:ring-offset-2',
        'transition-all duration-200 shadow-md'
      )}
    >
      <div className="p-5 flex items-center gap-4">
        {/* Plus icon */}
        <div className="w-16 h-16 rounded-full bg-[#EAE0D5] flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg
            className="w-8 h-8 text-[#434E54]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1">
          <h3 className="font-bold text-[#434E54] text-lg">Add New Pet</h3>
          <p className="text-sm text-[#6B7280] mt-0.5">Register a new furry friend</p>
        </div>
      </div>
    </motion.button>
  );
}
