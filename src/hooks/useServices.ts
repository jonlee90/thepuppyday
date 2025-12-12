'use client';

/**
 * Hook for fetching active services with prices
 * Supports both mock mode and Supabase integration
 */

import { useState, useEffect, useCallback } from 'react';
import { getMockStore } from '@/mocks/supabase/store';
import { createClient } from '@/lib/supabase/client';
import { config } from '@/lib/config';
import type { Service, ServicePrice, ServiceWithPrices } from '@/types/database';

export interface UseServicesReturn {
  services: ServiceWithPrices[];
  isLoading: boolean;
  error: Error | null;
  getServiceById: (id: string) => ServiceWithPrices | undefined;
}

/**
 * Fetch active services with their size-based prices
 *
 * @returns {UseServicesReturn} Services data with loading and error states
 *
 * @example
 * ```tsx
 * const { services, isLoading, error, getServiceById } = useServices();
 *
 * if (isLoading) return <div>Loading services...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {services.map(service => (
 *       <ServiceCard key={service.id} service={service} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<ServiceWithPrices[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (config.useMocks) {
          // Fetch from mock store
          const store = getMockStore();

          // Get active services
          const servicesData = store.select('services', {
            column: 'is_active',
            value: true,
            order: { column: 'display_order', ascending: true },
          }) as unknown as Service[];

          // Get all service prices
          const allPrices = store.select('service_prices') as unknown as ServicePrice[];

          // Combine services with their prices
          const servicesWithPrices: ServiceWithPrices[] = servicesData.map((service) => ({
            ...service,
            prices: allPrices.filter((price) => price.service_id === service.id),
          }));

          setServices(servicesWithPrices);
        } else {
          // Fetch from Supabase
          const supabase = createClient();
          const { data, error: supabaseError } = await (supabase as any)
            .from('services')
            .select('*, prices:service_prices(*)')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (supabaseError) {
            throw new Error(`Failed to fetch services: ${supabaseError.message}`);
          }

          // Transform data to match ServiceWithPrices type
          const servicesWithPrices: ServiceWithPrices[] = (data || []).map((service: any) => ({
            ...service,
            prices: service.prices || [],
          }));

          setServices(servicesWithPrices);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  /**
   * Get a specific service by ID
   */
  const getServiceById = useCallback(
    (id: string): ServiceWithPrices | undefined => {
      return services.find((service) => service.id === id);
    },
    [services]
  );

  return {
    services,
    isLoading,
    error,
    getServiceById,
  };
}
