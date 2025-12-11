/**
 * Service grid component for displaying grooming services
 * Clean & Elegant Professional design - Shows only 3 main services
 */

import { ServiceCard } from './service-card';
import type { Service } from '@/types/database';

interface ServiceGridProps {
  services: Service[];
}

export function ServiceGrid({ services }: ServiceGridProps) {
  // Filter to show only Basic, Premium, and Add-ons services
  const displayServices = services.filter((service) => {
    const name = service.name.toLowerCase();
    return name.includes('basic') || name.includes('premium') || name.includes('add');
  }).slice(0, 3); // Ensure we only show 3 services

  if (displayServices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-2xl p-8 shadow-md max-w-md mx-auto">
          <p className="text-[#6B7280]">No services available at this time.</p>
          <p className="text-sm text-[#6B7280] mt-2">Check back soon for our grooming services!</p>
        </div>
      </div>
    );
  }

  // Determine which service is featured (Premium)
  const featuredIndex = displayServices.findIndex((s) =>
    s.name.toLowerCase().includes('premium')
  );

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-4">
          Our Services
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-[#434E54] to-[#434E54]/30 rounded-full mx-auto mb-6"></div>
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
          Professional grooming services tailored to your pet's needs
        </p>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
        {displayServices.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            isFeatured={index === featuredIndex}
          />
        ))}
      </div>
    </div>
  );
}
