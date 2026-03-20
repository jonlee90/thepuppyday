/**
 * About section component - Redesigned with lobby photo and trust signals
 * Features asymmetric photo+text layout with animated stats
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Sparkles, Heart, Clock } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { SectionHeader } from '@/components/common/SectionHeader';
import { IconBox } from '@/components/ui/IconBox';

interface AboutSectionProps {
  title: string;
  description: string;
  showViewAll?: boolean;
}

const stats = [
  { value: 500, suffix: '+', decimals: 0, label: 'Happy Pups Groomed' },
  { value: 5.0, suffix: '', decimals: 1, label: 'Stars on Yelp' },
  { value: 100, suffix: '%', decimals: 0, label: 'Hypoallergenic Products' },
];

const highlights = [
  {
    icon: Sparkles,
    text: 'A brand-new, clean, and modern grooming salon',
  },
  {
    icon: Heart,
    text: 'Gentle, one-on-one care for every pup',
  },
  {
    icon: Clock,
    text: 'No rushing — your dog gets the time they need',
  },
];

export function AboutSection({ title, description, showViewAll = false }: AboutSectionProps) {
  return (
    <section id="about" className="relative py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          <SectionHeader title={title} />

          {/* Main content: Photo left (55%), Text right (45%) */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-10 lg:gap-14 items-center mb-16 lg:mb-20">

            {/* Lobby Photo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(67,78,84,0.15)]">
                  <OptimizedImage
                    src="/images/thepuppyday-front.webp"
                    alt="The Puppy Day salon lobby — a clean, modern waiting area with comfortable seating, plants, and the Puppy Day logo"
                    width={972}
                    height={842}
                    className="w-full aspect-[972/842] object-cover"
                    sizes="(max-width: 768px) 100vw, 55vw"
                  />
                </div>

                {/* Floating accent card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="absolute -bottom-5 -right-3 sm:right-4 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg border border-gray-100/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🐾</span>
                    <div>
                      <p className="text-sm font-semibold text-[#434E54]">Where pups feel at home</p>
                      <p className="text-xs text-[#6B7280]">La Mirada, CA</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Text content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-6"
            >
              <p className="text-lg text-[#6B7280] leading-relaxed">
                {description}
              </p>

              {/* Highlights with icons */}
              <div className="space-y-3 pt-2">
                {highlights.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <IconBox size="sm" rounded="lg">
                        <Icon className="w-4.5 h-4.5 text-[#434E54]" strokeWidth={2} />
                      </IconBox>
                      <span className="text-[#434E54] font-medium text-[15px]">
                        {item.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-[#6B7280] pt-2">
                <MapPin className="w-4.5 h-4.5 text-[#434E54]/60" />
                <span className="text-sm">Proudly serving La Mirada, CA and surrounding areas</span>
              </div>
            </motion.div>
          </div>

          {showViewAll ? (
            <div className="text-center mt-10">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-[#434E54] hover:text-[#C67C4E] font-semibold transition-colors duration-200"
              >
                Learn More About Us
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : null}

        </div>
      </div>
    </section>
  );
}
