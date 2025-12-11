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
  const { selectedServiceId, selectService, nextStep } = useBookingStore();

  // Pre-select service if provided
  useEffect(() => {
    if (preSelectedServiceId && !selectedServiceId && services.length > 0) {
      const preSelected = services.find((s) => s.id === preSelectedServiceId);
      if (preSelected) {
        selectService(preSelected);
      }
    }
  }, [preSelectedServiceId, selectedServiceId, services, selectService]);

  const handleSelectService = (service: ServiceWithPrices) => {
    selectService(service);
  };

  const handleContinue = () => {
    if (selectedServiceId) {
      nextStep();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select a Service</h2>
          <p className="text-[#6B7280]">Choose the grooming service for your pet</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select a Service</h2>
          <p className="text-[#6B7280]">Choose the grooming service for your pet</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#EF4444]"
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
          <p className="text-[#6B7280] mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#363F44] transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select a Service</h2>
          <p className="text-[#6B7280]">Choose the grooming service for your pet</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#6B7280]"
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
          <p className="text-[#6B7280]">
            We&apos;re currently updating our services. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select a Service</h2>
        <p className="text-[#6B7280]">Choose the grooming service for your pet</p>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedServiceId === service.id}
            onSelect={() => handleSelectService(service)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          disabled={!selectedServiceId}
          className="btn btn-primary btn-lg"
        >
          Continue
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
