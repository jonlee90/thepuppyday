/**
 * Pet card component for booking wizard
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-white rounded-xl overflow-hidden',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/50 focus-visible:ring-offset-2',
        isSelected
          ? 'shadow-xl ring-2 ring-[#434E54]'
          : 'shadow-md hover:shadow-lg'
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${pet.name}`}
    >
      <div className="p-4 sm:p-5 flex items-center gap-4">
        {/* Larger avatar with better states */}
        <div className={cn(
          'relative rounded-full overflow-hidden flex-shrink-0',
          'ring-2 transition-all duration-300',
          'w-16 h-16 sm:w-20 sm:h-20', // Larger on bigger screens
          isSelected
            ? 'ring-[#434E54] shadow-lg shadow-[#434E54]/30'
            : 'ring-[#EAE0D5]'
        )}>
          {pet.photo_url ? (
            <>
              <Image
                src={pet.photo_url}
                alt={pet.name}
                fill
                className="object-cover"
                sizes="80px"
              />
              {/* Overlay on selection */}
              {isSelected && (
                <div className="absolute inset-0 bg-[#434E54]/20" />
              )}
            </>
          ) : (
            <div className={cn(
              'absolute inset-0 flex items-center justify-center',
              isSelected
                ? 'bg-[#434E54]/20'
                : 'bg-[#EAE0D5]'
            )}>
              <svg
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10',
                  isSelected ? 'text-[#434E54]' : 'text-[#434E54]/30'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Pet info with better typography */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#434E54] text-base sm:text-lg truncate mb-1">
            {pet.name}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Enhanced size badge */}
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              isSelected ? 'bg-[#434E54] text-white' : 'bg-[#EAE0D5] text-[#434E54]'
            )}>
              {getSizeShortLabel(pet.size)}
            </span>

            {/* Breed with better overflow handling */}
            {(pet.breed_custom || pet.breed?.name) && (
              <span className="text-xs text-[#434E54]/60 truncate">
                {pet.breed_custom || pet.breed?.name}
              </span>
            )}
          </div>
        </div>

        {/* Enhanced selected indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-10 h-10 bg-[#434E54] rounded-full flex items-center
                         justify-center flex-shrink-0 shadow-md shadow-[#434E54]/30"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
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
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-white',
        'rounded-xl overflow-hidden border-2 border-dashed border-[#434E54]/30',
        'hover:border-[#434E54] hover:shadow-lg hover:bg-[#EAE0D5]/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/50 focus-visible:ring-offset-2',
        'transition-all duration-300 shadow-md'
      )}
    >
      <div className="p-4 sm:p-5 flex items-center gap-4">
        {/* Animated plus icon */}
        <motion.div
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full
                     bg-[#EAE0D5] flex items-center justify-center
                     flex-shrink-0 shadow-sm border-2 border-[#434E54]/20"
        >
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-[#434E54]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.div>

        {/* Enhanced text */}
        <div className="flex-1">
          <h3 className="font-bold text-[#434E54] text-base sm:text-lg mb-1">
            Add New Pet
          </h3>
          <p className="text-xs sm:text-sm text-[#434E54]/60">
            Register a new furry friend
          </p>
        </div>

        {/* Arrow indicator */}
        <svg
          className="w-5 h-5 text-[#434E54] flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.button>
  );
}
