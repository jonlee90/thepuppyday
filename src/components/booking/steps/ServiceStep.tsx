/**
 * Service selection step for booking wizard
 */

'use client';

import { useEffect, useState } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { ServiceCard } from '../ServiceCard';
import { getMockStore } from '@/mocks/supabase/store';
import type { ServiceWithPrices, Service, ServicePrice } from '@/types/database';

interface ServiceStepProps {
  preSelectedServiceId?: string;
}

export function ServiceStep({ preSelectedServiceId }: ServiceStepProps) {
  const [services, setServices] = useState<ServiceWithPrices[]>([]);
  const [loading, setLoading] = useState(true);

  const { selectedServiceId, selectService, nextStep } = useBookingStore();

  // Load services on mount
  useEffect(() => {
    const loadServices = () => {
      const store = getMockStore();
      const servicesData = store.select('services', {
        column: 'is_active',
        value: true,
        order: { column: 'display_order', ascending: true },
      }) as unknown as Service[];

      // Get prices for each service
      const servicesWithPrices: ServiceWithPrices[] = servicesData.map((service) => {
        const prices = store.select('service_prices', {
          column: 'service_id',
          value: service.id,
        }) as unknown as ServicePrice[];
        return { ...service, prices };
      });

      setServices(servicesWithPrices);
      setLoading(false);

      // Pre-select service if provided
      if (preSelectedServiceId && !selectedServiceId) {
        const preSelected = servicesWithPrices.find((s) => s.id === preSelectedServiceId);
        if (preSelected) {
          selectService(preSelected);
        }
      }
    };

    loadServices();
  }, [preSelectedServiceId, selectedServiceId, selectService]);

  const handleSelectService = (service: ServiceWithPrices) => {
    selectService(service);
  };

  const handleContinue = () => {
    if (selectedServiceId) {
      nextStep();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Select a Service</h2>
          <p className="text-base-content/70">Choose the grooming service for your pet</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-base-100 rounded-xl border border-base-300 animate-pulse">
              <div className="h-40 bg-base-300 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-base-300 rounded w-3/4" />
                <div className="h-4 bg-base-300 rounded w-full" />
                <div className="h-4 bg-base-300 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-base-content/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-base-content mb-2">No Services Available</h3>
        <p className="text-base-content/70">
          We&apos;re currently updating our services. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-base-content mb-2">Select a Service</h2>
        <p className="text-base-content/70">Choose the grooming service for your pet</p>
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
