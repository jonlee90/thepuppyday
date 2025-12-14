'use client';

/**
 * Hero section for marketing homepage - Clean & Elegant Professional
 * Simplified design with essential CTAs and business images
 */

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Phone, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PawDecoration from './paw-decoration';
interface HeroSectionProps {
  headline: string;
  tagline: string;
  imageUrl: string;
}

export function HeroSection({ headline, tagline, imageUrl }: HeroSectionProps) {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-[#F8EEE5] via-[#FFFBF7] to-[#F8EEE5] pt-5 mt-[160px] lg:mt-5">
<PawDecoration />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Column - Content with Lobby Background */}
            <motion.div
              className="relative space-y-8 text-center lg:text-left order-2 lg:order-1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Content - positioned above background */}
              <div className="relative z-10">
                {/* Headline */}
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#434E54] mb-6 leading-tight">
                    {headline}
                  </h1>
                  <p className="text-xl sm:text-2xl text-[#6B7280] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {tagline}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">
                  {/* Book Appointment Button */}
                  <a
                    href="#booking"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-[#434E54] rounded-xl shadow-lg hover:bg-[#363F44] hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                  >
                  <Calendar className="w-5 h-5" strokeWidth={2} />
                    Book Appointment
                  </a>

                  {/* Call Button */}
                  <a
                    href="tel:6572522903"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-[#434E54] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200 hover:-translate-y-1 border border-gray-200"
                  >
                    <Phone className="w-5 h-5" strokeWidth={2} />
                    (657) 252-2903
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Blended Dog Image */}
            <motion.div
              className="relative order-1 lg:order-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="relative w-full max-w-md mx-auto lg:max-w-none"
    
              >
                 {/* Main hero image with dog centered in lobby */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl">
              <img
                src={"/images/puppyday-lobby-background.jpg"}
                alt="Adorable groomed dog with bowtie in the Puppy Day salon lobby"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
   
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-hero-overlay/30 to-transparent" />
            </div>
            
            {/* Floating card - repositioned */}
            <div className="mt-5 left-6 w-full lg:w-fit  bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-foreground">"Best dog grooming in La Mirada!"</p>
                  <p className="text-sm font-body text-muted-foreground">— Sarah M.</p>
                </div>
              </div>
            </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
