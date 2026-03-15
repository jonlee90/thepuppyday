'use client';

/**
 * Hook for fetching active services with prices
 * Supports both mock mode and Supabase integration
 */

import { useState, useEffect, useCallback } from 'react';
import { getMockStore } from '@/mocks/supabase/store';
import { config } from '@/lib/config';
import type { Service, ServicePrice, ServiceWithPrices } from '@/types/database';

export interface UseServicesReturn {
  services: ServiceWithPrices[];
  isLoading: boolean;
  error: Error | null;
  getServiceById: (id: string) => ServiceWithPrices | undefined;
}

// Module-level cache shared across all hook instances — prevents duplicate
// /api/services fetches when multiple components mount simultaneously.
let _servicesCache: ServiceWithPrices[] | null = null;
let _servicesFetchPromise: Promise<ServiceWithPrices[]> | null = null;

/** Clear the services cache (e.g. after admin creates/updates/deletes a service) */
export function clearServicesCache() {
  _servicesCache = null;
  _servicesFetchPromise = null;
}

async function fetchServicesOnce(): Promise<ServiceWithPrices[]> {
  if (_servicesCache) return _servicesCache;
  if (_servicesFetchPromise) return _servicesFetchPromise;

  _servicesFetchPromise = (async () => {
    if (config.useMocks) {
      const store = getMockStore();
      const servicesData = store.select('services', {
        column: 'is_active',
        value: true,
        order: { column: 'display_order', ascending: true },
      }) as unknown as Service[];
      const allPrices = store.select('service_prices') as unknown as ServicePrice[];
      const result: ServiceWithPrices[] = servicesData.map((service) => ({
        ...service,
        prices: allPrices.filter((price) => price.service_id === service.id),
      }));
      _servicesCache = result;
      return result;
    } else {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error(`Failed to fetch services: ${response.statusText}`);
      const data = await response.json();
      const result: ServiceWithPrices[] = data.services || [];
      _servicesCache = result;
      return result;
    }
  })().finally(() => {
    _servicesFetchPromise = null;
  });

  return _servicesFetchPromise;
}

/**
 * Fetch active services with their size-based prices.
 * Results are cached at module scope — only one network request is made
 * regardless of how many components call this hook simultaneously.
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
  const [services, setServices] = useState<ServiceWithPrices[]>(() => _servicesCache ?? []);
  const [isLoading, setIsLoading] = useState(!_servicesCache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (_servicesCache) return; // Already cached, nothing to do

    let cancelled = false;
    console.log('[useServices] Starting fetch, useMocks:', config.useMocks);

    fetchServicesOnce()
      .then((result) => {
        if (!cancelled) {
          setServices(result);
          console.log('[useServices] Setting services:', result.length);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to fetch services:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
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
