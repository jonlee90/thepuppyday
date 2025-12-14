'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BeforeAfterComparisonProps {
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  petName: string;
}

/**
 * BeforeAfterComparison - Interactive before/after slider
 * Swipeable on mobile, draggable on desktop
 */
export function BeforeAfterComparison({
  beforePhotoUrl,
  afterPhotoUrl,
  petName,
}: BeforeAfterComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  if (!beforePhotoUrl || !afterPhotoUrl) {
    return null;
  }

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#434E54] mb-3">
            The Transformation
          </h2>
          <p className="text-[#6B7280]">
            Drag the slider to see the before and after
          </p>
        </div>

        {/* Comparison Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full aspect-[4/3] lg:aspect-[16/9] rounded-xl overflow-hidden shadow-xl cursor-ew-resize select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          {/* After Photo (Background) */}
          <div className="absolute inset-0">
            <Image
              src={afterPhotoUrl}
              alt={`${petName} after grooming`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
            {/* After Label */}
            <div className="absolute top-4 right-4 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md">
              After
            </div>
          </div>

          {/* Before Photo (Overlay with clip-path) */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          >
            <Image
              src={beforePhotoUrl}
              alt={`${petName} before grooming`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
            {/* Before Label */}
            <div className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md">
              Before
            </div>
          </div>

          {/* Slider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Handle Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-[#434E54] absolute -left-1" />
              <ChevronRight className="w-5 h-5 text-[#434E54] absolute -right-1" />
            </div>
          </div>
        </motion.div>

        {/* Mobile Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-[#9CA3AF] mt-6 lg:hidden"
        >
          Swipe left or right to compare
        </motion.p>
      </div>
    </section>
  );
}
