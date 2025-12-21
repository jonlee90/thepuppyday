/**
 * Empty state for banner list
 * Task 0173: Empty state UI
 */

'use client';

import { motion } from 'framer-motion';
import { ImageOff, Plus } from 'lucide-react';

interface BannerEmptyStateProps {
  onCreate: () => void;
}

export function BannerEmptyState({ onCreate }: BannerEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-12 text-center"
    >
      <div className="w-20 h-20 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-6">
        <ImageOff className="w-10 h-10 text-[#434E54]/40" />
      </div>

      <h3 className="text-xl font-semibold text-[#434E54] mb-2">
        No Banners Yet
      </h3>

      <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
        Create your first promotional banner to highlight special offers, events, or announcements to your customers.
      </p>

      <button
        onClick={onCreate}
        className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create First Banner
      </button>
    </motion.div>
  );
}
