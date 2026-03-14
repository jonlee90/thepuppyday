'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, MapPin, Clock, ArrowRight } from 'lucide-react';
import { GoogleMapEmbed } from '@/components/common/GoogleMapEmbed';
import { CTABooking } from '@/components/common/CTABooking';
import { SectionHeader } from '@/components/common/SectionHeader';
import type { CityConfig } from '@/data/cities';
import type { CityContent } from '@/data/city-content';
import type { BusinessInfo } from '@/types/settings';

interface CityLandingPageProps {
  cityConfig: CityConfig;
  cityContent: CityContent;
  services: Array<{ name: string; slug: string }>;
  businessInfo: BusinessInfo;
}

const MAP_QUERY = '14936 Leffingwell Rd, La Mirada, CA 90638';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function CityLandingPage({
  cityConfig,
  cityContent,
  services,
  businessInfo,
}: CityLandingPageProps) {
  const isHomeCity = cityConfig.slug === 'la-mirada';

  return (
    <div>
      {/* Hero Section */}
      <motion.section
        className="py-16 md:py-20 bg-[#F8EEE5]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[#C67C4E]" />
            <span className="text-sm font-medium text-[#C67C4E] uppercase tracking-wide">
              {isHomeCity ? 'Our Home Salon' : `Serving ${cityConfig.name}`}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-[#434E54] mb-4 leading-tight">
            {cityConfig.h1Title}
          </h1>
          <p className="text-[#6B7280] text-lg max-w-2xl mx-auto leading-relaxed">
            {isHomeCity
              ? 'Located at 14936 Leffingwell Rd — La Mirada\'s top-rated dog grooming salon.'
              : `Serving ${cityConfig.name} dog owners, just ${cityConfig.distance} from our La Mirada salon.`}
          </p>
        </div>
      </motion.section>

      {/* Intro Section */}
      <motion.section
        className="py-12 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {cityContent.introText.map((paragraph, index) => (
              <p key={index} className="text-[#434E54] text-lg leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Services Section */}
      <motion.section
        className="py-16 bg-[#F8EEE5]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Our Dog Grooming Services"
            subtitle={`Everything your ${cityConfig.name} pup needs — all under one roof.`}
            className="mb-10"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-2"
              >
                <span className="text-[#434E54] font-medium group-hover:text-[#C67C4E] transition-colors">
                  {service.name}
                </span>
                <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#C67C4E] transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us Section */}
      <motion.section
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <SectionHeader
              title={`Why ${cityConfig.name} Dog Owners Choose Puppy Day`}
              className="mb-10"
            />
            <ul className="space-y-4">
              {cityContent.whyChooseUs.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C67C4E] flex-shrink-0 mt-0.5" />
                  <span className="text-[#434E54] text-base leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Directions / Map Section */}
      <motion.section
        className="py-16 bg-[#F8EEE5]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isHomeCity ? (
            <>
              <SectionHeader title="Find Us" className="mb-10" />
              <div className="max-w-3xl mx-auto">
                <GoogleMapEmbed query={MAP_QUERY} className="shadow-md" />
              </div>
            </>
          ) : (
            <>
              <SectionHeader
                title={`How to Get Here from ${cityConfig.name}`}
                className="mb-10"
              />
              <div className="max-w-3xl mx-auto">
                <p className="text-[#434E54] text-lg leading-relaxed mb-4">
                  {cityContent.drivingDirections}
                </p>
                <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm mb-8">
                  <Clock className="w-4 h-4 text-[#C67C4E]" />
                  <span className="text-sm font-medium text-[#434E54]">
                    Estimated drive time: {cityContent.estimatedDriveTime}
                  </span>
                </div>
                <GoogleMapEmbed query={MAP_QUERY} className="shadow-md" />
              </div>
            </>
          )}
        </div>
      </motion.section>

      {/* Nearby Attractions */}
      <motion.section
        className="py-8 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#6B7280] text-sm text-center">
              {'Near '}
              {cityContent.nearbyAttractions.map((attraction, index) => (
                <span key={attraction}>
                  <span className="font-medium text-[#434E54]">{attraction}</span>
                  {index < cityContent.nearbyAttractions.length - 2
                    ? ', '
                    : index === cityContent.nearbyAttractions.length - 2
                      ? ', and '
                      : null}
                </span>
              ))}
            </p>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <CTABooking phone={businessInfo.phone} />
    </div>
  );
}
