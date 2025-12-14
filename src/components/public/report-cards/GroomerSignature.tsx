'use client';

import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';

interface GroomerSignatureProps {
  groomerName: string;
  date: string;
}

/**
 * GroomerSignature - Professional signature display for groomer
 * Shows groomer name and date in stylized format
 */
export function GroomerSignature({ groomerName, date }: GroomerSignatureProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200"
    >
      {/* Groomer Info */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#EAE0D5] rounded-lg">
          <PenLine className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <p className="text-sm text-[#6B7280] mb-0.5">Groomer</p>
          <p className="text-base font-semibold text-[#434E54]">
            {groomerName}
          </p>
        </div>
      </div>

      {/* Date */}
      <div className="text-right">
        <p className="text-sm text-[#9CA3AF]">{formattedDate}</p>
      </div>
    </motion.div>
  );
}
