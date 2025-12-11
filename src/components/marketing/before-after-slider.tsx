'use client';

/**
 * Interactive before/after image comparison slider
 */

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

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
      {/* Image Container - Neubrutalism Frame */}
      <div
        ref={containerRef}
        className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-3xl border-4 border-neutral shadow-[8px_8px_0px_0px_rgba(45,52,54,1)] cursor-ew-resize select-none bg-[#FFFEF9]"
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
          {/* "BEFORE" Label - Neubrutalism Style */}
          <div className="absolute top-6 left-6 bg-[#FF6B6B] text-neutral px-5 py-3 rounded-xl border-3 border-neutral shadow-[4px_4px_0px_0px_rgba(45,52,54,1)] text-sm font-black">
            BEFORE 😢
          </div>
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
          {/* "AFTER" Label - Neubrutalism Style */}
          <div className="absolute top-6 right-6 bg-[#4ECDC4] text-neutral px-5 py-3 rounded-xl border-3 border-neutral shadow-[4px_4px_0px_0px_rgba(45,52,54,1)] text-sm font-black">
            AFTER ✨
          </div>
        </div>

        {/* Slider Handle - Neubrutalism Style */}
        <div
          className="absolute top-0 bottom-0 w-2 bg-neutral cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* Handle Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#FFE66D] rounded-full shadow-[4px_4px_0px_0px_rgba(45,52,54,1)] flex items-center justify-center border-4 border-neutral hover:scale-110 transition-transform">
            {/* Left Arrow */}
            <svg
              className="w-5 h-5 text-neutral absolute left-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
            {/* Right Arrow */}
            <svg
              className="w-5 h-5 text-neutral absolute right-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>

        {/* Instructions Overlay */}
        {!isDragging && sliderPosition === 50 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral text-[#FFFEF9] px-6 py-3 rounded-full border-3 border-[#FFFEF9] shadow-[4px_4px_0px_0px_rgba(255,254,249,1)] text-sm font-black pointer-events-none animate-pulse">
            ← Drag to See Magic →
          </div>
        )}
      </div>

      {/* Caption - Neubrutalism Style */}
      {(petName || description) && (
        <div className="mt-6 text-center">
          {petName && (
            <div className="inline-block bg-[#FFE66D] border-4 border-neutral rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_rgba(45,52,54,1)]">
              <h3 className="font-black text-neutral text-xl">{petName}</h3>
            </div>
          )}
          {description && (
            <p className="text-neutral/80 font-bold text-sm mt-4 max-w-md mx-auto">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
