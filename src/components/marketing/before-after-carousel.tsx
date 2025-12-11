'use client';

/**
 * Carousel for displaying multiple before/after pairs
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <p className="text-[#6B7280]">No before/after transformations available.</p>
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
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
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
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-10"
              aria-label="Previous transformation"
            >
              <svg
                className="w-6 h-6 text-[#434E54]"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-10"
              aria-label="Next transformation"
            >
              <svg
                className="w-6 h-6 text-[#434E54]"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
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
