'use client';

/**
 * Hero section — full-bleed immersive layout
 * Lobby photo as background with gradient overlay, content pinned bottom-left
 */

import { motion } from 'framer-motion';
import { Phone, Star } from 'lucide-react';
import { HeroBookingButton } from '@/components/booking';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import type { HeroContent } from '@/types/settings';

interface HeroSectionProps {
  heroContent: HeroContent;
}

export function HeroSection({ heroContent }: HeroSectionProps) {
  // Get today's day name for hours display
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isWeekday = !['Saturday', 'Sunday'].includes(today);
  const todayHours = isWeekday ? '8 AM – 5 PM' : today === 'Saturday' ? '9 AM – 4 PM' : 'Closed';

  return (
    <section id="home" className="relative min-h-[85vh] flex items-end overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <OptimizedImage
          src="/images/puppyday-lobby-background.png"
          alt="The Puppy Day salon lobby"
          fill
          priority={true}
          quality={75}
          enableBlur={false}
          className="object-cover"
          sizes="100vw"
        />
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Content container */}
      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
            {/* Left — main content */}
            <motion.div
              className="max-w-2xl space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Location badge 
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/90">
                <MapPin className="w-4 h-4" />
                <span>La Mirada, CA</span>
                <span className="w-px h-3.5 bg-white/30" />
                <span>{today} {todayHours}</span>
              </div>
*/}
              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
                {heroContent.headline}
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-xl">
                {heroContent.subheadline}
              </p>

              {/* Trust signals */}
              <div className="flex items-center gap-2 text-white/90">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-medium">5.0 on Yelp</span>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span className="text-sm">100+ happy pups</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {heroContent.cta_buttons.map((button, index) => {
                  const isBookingButton = button.style === 'primary' &&
                    (button.url === '#book' || button.text.toLowerCase().includes('book'));

                  if (isBookingButton) {
                    return (
                      <HeroBookingButton
                        key={index}
                        id="hero-book-btn"
                        className="border-[#F8EEE5]/30 border"
                      />
                    );
                  }

                  // Anchor link — smooth scroll
                  if (button.url.startsWith('#')) {
                    return (
                      <MarketingCTA
                        key={index}
                        as="scroll"
                        href={button.url}
                        variant="light"
                      >
                        {button.text}
                      </MarketingCTA>
                    );
                  }

                  // Regular link
                  return (
                    <MarketingCTA
                      key={index}
                      as="link"
                      href={button.url}
                      variant="light"
                    >
                      {button.text.toLowerCase().includes('call') && (
                        <Phone className="w-5 h-5" strokeWidth={2} />
                      )}
                      {button.text}
                    </MarketingCTA>
                  );
                })}
              </div>
            </motion.div>

            {/* Right — floating testimonial card (desktop only) 
            <motion.div
              className="hidden lg:block shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#434E54]">
                      &ldquo;Best dog grooming in La Mirada!&rdquo;
                    </p>
                    <p className="text-sm text-[#6B7280]">&mdash; Sarah M.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            */}
          </div>
        </div>
      </div>
    </section>
  );
}
