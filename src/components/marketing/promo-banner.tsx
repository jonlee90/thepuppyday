'use client';

/**
 * Promotional banner component with carousel and dismiss functionality
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { PromoBanner as PromoBannerType } from '@/types/database';

interface PromoBannerProps {
  banners: PromoBannerType[];
}

export function PromoBanner({ banners }: PromoBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if banner was dismissed in this session
    const isDismissed = sessionStorage.getItem('promo_banner_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }

    // Auto-rotate banners if multiple exist
    if (banners.length > 1 && !dismissed) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [banners.length, dismissed]);

  const handleDismiss = () => {
    sessionStorage.setItem('promo_banner_dismissed', 'true');
    setDismissed(true);
  };

  const handleBannerClick = (banner: PromoBannerType) => {
    if (banner.click_url) {
      if (banner.click_url.startsWith('http')) {
        window.open(banner.click_url, '_blank', 'noopener,noreferrer');
      } else {
        router.push(banner.click_url);
      }
    }
  };

  if (dismissed || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative bg-primary text-white"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Banner Content */}
            <div
              className={`flex-1 text-center ${
                currentBanner.click_url ? 'cursor-pointer' : ''
              }`}
              onClick={() => handleBannerClick(currentBanner)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Banner Image (if provided) */}
                  {currentBanner.image_url && (
                    <div className="mb-2 relative h-12 w-auto">
                      <Image
                        src={currentBanner.image_url}
                        alt={currentBanner.alt_text || 'Promotional banner'}
                        width={200}
                        height={48}
                        className="mx-auto object-contain"
                        priority
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                    <span className="font-semibold text-sm sm:text-base">
                      {currentBanner.alt_text}
                    </span>

                    {currentBanner.click_url && (
                      <button className="btn btn-sm btn-secondary">
                        Learn More
                        <svg
                          className="w-4 h-4 ml-1"
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
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
              aria-label="Close banner"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Indicators for multiple banners */}
          {banners.length > 1 && (
            <div className="flex justify-center gap-1 mt-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
