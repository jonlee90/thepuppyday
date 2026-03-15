/**
 * Module-level breeds cache shared across all components.
 * Prevents duplicate /api/breeds fetches when multiple components
 * mount simultaneously (e.g., booking modal steps).
 * Supports both mock mode and Supabase integration.
 */

import { getMockStore } from '@/mocks/supabase/store';
import { config } from '@/lib/config';
import type { Breed } from '@/types/database';

let _breedsCache: Breed[] | null = null;
let _breedsFetchPromise: Promise<Breed[]> | null = null;

/** Clear the breeds cache (e.g. after admin creates/updates/deletes a breed) */
export function clearBreedsCache() {
  _breedsCache = null;
  _breedsFetchPromise = null;
}

/** Fetch breeds once; all concurrent callers share the same in-flight request */
export async function fetchBreedsOnce(): Promise<Breed[]> {
  if (_breedsCache) return _breedsCache;
  if (_breedsFetchPromise) return _breedsFetchPromise;

  _breedsFetchPromise = (async () => {
    if (config.useMocks) {
      const store = getMockStore();
      const result = store.select('breeds') as unknown as Breed[];
      _breedsCache = result;
      return result;
    } else {
      const res = await fetch('/api/breeds');
      if (!res.ok) throw new Error(`Failed to fetch breeds: ${res.statusText}`);
      const data = await res.json();
      const result: Breed[] = data.breeds || [];
      _breedsCache = result;
      return result;
    }
  })().finally(() => {
    _breedsFetchPromise = null;
  });

  return _breedsFetchPromise;
}

export function getCachedBreeds(): Breed[] | null {
  return _breedsCache;
}
