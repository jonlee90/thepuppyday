'use client';

/**
 * Hook for fetching active add-ons with upsell filtering
 * Supports both mock mode and Supabase integration
 */

import { useState, useEffect, useCallback } from 'react';
import { getMockStore } from '@/mocks/supabase/store';
import { config } from '@/lib/config';
import type { Addon, Breed } from '@/types/database';

export interface UseAddonsReturn {
  addons: Addon[];
  isLoading: boolean;
  error: Error | null;
  getUpsellAddons: (breedId: string | null) => Addon[];
}

/**
 * Fetch active add-ons and provide upsell filtering
 *
 * @returns {UseAddonsReturn} Add-ons data with loading, error states, and upsell filtering
 *
 * @example
 * ```tsx
 * const { addons, isLoading, error, getUpsellAddons } = useAddons();
 * const upsellAddons = getUpsellAddons(pet.breed_id);
 *
 * if (isLoading) return <div>Loading add-ons...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     <h3>Recommended for your pet:</h3>
 *     {upsellAddons.map(addon => (
 *       <AddonCard key={addon.id} addon={addon} highlighted />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useAddons(): UseAddonsReturn {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [breeds, setBreeds] = useState<Breed[]>([]);

  useEffect(() => {
    const fetchAddons = async () => {
      console.log('[useAddons] Starting fetch...');
      setIsLoading(true);
      setError(null);

      try {
        if (config.useMocks) {
          console.log('[useAddons] Using mock mode');
          // Fetch from mock store
          const store = getMockStore();

          // Get active add-ons
          const addonsData = store.select('addons', {
            column: 'is_active',
            value: true,
            order: { column: 'display_order', ascending: true },
          }) as unknown as Addon[];

          // Also fetch breeds for matching
          const breedsData = store.select('breeds') as unknown as Breed[];

          console.log('[useAddons] Mock addons loaded:', addonsData.length);
          console.log('[useAddons] Mock breeds loaded:', breedsData.length);
          setAddons(addonsData);
          setBreeds(breedsData);
        } else {
          console.log('[useAddons] Using real Supabase via API routes');

          // Fetch addons from API
          console.log('[useAddons] Fetching from /api/addons...');
          const addonsResponse = await fetch('/api/addons');
          if (!addonsResponse.ok) {
            throw new Error(`Failed to fetch add-ons: ${addonsResponse.statusText}`);
          }
          const addonsJson = await addonsResponse.json();
          console.log('[useAddons] Addons response:', addonsJson);

          // Fetch breeds from API for upsell matching
          console.log('[useAddons] Fetching from /api/breeds...');
          const breedsResponse = await fetch('/api/breeds');
          if (!breedsResponse.ok) {
            throw new Error(`Failed to fetch breeds: ${breedsResponse.statusText}`);
          }
          const breedsJson = await breedsResponse.json();
          console.log('[useAddons] Breeds response:', breedsJson);

          const addonsData = addonsJson.addons || [];
          const breedsData = breedsJson.breeds || [];

          console.log('[useAddons] Addons loaded:', addonsData.length);
          console.log('[useAddons] Breeds loaded:', breedsData.length);
          setAddons(addonsData);
          setBreeds(breedsData);
        }
      } catch (err) {
        console.error('[useAddons] Error fetching data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        console.log('[useAddons] Fetch complete, setting loading to false');
        setIsLoading(false);
      }
    };

    fetchAddons();
  }, []);

  /**
   * Get add-ons that should be upsold for a specific breed
   *
   * @param {string | null} breedId - The breed ID to match against
   * @returns {Addon[]} Add-ons that match the breed's upsell criteria
   */
  const getUpsellAddons = useCallback(
    (breedId: string | null): Addon[] => {
      if (!breedId) {
        // Return add-ons with no breed restrictions
        return addons.filter((addon) => addon.upsell_breeds.length === 0);
      }

      // Find the breed name
      const breed = breeds.find((b) => b.id === breedId);
      if (!breed) {
        return addons.filter((addon) => addon.upsell_breeds.length === 0);
      }

      // Filter add-ons that either:
      // 1. Have no breed restrictions, OR
      // 2. Include this breed in their upsell_breeds list
      return addons.filter(
        (addon) =>
          addon.upsell_breeds.length === 0 ||
          addon.upsell_breeds.some(
            (breedName) => breedName.toLowerCase() === breed.name.toLowerCase()
          )
      );
    },
    [addons, breeds]
  );

  return {
    addons,
    isLoading,
    error,
    getUpsellAddons,
  };
}
