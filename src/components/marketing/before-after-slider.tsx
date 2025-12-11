'use client';

/**
 * Interactive before/after image comparison slider
 * Clean & Elegant Professional design
 */

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  altText?: string;
  petName?: string;
  description?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  altText = 'Before and after grooming',
  petName,
  description,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updatePosition(e.clientX);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    updatePosition(e.clientX);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="w-full">
      {/* Clean & Elegant Image Container */}
      <div
        ref={containerRef}
        className="relative w-full h-96 md:h-[500px] lg:h-[550px] overflow-hidden rounded-2xl shadow-lg cursor-ew-resize select-none bg-white"
        onClick={handleClick}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* Before Image (full width) */}
        <div className="absolute inset-0">
          <Image
            src={beforeImage}
            alt={`${altText} - Before`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          {/* "BEFORE" Label - Clean & Elegant */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 md:top-6 md:left-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md"
          >
            <span className="text-[#434E54] text-xs md:text-sm font-semibold tracking-wide">BEFORE</span>
          </motion.div>
        </div>

        {/* After Image (clipped based on slider position) */}
        <div
          className="absolute inset-0 transition-all duration-75"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <Image
            src={afterImage}
            alt={`${altText} - After`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          {/* "AFTER" Label - Clean & Elegant with Sparkle */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 md:top-6 md:right-6 bg-[#434E54] px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
          >
            <span className="text-white text-xs md:text-sm font-semibold tracking-wide">AFTER</span>
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FFE66D]" />
          </motion.div>
        </div>

        {/* Slider Handle - Clean & Elegant */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white/30 backdrop-blur-sm cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* Handle Circle */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-[#434E54] transition-transform"
          >
            <MoveHorizontal className="w-5 h-5 md:w-6 md:h-6 text-[#434E54]" strokeWidth={2.5} />
          </motion.div>
        </div>

        {/* Instructions Overlay - Clean & Elegant */}
        {!isDragging && sliderPosition === 50 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-[#434E54]/90 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg text-xs md:text-sm font-medium pointer-events-none"
          >
            <span className="flex items-center gap-2">
              <MoveHorizontal className="w-4 h-4" />
              <span>Drag to compare</span>
            </span>
          </motion.div>
        )}
      </div>

      {/* Caption - Clean & Elegant */}
      {(petName || description) && (
        <div className="mt-6 text-center">
          {petName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block bg-gradient-to-br from-[#F8EEE5] to-white border border-gray-200 rounded-xl px-6 py-3 shadow-md"
            >
              <h3 className="font-bold text-[#434E54] text-lg md:text-xl">{petName}</h3>
            </motion.div>
          )}
          {description && (
            <p className="text-[#6B7280] text-sm md:text-base mt-3 max-w-md mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
