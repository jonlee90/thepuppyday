/**
 * About section component - Clean & Elegant Professional style
 * Showcases core service offerings with professional design
 */

'use client';

import { motion } from 'framer-motion';
import { Scissors, Sparkles, Bath, Heart } from 'lucide-react';

interface AboutSectionProps {
  title: string;
  description: string;
  differentiators: string[];
}

// Service offerings with Lucide icons
const services = [
  {
    icon: Scissors,
    title: 'Custom Styling',
    description: 'Transform your dog\'s look with our expert styling services. Our professional groomers create personalized styles that perfectly match your pet\'s unique personality and breed characteristics.',
  },
  {
    icon: Bath,
    title: 'Bath & Tidy Up',
    description: 'Perfect for a quick refresh between full grooms. Includes a deep cleansing bath, thorough blow-dry, gentle brushing, and precise trimming around the face, paws, and sanitary areas.',
  },
  {
    icon: Sparkles,
    title: 'Full Grooming',
    description: 'The ultimate pampering experience for your furry friend. Complete with a luxurious bath, thorough brush-out, nail trim, ear cleaning, and a tailored haircut using premium hypoallergenic products for sensitive skin.',
  },
  {
    icon: Heart,
    title: 'Day Care',
    description: 'Give your dog a fun, safe, and social adventure with our supervised day care. Features engaging playtime, social interaction with other friendly pups, and attentive care—perfect for keeping your pet happy while you\'re away!',
  },
];

export function AboutSection({ title, description }: AboutSectionProps) {
  return (
    <section id="about" className="py-20 md:py-28 bg-gradient-to-b from-[#EAE0D5] to-[#FFFBF7]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-4">
              {title}
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-[#434E54] to-[#434E54]/30 rounded-full mx-auto mb-6"></div>
            <p className="text-lg text-[#6B7280] leading-relaxed max-w-3xl mx-auto">
              {description}
            </p>
          </motion.div>

          {/* Service Offerings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full border border-gray-100">
                    {/* Icon */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#EAE0D5] to-[#DCD2C7] rounded-xl flex items-center justify-center shadow-sm">
                        <Icon className="w-7 h-7 text-[#434E54]" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#434E54] mb-2">
                          {service.title}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[#6B7280] leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Location Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 bg-white px-8 py-4 rounded-xl shadow-md border border-gray-100">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EAE0D5] to-[#DCD2C7] rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#434E54]"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <span className="font-semibold text-[#434E54] text-lg">
                Proudly Serving La Mirada, CA
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
