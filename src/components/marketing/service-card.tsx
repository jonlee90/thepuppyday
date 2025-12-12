'use client';

/**
 * Service card component - Clean & Elegant Professional style
 * Displays service with size-based pricing for Basic/Premium or individual add-on pricing
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Sparkles, Check, ChevronDown } from 'lucide-react';
import type { Service } from '@/types/database';
import type { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onLearnMore?: () => void;
  isFeatured?: boolean;
}

// Hardcoded service data with pricing by size
const SERVICE_DATA: Record<string, {
  icon: LucideIcon;
  gradient: string;
  priceRanges?: Array<{ size: string; weight: string; price: number }>;
  addonServices?: Array<{ name: string; price?: number; priceRange?: string }>;
  features: string[];
}> = {
  basic: {
    icon: Scissors,
    gradient: 'from-[#EAE0D5] to-[#DCD2C7]',
    priceRanges: [
      { size: 'Small', weight: '0-18 lbs', price: 40 },
      { size: 'Medium', weight: '19-35 lbs', price: 55 },
      { size: 'Large', weight: '36-65 lbs', price: 70 },
      { size: 'X-Large', weight: '66+ lbs', price: 85 },
    ],
    features: [
      'Bath with premium shampoo & conditioner',
      'Thorough brush out & de-shedding',
      'Nail trimming & filing',
      'Ear cleaning & plucking',
      'Anal gland sanitizing',
      'Sanitary & paw pad trim',
    ],
  },
  premium: {
    icon: Sparkles,
    gradient: 'from-[#434E54] to-[#5A6670]',
    priceRanges: [
      { size: 'Small', weight: '0-18 lbs', price: 70 },
      { size: 'Medium', weight: '19-35 lbs', price: 95 },
      { size: 'Large', weight: '36-65 lbs', price: 120 },
      { size: 'X-Large', weight: '66+ lbs', price: 150 },
    ],
    features: [
      'Everything in Basic Groom',
      'Full haircut & breed-specific styling',
      'Paw pad & sanitary trim',
      'Teeth brushing for fresh breath',
      'Finishing cologne spritz',
      'Bandana or bow',
    ],
  },
  addons: {
    icon: Check,
    gradient: 'from-[#FFFBF7] to-[#F8EEE5]',
    addonServices: [
      { name: 'Long Hair / Sporting', price: 10 },
      { name: 'Teeth Brushing', price: 10 },
      { name: 'Pawdicure', price: 15 },
      { name: 'Flea & Tick Treatment', price: 25 },
      { name: 'Tangles / Matting (>20min)', priceRange: '5-30' },
    ],
    features: [
      'Enhance your grooming package',
      'Premium treatments available',
      'Customized for your pet',
      'Professional quality products',
    ],
  },
};

export function ServiceCard({ service, onLearnMore, isFeatured = false }: ServiceCardProps) {
  const router = useRouter();
  const [isIncludedExpanded, setIsIncludedExpanded] = useState(false);

  // Determine which service type this is
  const serviceName = service.name.toLowerCase();
  let serviceType: 'basic' | 'premium' | 'addons' = 'basic';

  if (serviceName.includes('premium')) {
    serviceType = 'premium';
  } else if (serviceName.includes('add')) {
    serviceType = 'addons';
  }

  const data = SERVICE_DATA[serviceType];
  const Icon = data.icon;

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={`bg-white rounded-2xl p-6 md:p-8 h-full flex flex-col shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border ${
          isFeatured ? 'border-[#434E54] ring-2 ring-[#434E54]/20' : 'border-gray-200'
        } relative overflow-hidden`}
      >
        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-0 right-0 bg-[#434E54] text-white px-4 py-1 rounded-bl-xl text-xs font-bold">
            MOST POPULAR
          </div>
        )}

        {/* Fixed Height Header Section */}
        <div className="flex-shrink-0">
          {/* Service Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 bg-gradient-to-br ${data.gradient} rounded-2xl flex items-center justify-center shadow-md`}>
              <Icon className={`w-10 h-10 ${serviceType === 'premium' ? 'text-white' : 'text-[#434E54]'}`} strokeWidth={2} />
            </div>
          </div>

          {/* Service Name */}
          <h3 className="text-2xl font-bold text-[#434E54] text-center mb-3">
            {service.name}
          </h3>

          {/* Service Description */}
          <p className="text-[#6B7280] text-center text-sm mb-6">
            {service.description}
          </p>
        </div>



        {/* Details Section (Flexible, takes remaining space) */}
        <div className="flex-grow mb-6 pb-6 border-t border-gray-200 pt-6">
          {/* Size Breakdown for Basic/Premium */}
          {'priceRanges' in data && data.priceRanges && (
            <div className="space-y-3 mb-6">
              <h4 className="font-bold text-[#434E54] text-sm mb-4 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                <span>Pricing by Size</span>
              </h4>
              {data.priceRanges.map((range, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#F8EEE5]/50 rounded-xl px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-[#434E54] text-sm">{range.size}</div>
                    <div className="text-xs text-[#6B7280]">{range.weight}</div>
                  </div>
                  <div className="text-xl font-bold text-[#434E54]">${range.price}</div>
                </div>
              ))}
            </div>
          )}

          {/* Add-on Services List */}
          {('addonServices' in data ? data.addonServices : [])?.map((addon, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-[#F8EEE5]/50 rounded-xl px-4 py-3 mb-2"
            >
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#434E54] flex-shrink-0" />
                <span className="font-medium text-[#434E54] text-sm">{addon.name}</span>
              </div>
              <div className="text-lg font-bold text-[#434E54]">
                {addon.priceRange ? `$${addon.priceRange}` : `$${addon.price}`}
              </div>
            </div>
          ))}

          {/* What's Included - Collapsible */}
          <div className="mt-6">
            <button
              onClick={() => setIsIncludedExpanded(!isIncludedExpanded)}
              className="w-full flex items-center justify-between font-bold text-[#434E54] text-sm mb-4 hover:text-[#363F44] transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>What&apos;s Included</span>
              </div>
              <motion.div
                animate={{ rotate: isIncludedExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isIncludedExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3">
                    {data.features.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#434E54] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-[#6B7280] text-sm leading-relaxed">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA Button - Fixed at bottom */}
        <div className="flex-shrink-0 mt-auto">
          <button
            className={`w-full px-6 py-4 text-base font-semibold rounded-xl shadow-md transition-all duration-200 ${
              isFeatured
                ? 'bg-[#434E54] text-white hover:bg-[#363F44] hover:shadow-lg'
                : 'bg-gradient-to-r from-[#434E54] to-[#5A6670] text-white hover:shadow-lg'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/booking?service=${service.id}`);
            }}
          >
            Book This Service
          </button>
        </div>
      </div>
    </motion.div>
  );
}
