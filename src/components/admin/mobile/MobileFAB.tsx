'use client';

import { motion } from 'framer-motion';

export interface MobileFABProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

export function MobileFAB({ icon, label, onClick, className = '' }: MobileFABProps) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-[#434E54] text-white shadow-lg flex items-center justify-center ${className}`}
    >
      <span className="w-6 h-6 flex items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
    </motion.button>
  );
}
