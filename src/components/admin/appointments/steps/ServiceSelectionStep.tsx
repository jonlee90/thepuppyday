/**
 * Service Selection Step
 * Task 0016: Display services and addons with real-time price calculation
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import type { ManualAppointmentState, SelectedService, SelectedAddon } from '@/types/admin-appointments';
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
  onNext,
}: ServiceSelectionStepProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    state.selectedService?.id || null
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(
    state.selectedAddons.map((a) => a.id) || []
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

  // Handle next button
  const handleNext = useCallback(() => {
    if (state.selectedService) {
      onNext();
    }
  }, [state.selectedService, onNext]);

  const canProceed = state.selectedService !== null;

  return (
    <div className="space-y-6">
      {/* Services Section */}
      <div>
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Select Service <span className="text-red-500">*</span>
        </label>

        {isLoadingServices ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md text-[#434E54]"></span>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((service) => {
              const price = getServicePrice(service);
              const isSelected = selectedServiceId === service.id;

              return (
                <label
                  key={service.id}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#434E54]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={service.id}
                    checked={isSelected}
                    onChange={() => handleSelectService(service)}
                    className="radio radio-sm radio-primary mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-[#434E54]">{service.name}</div>
                        <p className="text-sm text-[#6B7280] mt-1">{service.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54]">
                            {formatDuration(service.duration_minutes)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-[#434E54]">{formatCurrency(price)}</div>
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
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md text-[#434E54]"></span>
          </div>
        ) : (
          <div className="space-y-2">
            {addons.map((addon) => {
              const isSelected = selectedAddonIds.includes(addon.id);

              return (
                <label
                  key={addon.id}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#434E54]/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleAddon(addon)}
                    className="checkbox checkbox-sm checkbox-primary mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-[#434E54]">{addon.name}</div>
                        <p className="text-sm text-[#6B7280] mt-1">{addon.description}</p>
                      </div>
                      <div className="text-right ml-4">
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

      {/* Price Breakdown */}
      {state.selectedService && (
        <div className="p-6 bg-[#FFFBF7] rounded-xl border border-gray-200">
          <h3 className="font-semibold text-[#434E54] mb-4">Price Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">{state.selectedService.name}</span>
              <span className="font-medium text-[#434E54]">
                {formatCurrency(priceBreakdown.servicePrice)}
              </span>
            </div>

            {state.selectedAddons.length > 0 && (
              <>
                <div className="divider my-2"></div>
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

            <div className="divider my-2"></div>
            <div className="flex justify-between font-bold text-lg">
              <span className="text-[#434E54]">Total</span>
              <span className="text-[#434E54]">{formatCurrency(priceBreakdown.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`btn ${
            canProceed
              ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
              : 'btn-disabled bg-gray-300 text-gray-500'
          }`}
        >
          Next: Select Date & Time
        </button>
      </div>
    </div>
  );
}
