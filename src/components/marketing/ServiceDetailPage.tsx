'use client';

/**
 * Service detail page component — renders full service page content
 * Used by /services/[slug] dynamic route
 */

import { motion } from 'framer-motion';
import { Check, Clock, PawPrint } from 'lucide-react';
import Link from 'next/link';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { FAQAccordion } from './FAQAccordion';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CTABooking } from '@/components/common/CTABooking';
import type { ServiceConfig } from '@/data/services';
import type { ServiceContent } from '@/data/service-content';

interface PriceEntry {
  size: string;
  price: number;
}

interface AddonInfo {
  name: string;
  price: number;
  description: string | null;
}

interface BeforeAfterPair {
  id: string;
  before_image_url: string;
  after_image_url: string;
  pet_name?: string;
  description?: string;
}

interface RelatedService {
  slug: string;
  displayName: string;
}

interface ServiceDetailPageProps {
  config: ServiceConfig;
  content: ServiceContent;
  prices: PriceEntry[];
  addon: AddonInfo | null;
  beforeAfterPairs: BeforeAfterPair[];
  relatedServices: RelatedService[];
  phone: string;
}

const sizeLabels: Record<string, { label: string; weight: string }> = {
  small: { label: 'Small', weight: '0-18 lbs' },
  medium: { label: 'Medium', weight: '19-35 lbs' },
  large: { label: 'Large', weight: '36-65 lbs' },
  xlarge: { label: 'X-Large', weight: '66+ lbs' },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export function ServiceDetailPage({
  config,
  content,
  prices,
  addon,
  beforeAfterPairs,
  relatedServices,
  phone,
}: ServiceDetailPageProps) {
  return (
    <div className="pb-8">
      {/* Hero / Intro */}
      <motion.section className="py-12 md:py-16" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-6">
            {config.h1Title}
          </h1>
          <div className="flex items-center gap-6 text-[#6B7280] mb-8">
            <span className="inline-flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {content.sessionDuration}
            </span>
            {addon ? (
              <span className="text-2xl font-bold text-[#434E54]">
                ${addon.price}
              </span>
            ) : prices.length > 0 ? (
              <span className="text-lg text-[#434E54] font-semibold">
                Starting from ${Math.min(...prices.map((p) => p.price))}
              </span>
            ) : null}
          </div>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            {content.idealFor}
          </p>
        </div>
      </motion.section>

      {/* What's Included */}
      <motion.section className="py-12 bg-white" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl font-bold text-[#434E54] mb-8">
            What&apos;s Included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.whatsIncluded.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#434E54] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span className="text-[#6B7280] leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Benefits */}
      <motion.section className="py-12" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl font-bold text-[#434E54] mb-8">Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {content.benefits.map((benefit) => (
              <div
                key={benefit}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <PawPrint className="w-5 h-5 text-[#C67C4E] flex-shrink-0 mt-1" />
                  <p className="text-[#6B7280] leading-relaxed">{benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing */}
      <motion.section className="py-12 bg-white" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl font-bold text-[#434E54] mb-8">Pricing</h2>
          {addon ? (
            <div className="bg-[#F8EEE5] rounded-xl p-8 text-center max-w-md mx-auto">
              <p className="text-lg text-[#6B7280] mb-2">{addon.name}</p>
              <p className="text-5xl font-bold text-[#434E54] mb-4">
                ${addon.price}
              </p>
              {addon.description ? (
                <p className="text-[#6B7280] text-sm">{addon.description}</p>
              ) : null}
              <p className="text-sm text-[#6B7280] mt-4">
                Available as a standalone service or add-on to any grooming
                package
              </p>
            </div>
          ) : prices.length > 0 ? (
            <div className="max-w-lg mx-auto space-y-3">
              {prices.map((entry) => {
                const label = sizeLabels[entry.size];
                return (
                  <div
                    key={entry.size}
                    className="flex items-center justify-between bg-[#F8EEE5]/50 rounded-xl px-6 py-4"
                  >
                    <div>
                      <div className="font-semibold text-[#434E54]">
                        {label?.label ?? entry.size}
                      </div>
                      {label?.weight ? (
                        <div className="text-sm text-[#6B7280]">
                          {label.weight}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-2xl font-bold text-[#434E54]">
                      ${entry.price}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </motion.section>

      {/* Before/After Gallery */}
      {beforeAfterPairs.length > 0 ? (
        <motion.section className="py-12" {...fadeInUp}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <SectionHeader
              title="Before & After"
              subtitle="See the transformation our grooming makes"
              className="mb-8"
            />
            <div className="space-y-12">
              {beforeAfterPairs.slice(0, 3).map((pair) => (
                <BeforeAfterSlider
                  key={pair.id}
                  beforeImage={pair.before_image_url}
                  afterImage={pair.after_image_url}
                  petName={pair.pet_name}
                  description={pair.description}
                />
              ))}
            </div>
          </div>
        </motion.section>
      ) : null}

      {/* FAQ */}
      {content.faqItems.length > 0 ? (
        <motion.section className="py-12 bg-white" {...fadeInUp}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-[#434E54] mb-8">
              Frequently Asked Questions
            </h2>
            <FAQAccordion items={content.faqItems} includeSchema={false} />
          </div>
        </motion.section>
      ) : null}

      {/* CTA */}
      <CTABooking
        heading={`Book Your ${config.displayName} Today`}
        subheading={`Give your pup the ${config.displayName.toLowerCase()} they deserve. Professional care in a stress-free environment.`}
        phone={phone}
      />

      {/* Related Services */}
      {relatedServices.length > 0 ? (
        <motion.section className="py-12" {...fadeInUp}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-[#434E54] mb-8">
              Related Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedServices.map((rs) => (
                <Link
                  key={rs.slug}
                  href={`/services/${rs.slug}`}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center"
                >
                  <PawPrint className="w-8 h-8 text-[#C67C4E] mx-auto mb-3" />
                  <span className="font-semibold text-[#434E54]">
                    {rs.displayName}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>
      ) : null}
    </div>
  );
}
