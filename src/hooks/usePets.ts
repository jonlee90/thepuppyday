'use client';

/**
 * Hook for fetching and managing user's pet profiles
 * Supports both mock mode and future Supabase integration
 */

import { useState, useEffect, useCallback } from 'react';
import { getMockStore } from '@/mocks/supabase/store';
import { config } from '@/lib/config';
import { useAuthStore } from '@/stores/auth-store';
import type { Pet, CreatePetInput, Breed } from '@/types/database';

export interface UsePetsReturn {
  pets: Pet[];
  isLoading: boolean;
  error: Error | null;
  createPet: (data: CreatePetInput) => Promise<Pet | null>;
  refetch: () => Promise<void>;
}

/**
 * Fetch and manage authenticated user's active pets
 *
 * @returns {UsePetsReturn} Pets data with loading, error states, and CRUD operations
 *
 * @example
 * ```tsx
 * const { pets, isLoading, error, createPet, refetch } = usePets();
 *
 * if (isLoading) return <div>Loading pets...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * const handleCreatePet = async () => {
 *   const newPet = await createPet({
 *     owner_id: user.id,
 *     name: 'Max',
 *     size: 'medium',
 *     breed_id: 'breed-123',
 *   });
 *   if (newPet) {
 *     // Navigate to next booking step or update UI
 *     navigate('/booking/step-3');
 *   }
 * };
 *
 * return (
 *   <div>
 *     {pets.map(pet => (
 *       <PetCard key={pet.id} pet={pet} />
 *     ))}
 *     <button onClick={handleCreatePet}>Add Pet</button>
 *   </div>
 * );
 * ```
 */
export function usePets(): UsePetsReturn {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  const fetchPets = useCallback(async () => {
    // Return empty array for unauthenticated users
    if (!isAuthenticated || !user) {
      setPets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (config.useMocks) {
        // Fetch from mock store
        const store = getMockStore();

        // Get user's active pets
        const userPets = store.select('pets', {
          column: 'owner_id',
          value: user.id,
        }) as unknown as Pet[];

        // Filter only active pets
        const activePets = userPets.filter((pet) => pet.is_active);

        // Optionally join breed data for display
        const breedsData = store.select('breeds') as unknown as Breed[];
        const petsWithBreeds = activePets.map((pet) => ({
          ...pet,
          breed: pet.breed_id
            ? breedsData.find((breed) => breed.id === pet.breed_id)
            : undefined,
        }));

        setPets(petsWithBreeds);
      } else {
        // TODO: Implement Supabase query when ready
        // const supabase = createClient();
        // const { data, error } = await supabase
        //   .from('pets')
        //   .select('*, breed:breeds(*)')
        //   .eq('owner_id', user.id)
        //   .eq('is_active', true)
        //   .order('created_at', { ascending: false });
        //
        // if (error) throw error;
        // setPets(data || []);

        throw new Error('Supabase integration not yet implemented');
      }
    } catch (err) {
      console.error('Failed to fetch pets:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setPets([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  /**
   * Create a new pet for the authenticated user
   *
   * @param {CreatePetInput} data - Pet data to create
   * @returns {Promise<Pet | null>} The created pet or null if failed
   */
  const createPet = useCallback(
    async (data: CreatePetInput): Promise<Pet | null> => {
      if (!isAuthenticated || !user) {
        console.error('Cannot create pet: User not authenticated');
        setError(new Error('User not authenticated'));
        return null;
      }

      try {
        if (config.useMocks) {
          // Create in mock store
          const store = getMockStore();

          const newPet = store.insert('pets', {
            owner_id: data.owner_id,
            name: data.name,
            breed_id: data.breed_id || null,
            breed_custom: data.breed_custom || null,
            size: data.size,
            weight: data.weight || null,
            birth_date: data.birth_date || null,
            notes: data.notes || null,
            medical_info: data.medical_info || null,
            photo_url: data.photo_url || null,
            is_active: true,
          }) as unknown as Pet;

          // Optionally fetch breed data
          if (newPet.breed_id) {
            const breed = store.selectById('breeds', newPet.breed_id) as unknown as Breed | null;
            if (breed) {
              (newPet as Pet).breed = breed;
            }
          }

          // Refresh the pets list
          await fetchPets();

          return newPet;
        } else {
          // TODO: Implement Supabase mutation when ready
          // const supabase = createClient();
          // const { data: newPet, error } = await supabase
          //   .from('pets')
          //   .insert([{ ...data, is_active: true }])
          //   .select('*, breed:breeds(*)')
          //   .single();
          //
          // if (error) throw error;
          //
          // // Refresh the pets list
          // await fetchPets();
          //
          // return newPet;

          throw new Error('Supabase integration not yet implemented');
        }
      } catch (err) {
        console.error('Failed to create pet:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        return null;
      }
    },
    [user, isAuthenticated, fetchPets]
  );

  /**
   * Manually refetch pets (useful after updates from other components)
   */
  const refetch = useCallback(async () => {
    await fetchPets();
  }, [fetchPets]);

  return {
    pets,
    isLoading,
    error,
    createPet,
    refetch,
  };
}
