'use client';

/**
 * Hook for fetching active add-ons with upsell filtering
 * Supports both mock mode and Supabase integration
 */

import { useState, useEffect, useCallback } from 'react';
import { getMockStore } from '@/mocks/supabase/store';
import { config } from '@/lib/config';
import { fetchBreedsOnce, getCachedBreeds, clearBreedsCache as clearBreedsCacheShared } from '@/lib/cache/breedsCache';
import type { Addon, Breed } from '@/types/database';

export interface UseAddonsReturn {
  addons: Addon[];
  isLoading: boolean;
  error: Error | null;
  getUpsellAddons: (breedId: string | null) => Addon[];
}

// Module-level cache for addons (breeds shared via breedsCache module) —
// prevents duplicate /api/addons fetches when multiple components mount simultaneously.
let _addonsCache: Addon[] | null = null;
let _addonsFetchPromise: Promise<Addon[]> | null = null;

/** Clear the addons and breeds caches (e.g. after admin creates/updates/deletes an addon) */
export function clearAddonsCache() {
  _addonsCache = null;
  _addonsFetchPromise = null;
  clearBreedsCacheShared();
}

async function fetchAddonsOnce(): Promise<Addon[]> {
  if (_addonsCache) return _addonsCache;
  if (_addonsFetchPromise) return _addonsFetchPromise;

  _addonsFetchPromise = (async () => {
    if (config.useMocks) {
      const store = getMockStore();
      const addonsData = store.select('addons', {
        column: 'is_active',
        value: true,
        order: { column: 'display_order', ascending: true },
      }) as unknown as Addon[];
      _addonsCache = addonsData;
      // Warm the shared breeds cache in mock mode too
      await fetchBreedsOnce();
      return addonsData;
    } else {
      // Fetch addons + breeds in parallel; breeds populates the shared cache
      const [addonsResponse] = await Promise.all([
        fetch('/api/addons'),
        fetchBreedsOnce(),
      ]);
      if (!addonsResponse.ok) throw new Error(`Failed to fetch add-ons: ${addonsResponse.statusText}`);
      const addonsJson = await addonsResponse.json();
      const addonsData: Addon[] = addonsJson.addons || [];
      _addonsCache = addonsData;
      return addonsData;
    }
  })().finally(() => {
    _addonsFetchPromise = null;
  });

  return _addonsFetchPromise;
}

/**
 * Fetch active add-ons and provide upsell filtering.
 * Results are cached at module scope — only one network request is made
 * regardless of how many components call this hook simultaneously.
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
  const [addons, setAddons] = useState<Addon[]>(() => _addonsCache ?? []);
  const [isLoading, setIsLoading] = useState(!_addonsCache);
  const [error, setError] = useState<Error | null>(null);
  const [breeds, setBreeds] = useState<Breed[]>(() => getCachedBreeds() ?? []);

  useEffect(() => {
    if (_addonsCache && getCachedBreeds()) return; // Already cached

    let cancelled = false;

    fetchAddonsOnce()
      .then((addonsData) => {
        if (!cancelled) {
          setAddons(addonsData);
          // Breeds are populated in the shared cache by fetchAddonsOnce
          const breedsData = getCachedBreeds() ?? [];
          setBreeds(breedsData);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[useAddons] Error fetching data:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
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
        return addons.filter((addon) => addon.upsell_breeds.length === 0);
      }

      const breed = breeds.find((b) => b.id === breedId);
      if (!breed) {
        return addons.filter((addon) => addon.upsell_breeds.length === 0);
      }

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
