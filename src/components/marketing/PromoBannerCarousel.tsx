/**
 * Promotional Banner Carousel Component
 * Task 0179: Banner integration with public marketing site
 *
 * Features:
 * - Display active banners in date range
 * - Auto-rotate carousel every 5 seconds
 * - Navigation dots and prev/next arrows
 * - Click tracking through API endpoint
 * - Impression tracking (increment on view)
 * - Lazy loading for images
 * - Responsive design
 * - Hide if no active banners
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, A11y } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

interface Banner {
  id: string;
  image_url: string;
  alt_text: string | null;
  click_url: string | null;
  display_order: number;
}

interface PromoBannerCarouselProps {
  banners: Banner[];
}

export function PromoBannerCarousel({ banners }: PromoBannerCarouselProps) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const impressionTracked = useRef<Set<string>>(new Set());

  // Filter and sort active banners
  const activeBanners = banners
    .filter((banner) => banner.image_url)
    .sort((a, b) => a.display_order - b.display_order);

  // Hide carousel if no banners
  if (activeBanners.length === 0) {
    return null;
  }

  // Track impression when banner becomes visible
  const trackImpression = async (bannerId: string) => {
    // Only track once per banner per session
    if (impressionTracked.current.has(bannerId)) {
      return;
    }

    try {
      // Track impression by incrementing impression_count
      await fetch(`/api/banners/${bannerId}/impression`, {
        method: 'POST',
      });

      impressionTracked.current.add(bannerId);
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  // Track impression on mount and slide change
  useEffect(() => {
    if (activeBanners.length > 0) {
      trackImpression(activeBanners[activeIndex].id);
    }
  }, [activeIndex, activeBanners]);

  // Handle banner click
  const handleBannerClick = (banner: Banner) => {
    if (!banner.click_url) return;

    // Navigate through tracking endpoint
    window.location.href = `/api/banners/${banner.id}/click`;
  };

  // Single banner - no carousel needed
  if (activeBanners.length === 1) {
    const banner = activeBanners[0];
    return (
      <div className="w-full bg-[#FFFBF7]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div
            className={`relative w-full h-[200px] md:h-[300px] lg:h-[400px] rounded-xl overflow-hidden shadow-md ${
              banner.click_url ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
            }`}
            onClick={() => handleBannerClick(banner)}
          >
            <Image
              src={banner.image_url}
              alt={banner.alt_text || 'Promotional banner'}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
          </div>
        </div>
      </div>
    );
  }

  // Multiple banners - show carousel
  return (
    <div className="w-full bg-[#FFFBF7]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y]}
            spaceBetween={0}
            slidesPerView={1}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={activeBanners.length > 1}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet !bg-[#434E54]/30',
              bulletActiveClass: 'swiper-pagination-bullet-active !bg-[#434E54]',
            }}
            navigation={{
              prevEl: '.banner-prev',
              nextEl: '.banner-next',
            }}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            className="rounded-xl overflow-hidden shadow-md"
          >
            {activeBanners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <div
                  className={`relative w-full h-[200px] md:h-[300px] lg:h-[400px] ${
                    banner.click_url ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => handleBannerClick(banner)}
                >
                  <Image
                    src={banner.image_url}
                    alt={banner.alt_text || 'Promotional banner'}
                    fill
                    className="object-cover"
                    priority={banner.display_order === 0}
                    loading={banner.display_order === 0 ? 'eager' : 'lazy'}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows - Only show if more than 1 banner */}
          {activeBanners.length > 1 && (
            <>
              <button
                className="banner-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#434E54]/50"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-6 h-6 text-[#434E54]" />
              </button>
              <button
                className="banner-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#434E54]/50"
                aria-label="Next banner"
              >
                <ChevronRight className="w-6 h-6 text-[#434E54]" />
              </button>
            </>
          )}
        </div>

        {/* Custom Pagination Styling */}
        <style jsx global>{`
          .swiper-pagination {
            bottom: 12px !important;
          }

          .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
            margin: 0 6px !important;
            transition: all 0.3s ease;
          }

          .swiper-pagination-bullet-active {
            width: 24px;
            border-radius: 5px;
          }

          @media (max-width: 768px) {
            .banner-prev,
            .banner-next {
              display: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
