'use client';

import { motion } from 'framer-motion';

interface PetNameBadgeProps {
  petName: string;
}

/**
 * PetNameBadge - Displays pet name as an overlay badge
 * Part of the HeroSection component
 */
export function PetNameBadge({ petName }: PetNameBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="inline-flex items-center gap-2 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg"
    >
      <div className="w-2 h-2 bg-[#434E54] rounded-full animate-pulse" />
      <span className="text-lg font-semibold text-[#434E54]">
        {petName}
      </span>
    </motion.div>
  );
}
