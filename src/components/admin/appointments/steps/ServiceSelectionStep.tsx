/**
 * Service Selection Step
 * Task 0016: Display services and addons with real-time price calculation
 * Redesigned with mobile-first, touch-friendly UI matching customer booking flow
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Scissors, Sparkles } from 'lucide-react';
import type { ManualAppointmentState } from '@/types/admin-appointments';
import type { PetSize } from '@/types/database';
import { formatCurrency, formatDuration } from '@/lib/booking/pricing';

interface ServiceSelectionStepProps {
  state: ManualAppointmentState;
  updateState: (updates: Partial<ManualAppointmentState>) => void;
  onNext: () => void;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  prices: {
    size: PetSize;
    price: number;
  }[];
}

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
}

export function ServiceSelectionStep({
  state,
  updateState,
}: ServiceSelectionStepProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    state.selectedService?.id || null
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(
    Array.isArray(state.selectedAddons) ? state.selectedAddons.map((a) => a.id) : []
  );

  // Load services
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      try {
        const response = await fetch('/api/admin/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data.services || []);
        }
      } catch (error) {
        console.error('Fetch services error:', error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Load addons
  useEffect(() => {
    const fetchAddons = async () => {
      setIsLoadingAddons(true);
      try {
        const response = await fetch('/api/admin/addons');
        if (response.ok) {
          const data = await response.json();
          setAddons(data.addons || []);
        }
      } catch (error) {
        console.error('Fetch addons error:', error);
      } finally {
        setIsLoadingAddons(false);
      }
    };

    fetchAddons();
  }, []);

  // Get price for selected pet size
  const getServicePrice = useCallback(
    (service: Service): number => {
      if (!state.selectedPet?.size) return 0;
      const priceEntry = service.prices.find((p) => p.size === state.selectedPet.size);
      return priceEntry?.price || 0;
    },
    [state.selectedPet?.size]
  );

  // Handle service selection
  const handleSelectService = useCallback(
    (service: Service) => {
      const price = getServicePrice(service);
      setSelectedServiceId(service.id);
      updateState({
        selectedService: {
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes,
          price,
        },
      });
    },
    [getServicePrice, updateState]
  );

  // Handle addon toggle
  const handleToggleAddon = useCallback(
    (addon: Addon) => {
      const isSelected = selectedAddonIds.includes(addon.id);
      let newSelectedIds: string[];

      if (isSelected) {
        newSelectedIds = selectedAddonIds.filter((id) => id !== addon.id);
      } else {
        newSelectedIds = [...selectedAddonIds, addon.id];
      }

      setSelectedAddonIds(newSelectedIds);

      const selectedAddons = addons
        .filter((a) => newSelectedIds.includes(a.id))
        .map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
        }));

      updateState({ selectedAddons });
    },
    [selectedAddonIds, addons, updateState]
  );

  // Calculate totals
  const priceBreakdown = useMemo(() => {
    const servicePrice = state.selectedService?.price || 0;
    const addonsTotal = state.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const total = servicePrice + addonsTotal;

    return {
      servicePrice,
      addonsTotal,
      total,
    };
  }, [state.selectedService, state.selectedAddons]);

  return (
    <div className="space-y-6">
      {/* Header with icon badge and paw print decoration */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute -top-2 -right-2 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-[#434E54]" />
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Select Service</h2>
        </div>
        <p className="text-[#434E54]/70">Choose the grooming service for this appointment</p>
      </div>

      {/* Services Section */}
      <div>
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Select Service <span className="text-[#EF4444]">*</span>
        </label>

        {isLoadingServices ? (
          <div className="flex justify-center py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-md animate-pulse">
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-[#EAE0D5] rounded w-3/4" />
                    <div className="h-4 bg-[#EAE0D5] rounded w-full" />
                    <div className="h-4 bg-[#EAE0D5] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => {
              const price = getServicePrice(service);
              const isSelected = selectedServiceId === service.id;

              return (
                <label
                  key={service.id}
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                      : 'border-[#E5E5E5] bg-white hover:border-[#434E54]/30 shadow-sm'
                  }`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={service.id}
                    checked={isSelected}
                    onChange={() => handleSelectService(service)}
                    className="radio radio-sm radio-primary mt-1 min-w-[20px]"
                    aria-label={`Select ${service.name}`}
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#434E54]">{service.name}</div>
                        <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">{service.description}</p>
                        <div className="mt-2">
                          <span className="inline-block badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none px-3 py-1 rounded-lg text-xs">
                            {formatDuration(service.duration_minutes)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-lg text-[#434E54]">{formatCurrency(price)}</div>
                        {state.selectedPet && (
                          <div className="text-xs text-[#6B7280] mt-1">
                            for {state.selectedPet.size}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Addons Section */}
      <div>
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Add-ons <span className="text-[#9CA3AF]">(Optional)</span>
        </label>

        {isLoadingAddons ? (
          <div className="flex justify-center py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-md animate-pulse">
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-[#EAE0D5] rounded w-2/3" />
                    <div className="h-4 bg-[#EAE0D5] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addons.map((addon) => {
              const isSelected = selectedAddonIds.includes(addon.id);

              return (
                <label
                  key={addon.id}
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                      : 'border-[#E5E5E5] bg-white hover:border-[#434E54]/30 shadow-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleAddon(addon)}
                    className="checkbox checkbox-sm checkbox-primary mt-1 min-w-[24px] min-h-[24px]"
                    aria-label={`Add ${addon.name}`}
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#434E54]">{addon.name}</div>
                        <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">{addon.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-[#434E54]">
                          {formatCurrency(addon.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Summary */}
      {state.selectedService && (
        <div className="p-6 bg-[#FFFBF7] rounded-xl border border-[#E5E5E5]">
          <h3 className="font-semibold text-[#434E54] mb-4">Price Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">{state.selectedService.name}</span>
              <span className="font-medium text-[#434E54]">
                {formatCurrency(priceBreakdown.servicePrice)}
              </span>
            </div>

            {Array.isArray(state.selectedAddons) && state.selectedAddons.length > 0 && (
              <>
                <div className="border-t border-[#E5E5E5] my-3"></div>
                {state.selectedAddons.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">{addon.name}</span>
                    <span className="font-medium text-[#434E54]">
                      {formatCurrency(addon.price)}
                    </span>
                  </div>
                ))}
              </>
            )}

            <div className="border-t border-[#E5E5E5] my-3"></div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#434E54]">Total</span>
              <span className="font-bold text-xl text-[#434E54]">{formatCurrency(priceBreakdown.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
