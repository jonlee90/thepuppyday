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
        {/* Editorial Header Skeleton */}
        <div className="space-y-2">
          <div className="h-9 bg-[#EAE0D5] rounded-lg w-64 animate-pulse" />
          <div className="h-5 bg-[#EAE0D5] rounded-lg w-80 animate-pulse" />
        </div>

        {/* Editorial Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 lg:gap-10">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              {/* Image skeleton - 3:2 aspect */}
              <div className="aspect-[3/2] bg-gradient-to-br from-[#EAE0D5] to-[#F8EEE5]" />

              {/* Content skeleton */}
              <div className="p-6 space-y-4">
                <div className="h-8 bg-[#EAE0D5] rounded-lg w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-[#EAE0D5] rounded w-full" />
                  <div className="h-4 bg-[#EAE0D5] rounded w-5/6" />
                </div>
                <div className="pt-4 mt-4 border-t border-[#434E54]/10">
                  <div className="h-10 bg-[#EAE0D5] rounded-lg w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-[#434E54] tracking-tight">
            Choose Your Service
          </h2>
          <p className="text-[#434E54]/60 leading-relaxed text-base">
            Premium grooming tailored to your pet&apos;s needs
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#F4A261]/20 to-[#434E54]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-[#434E54]/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[#434E54] mb-3">Unable to Load Services</h3>
          <p className="text-[#434E54]/60 mb-6 max-w-md mx-auto leading-relaxed">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-[#434E54] text-white font-semibold py-3 px-6 rounded-lg
                     hover:bg-[#363F44] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (bookableServices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-[#434E54] tracking-tight">
            Choose Your Service
          </h2>
          <p className="text-[#434E54]/60 leading-relaxed text-base">
            Premium grooming tailored to your pet&apos;s needs
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#EAE0D5] to-[#F8EEE5] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-[#434E54]/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[#434E54] mb-3">No Services Available</h3>
          <p className="text-[#434E54]/60 max-w-md mx-auto leading-relaxed">
            We&apos;re currently updating our services. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-[#434E54] tracking-tight">
          Choose Your Service
        </h2>
        <p className="text-[#434E54]/60 leading-relaxed text-base">
          Premium grooming tailored to your pet&apos;s needs
        </p>
      </div>

      {/* Editorial Grid - Optimized for modal width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 lg:gap-10">
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
  );
}
