/**
 * Services section — renamed from service-grid.tsx for consistency
 * Owns its section wrapper and uses SectionHeader
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ServiceCard } from './ServiceCard';
import type { Service } from '@/types/database';

interface ServiceSectionProps {
  services: Service[];
  addons: Array<{ id: string; name: string; price: number }>;
}

export function ServiceSection({ services, addons }: ServiceSectionProps) {
  // Filter to show only Basic and Premium services (not database add-ons)
  const groomingServices = services
    .filter((service) => {
      const name = service.name.toLowerCase();
      return name.includes('basic') || name.includes('premium');
    })
    .slice(0, 2);

  // Always include the hardcoded add-ons info card
  const displayServices: Array<Service | 'add-ons-info'> = [
    ...groomingServices,
    'add-ons-info',
  ];

  // Determine which service is featured (Premium)
  const featuredIndex = groomingServices.findIndex((s) =>
    s.name.toLowerCase().includes('premium')
  );

  return (
    <section id="services" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Our Services"
          subtitle="Professional grooming services tailored to your pet's needs"
          className="mb-12"
        />

        {groomingServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-8 shadow-md max-w-md mx-auto">
              <p className="text-[#6B7280]">No services available at this time.</p>
              <p className="text-sm text-[#6B7280] mt-2">Check back soon for our grooming services!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {displayServices.map((service, index) => (
              <ServiceCard
                key={service === 'add-ons-info' ? 'add-ons-info' : service.id}
                service={service}
                isFeatured={index === featuredIndex}
                addons={service === 'add-ons-info' ? addons : undefined}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-[#434E54] hover:text-[#C67C4E] font-semibold transition-colors duration-200"
          >
            View All Services
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
