'use client';

/**
 * Hero section for marketing homepage
 * Features a modern split layout with the main dog hero and lobby showcase
 * Clean & Elegant Professional design with organic shapes and soft animations
 */

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock } from 'lucide-react';

interface HeroSectionProps {
  headline: string;
  tagline: string;
  imageUrl: string;
}

export function HeroSection({ headline, tagline, imageUrl }: HeroSectionProps) {
  const router = useRouter();

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-[#F8EEE5]">
      {/* Organic blob shape background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-10">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#434E54"
            d="M43.3,-66.3C56.2,-58.5,67.1,-46.3,73.4,-31.8C79.7,-17.3,81.4,-0.5,78.8,15.3C76.2,31.1,69.3,45.9,58.4,56.4C47.5,66.9,32.6,73.1,16.8,75.8C1,78.5,-15.7,77.7,-30.5,72.1C-45.3,66.5,-58.2,56.1,-67.3,42.8C-76.4,29.5,-81.7,13.3,-81.4,-3C-81.1,-19.3,-75.2,-35.7,-64.8,-47.5C-54.4,-59.3,-39.5,-66.5,-24.8,-73.3C-10.1,-80.1,4.4,-86.5,18.8,-85.4C33.2,-84.3,47.5,-75.7,43.3,-66.3Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Column - Content */}
          <motion.div
            className="space-y-8 lg:pr-8"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.2 }}
          >
            {/* Main Headline */}
            <motion.div
              className="space-y-4"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#434E54] leading-tight">
                Puppy Day
              </h1>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#434E54]">
                {headline}
              </p>
              <p className="text-lg sm:text-xl text-[#6B7280] max-w-xl">
                {tagline}
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <button
                onClick={() => router.push('/booking')}
                className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Book Appointment
              </button>
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn bg-white hover:bg-[#FFFBF7] text-[#434E54] border border-gray-200 px-8 py-4 text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                View Services
              </button>
            </motion.div>

            {/* Business Info Cards */}
            <motion.div
              className="grid sm:grid-cols-3 gap-4 pt-4"
              variants={fadeIn}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#434E54] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#6B7280] font-medium mb-1">Location</p>
                    <p className="text-sm text-[#434E54] leading-snug">La Mirada, CA</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#434E54] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#6B7280] font-medium mb-1">Call Us</p>
                    <p className="text-sm text-[#434E54] leading-snug">(657) 252-2903</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#434E54] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#6B7280] font-medium mb-1">Hours</p>
                    <p className="text-sm text-[#434E54] leading-snug">Mon-Sat 9AM-5PM</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Images */}
          <motion.div
            className="relative"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.15, delayChildren: 0.3 }}
          >
            {/* Main Dog Image - Large circular frame */}
            <motion.div
              className="relative z-10"
              variants={scaleIn}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Soft circular background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#EAE0D5] to-white rounded-full blur-3xl opacity-60 scale-110"></div>

                {/* Main circular image container */}
                <div className="relative w-full h-full bg-white rounded-full p-6 shadow-2xl overflow-hidden">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#FFFBF7] to-white">
                    <Image
                      src="/images/main-dog-hero.png"
                      alt="Happy dog at Puppy Day grooming"
                      fill
                      className="object-cover object-center"
                      priority
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Lobby Image - Floating card overlay */}
            <motion.div
              className="absolute -bottom-8 -left-8 lg:-left-16 w-64 sm:w-72 z-20"
              variants={scaleIn}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src="/images/puppyday-lobby.jpg"
                    alt="Puppy Day grooming lobby"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 bg-gradient-to-br from-white to-[#FFFBF7]">
                  <p className="text-sm font-semibold text-[#434E54] mb-1">Our Facility</p>
                  <p className="text-xs text-[#6B7280]">Clean, modern, and welcoming environment for your furry friends</p>
                </div>
              </div>
            </motion.div>

            {/* Decorative accent blob */}
            <motion.div
              className="absolute top-1/4 -right-12 w-32 h-32 opacity-20 hidden lg:block"
              variants={fadeIn}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="#434E54"
                  d="M47.1,-59.7C59.1,-49.1,65.7,-32.7,68.4,-16.1C71.1,0.5,69.9,17.3,62.4,30.8C54.9,44.3,41.1,54.5,26.3,60.1C11.5,65.7,-4.3,66.7,-19.5,63.2C-34.7,59.7,-49.3,51.7,-58.7,39.3C-68.1,26.9,-72.3,10.1,-70.6,-5.8C-68.9,-21.7,-61.3,-36.7,-49.8,-47.1C-38.3,-57.5,-23.9,-63.3,-8.4,-63.8C7.1,-64.3,35.1,-70.3,47.1,-59.7Z"
                  transform="translate(100 100)"
                />
              </svg>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Subtle scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1, repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="w-6 h-10 border-2 border-[#434E54] rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-[#434E54] rounded-full"></div>
        </div>
      </motion.div>
    </section>
  );
}
