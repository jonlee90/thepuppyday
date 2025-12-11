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
      {/* Header with dog theme */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute -top-2 -right-2 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Select a Service</h2>
        </div>
        <p className="text-[#6B7280] leading-relaxed">Choose the perfect grooming experience for your furry friend</p>
      </div>

      {/* Helpful tip banner */}
      <div className="bg-gradient-to-r from-[#FFFBF7] to-[#F8EEE5] border border-[#EAE0D5] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#FFB347]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-[#FFB347]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#434E54] mb-1">First time here?</p>
            <p className="text-xs text-[#6B7280] leading-relaxed">All our services include a complimentary nail trim and ear cleaning. Your pup will leave looking and feeling their best!</p>
          </div>
        </div>
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
          className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg
                   hover:bg-[#363F44] transition-all duration-200 shadow-md hover:shadow-lg
                   disabled:bg-[#6B7280] disabled:cursor-not-allowed disabled:opacity-50
                   flex items-center gap-2 group"
        >
          Continue to Pet Selection
          <svg
            className="w-5 h-5 transition-transform group-hover:translate-x-1"
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
