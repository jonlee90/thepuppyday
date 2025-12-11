'use client';

/**
 * Carousel for displaying multiple before/after pairs
 * Clean & Elegant Professional design
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BeforeAfterSlider } from './before-after-slider';
import type { BeforeAfterPair } from '@/types/database';

interface BeforeAfterCarouselProps {
  pairs: BeforeAfterPair[];
}

export function BeforeAfterCarousel({ pairs }: BeforeAfterCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pairs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-2xl p-8 shadow-md max-w-md mx-auto">
          <p className="text-[#6B7280]">No before/after transformations available at this time.</p>
          <p className="text-sm text-[#6B7280] mt-2">Check back soon for amazing grooming transformations!</p>
        </div>
      </div>
    );
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pairs.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + pairs.length) % pairs.length);
  };

  const currentPair = pairs[currentIndex];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Carousel Container */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <BeforeAfterSlider
              beforeImage={currentPair.before_image_url}
              afterImage={currentPair.after_image_url}
              petName={currentPair.pet_name || undefined}
              description={currentPair.description || undefined}
              altText="Grooming transformation"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {pairs.length > 1 && (
          <>
            <motion.button
              onClick={goToPrevious}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 z-10 border border-gray-100"
              aria-label="Previous transformation"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-[#434E54]" strokeWidth={2.5} />
            </motion.button>

            <motion.button
              onClick={goToNext}
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 z-10 border border-gray-100"
              aria-label="Next transformation"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#434E54]" strokeWidth={2.5} />
            </motion.button>
          </>
        )}
      </div>

      {/* Indicators */}
      {pairs.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {pairs.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'w-8 bg-[#434E54]' : 'w-2 bg-[#EAE0D5]'
              }`}
              aria-label={`Go to transformation ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {pairs.length > 1 && (
        <div className="text-center mt-4 text-sm text-[#6B7280]">
          {currentIndex + 1} / {pairs.length}
        </div>
      )}
    </div>
  );
}
