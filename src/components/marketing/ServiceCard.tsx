'use client';

/**
 * Service card component - Clean & Elegant Professional style
 * Displays service with size-based pricing for Basic/Premium or individual add-on pricing
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingModalStore } from '@/hooks/useBookingModal';
import { Scissors, Sparkles, Check, ChevronDown } from 'lucide-react';
import type { Service } from '@/types/database';
import type { LucideIcon } from 'lucide-react';
import { IconBox } from '@/components/ui/IconBox';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';

interface ServiceCardProps {
  service: Service | 'add-ons-info'; // Can be a Service object or special add-ons identifier
  onLearnMore?: () => void;
  isFeatured?: boolean;
  addons?: Array<{ id: string; name: string; price: number }>;
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

export function ServiceCard({ service, onLearnMore, isFeatured = false, addons }: ServiceCardProps) {
  const openModal = useBookingModalStore((state) => state.openModal);
  const [isIncludedExpanded, setIsIncludedExpanded] = useState(false);

  // Check if this is the special add-ons info card
  const isAddOnsInfoCard = service === 'add-ons-info';

  // Determine which service type this is
  let serviceType: 'basic' | 'premium' | 'addons' = 'basic';
  let serviceName = '';
  let serviceDescription = '';
  let serviceId = '';
  let dynamicPriceRanges: Array<{ size: string; weight: string; price: number }> | undefined;

  if (isAddOnsInfoCard) {
    serviceType = 'addons';
    serviceName = 'Add-On Services';
    serviceDescription = 'Enhance your grooming experience with our premium add-ons';
  } else {
    serviceName = service.name.toLowerCase();
    serviceDescription = service.description || '';
    serviceId = service.id;

    if (serviceName.includes('premium')) {
      serviceType = 'premium';
    } else if (serviceName.includes('add')) {
      serviceType = 'addons';
    }
    serviceName = service.name;

    // Convert database prices to display format
    if (service.prices && service.prices.length > 0) {
      const sizeLabels: Record<string, { label: string; weight: string }> = {
        small: { label: 'Small', weight: '0-18 lbs' },
        medium: { label: 'Medium', weight: '19-35 lbs' },
        large: { label: 'Large', weight: '36-65 lbs' },
        xlarge: { label: 'X-Large', weight: '66+ lbs' },
      };

      dynamicPriceRanges = service.prices
        .sort((a, b) => {
          const sizeOrder = ['small', 'medium', 'large', 'xlarge'];
          return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
        })
        .map((price) => ({
          size: sizeLabels[price.size]?.label || price.size,
          weight: sizeLabels[price.size]?.weight || '',
          price: price.price,
        }));
    }
  }

  const data = SERVICE_DATA[serviceType];
  const Icon = data.icon;

  // Use database prices if available, otherwise fall back to hardcoded data
  const priceRanges = dynamicPriceRanges || data.priceRanges;

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
            <IconBox size="lg" rounded="2xl" gradient={data.gradient} shadow>
              <Icon className={`w-10 h-10 ${serviceType === 'premium' ? 'text-white' : 'text-[#434E54]'}`} strokeWidth={2} />
            </IconBox>
          </div>

          {/* Service Name */}
          <h3 className="text-2xl font-bold text-[#434E54] text-center mb-3">
            {serviceName}
          </h3>

          {/* Service Description */}
          <p className="text-[#6B7280] text-center text-sm mb-6">
            {serviceDescription}
          </p>
        </div>



        {/* Details Section (Flexible, takes remaining space) */}
        <div className="flex-grow mb-6 pb-6 border-t border-gray-200 pt-6">
          {/* Size Breakdown for Basic/Premium */}
          {priceRanges && priceRanges.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-bold text-[#434E54] text-sm mb-4 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                <span>Pricing by Size</span>
              </h4>
              {priceRanges.map((range, idx) => (
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
          {(addons ?? ('addonServices' in data ? data.addonServices : []))?.map((addon, idx) => (
            <div
              key={'id' in addon ? addon.id : idx}
              className="flex items-center justify-between bg-[#F8EEE5]/50 rounded-xl px-4 py-3 mb-2"
            >
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#434E54] flex-shrink-0" />
                <span className="font-medium text-[#434E54] text-sm">{addon.name}</span>
              </div>
              <div className="text-lg font-bold text-[#434E54]">
                {'priceRange' in addon && addon.priceRange ? `$${addon.priceRange}` : `$${addon.price}`}
              </div>
            </div>
          ))}

          {/* What's Included - Collapsible (Basic/Premium only) */}
          {serviceType !== 'addons' && (
            <div className="mt-6">
              <button
                onClick={() => setIsIncludedExpanded(!isIncludedExpanded)}
                className="w-full flex items-center justify-between font-bold text-[#434E54] text-sm mb-4 hover:text-[#363F44] transition-colors duration-200 cursor-pointer"
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
          )}
        </div>

        {/* CTA Button - Fixed at bottom */}
        <div className="flex-shrink-0 mt-auto">
          <MarketingCTA
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              openModal({ mode: 'customer', preSelectedServiceId: serviceId, initialStep: 1 });
            }}
            className={!isFeatured ? 'bg-gradient-to-r from-[#434E54] to-[#5A6670]' : undefined}
          >
            Book This Service
          </MarketingCTA>
        </div>
      </div>
    </motion.div>
  );
}
