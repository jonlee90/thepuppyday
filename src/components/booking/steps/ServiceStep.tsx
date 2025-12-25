/**
 * Service selection step for booking wizard
 */

'use client';

import { useEffect } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { ServiceCard } from '../ServiceCard';
import { useServices } from '@/hooks/useServices';
import type { ServiceWithPrices } from '@/types/database';

interface ServiceStepProps {
  preSelectedServiceId?: string;
}

export function ServiceStep({ preSelectedServiceId }: ServiceStepProps) {
  const { services, isLoading, error } = useServices();
  const { selectedServiceId, selectService } = useBookingStore();

  // Filter out "Add-Ons" service - add-ons are handled separately in Step 4
  const bookableServices = services.filter((service) => service.name !== 'Add-Ons');

  // Pre-select service if provided
  useEffect(() => {
    if (preSelectedServiceId && !selectedServiceId && bookableServices.length > 0) {
      const preSelected = bookableServices.find((s) => s.id === preSelectedServiceId);
      if (preSelected) {
        selectService(preSelected);
      }
    }
  }, [preSelectedServiceId, selectedServiceId, bookableServices, selectService]);

  const handleSelectService = (service: ServiceWithPrices) => {
    selectService(service);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-[#434E54]/70">Choose the grooming service for your pet</p>
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md animate-pulse">
                <div className="h-40 bg-[#EAE0D5] rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-[#EAE0D5] rounded w-3/4" />
                  <div className="h-4 bg-[#EAE0D5] rounded w-full" />
                  <div className="h-4 bg-[#EAE0D5] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <p className="text-[#434E54]/70">Choose the grooming service for your pet</p>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#434E54]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#434E54]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">Failed to Load Services</h3>
          <p className="text-[#434E54]/70 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#434E54]/90 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (bookableServices.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-[#434E54]/70">Choose the grooming service for your pet</p>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#434E54]/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">No Services Available</h3>
          <p className="text-[#434E54]/70">
            We&apos;re currently updating our services. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subtitle */}
      <p className="text-[#434E54]/70 leading-relaxed">Choose the perfect grooming experience for your furry friend</p>

      {/* Services grid - Optimized for 2 services */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {bookableServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedServiceId === service.id}
              onSelect={() => handleSelectService(service)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
