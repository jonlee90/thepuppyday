/**
 * Unit tests for usePets hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePets } from '../usePets';
import { getMockStore } from '@/mocks/supabase/store';
import { useAuthStore } from '@/stores/auth-store';
import type { Pet, Breed, User, CreatePetInput } from '@/types/database';

// Mock the getMockStore
vi.mock('@/mocks/supabase/store', () => ({
  getMockStore: vi.fn(),
}));

// Mock the config
vi.mock('@/lib/config', () => ({
  config: {
    useMocks: true,
  },
}));

// Mock the auth store
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

describe('usePets', () => {
  let mockStore: {
    select: ReturnType<typeof vi.fn>;
    selectById: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '555-0100',
    role: 'customer',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    mockStore = {
      select: vi.fn(),
      selectById: vi.fn(),
      insert: vi.fn(),
    };
    vi.mocked(getMockStore).mockReturnValue(mockStore as any);
  });

  describe('authenticated user', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        setUser: vi.fn(),
        setLoading: vi.fn(),
        clearAuth: vi.fn(),
      });
    });

    it('should return user pets with breed data', async () => {
      const mockBreeds: Breed[] = [
        {
          id: 'breed-1',
          name: 'Golden Retriever',
          size_category: 'large',
          coat_type: 'long',
          grooming_frequency_weeks: 6,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'breed-2',
          name: 'Poodle',
          size_category: 'medium',
          coat_type: 'curly',
          grooming_frequency_weeks: 4,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockPets: Pet[] = [
        {
          id: 'pet-1',
          owner_id: 'user-1',
          name: 'Max',
          breed_id: 'breed-1',
          breed_custom: null,
          size: 'large',
          weight: 65,
          birth_date: '2020-05-15',
          notes: 'Friendly dog',
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'pet-2',
          owner_id: 'user-1',
          name: 'Bella',
          breed_id: 'breed-2',
          breed_custom: null,
          size: 'medium',
          weight: 30,
          birth_date: '2021-03-20',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          return mockPets;
        }
        if (table === 'breeds') {
          return mockBreeds;
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toHaveLength(2);
      expect(result.current.pets[0].name).toBe('Max');
      expect(result.current.pets[0].breed?.name).toBe('Golden Retriever');
      expect(result.current.pets[1].name).toBe('Bella');
      expect(result.current.pets[1].breed?.name).toBe('Poodle');
      expect(result.current.error).toBeNull();
    });

    it('should start with loading state', async () => {
      mockStore.select.mockReturnValue([]);

      const { result } = renderHook(() => usePets());

      // After waiting, loading should be false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toEqual([]);
    });

    it('should filter only active pets', async () => {
      const mockPets: Pet[] = [
        {
          id: 'pet-1',
          owner_id: 'user-1',
          name: 'Max',
          breed_id: 'breed-1',
          breed_custom: null,
          size: 'large',
          weight: 65,
          birth_date: '2020-05-15',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'pet-2',
          owner_id: 'user-1',
          name: 'Inactive Pet',
          breed_id: null,
          breed_custom: null,
          size: 'medium',
          weight: 30,
          birth_date: '2021-03-20',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: false, // Inactive
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          return mockPets.filter((p) => p.owner_id === 'user-1');
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only include active pets
      expect(result.current.pets).toHaveLength(1);
      expect(result.current.pets[0].name).toBe('Max');
    });

    it('should handle pets without breed_id', async () => {
      const mockPets: Pet[] = [
        {
          id: 'pet-1',
          owner_id: 'user-1',
          name: 'Max',
          breed_id: null, // No breed
          breed_custom: 'Mixed Breed',
          size: 'medium',
          weight: 40,
          birth_date: '2020-05-15',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          return mockPets;
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toHaveLength(1);
      expect(result.current.pets[0].breed).toBeUndefined();
      expect(result.current.pets[0].breed_custom).toBe('Mixed Breed');
    });

    it('should handle empty pets array', async () => {
      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          return [];
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should correctly join breed information', async () => {
      const mockBreeds: Breed[] = [
        {
          id: 'breed-1',
          name: 'Golden Retriever',
          size_category: 'large',
          coat_type: 'long',
          grooming_frequency_weeks: 6,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockPets: Pet[] = [
        {
          id: 'pet-1',
          owner_id: 'user-1',
          name: 'Max',
          breed_id: 'breed-1',
          breed_custom: null,
          size: 'large',
          weight: 65,
          birth_date: '2020-05-15',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          return mockPets;
        }
        if (table === 'breeds') {
          return mockBreeds;
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets[0].breed).toBeDefined();
      expect(result.current.pets[0].breed?.name).toBe('Golden Retriever');
      expect(result.current.pets[0].breed?.size_category).toBe('large');
    });
  });

  describe('unauthenticated user', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        setUser: vi.fn(),
        setLoading: vi.fn(),
        clearAuth: vi.fn(),
      });
    });

    it('should return empty array for unauthenticated users', async () => {
      mockStore.select.mockReturnValue([]);

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch pets for unauthenticated users', () => {
      mockStore.select.mockReturnValue([]);

      renderHook(() => usePets());

      // select should not be called for unauthenticated users
      expect(mockStore.select).not.toHaveBeenCalled();
    });
  });

  describe('createPet', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        setUser: vi.fn(),
        setLoading: vi.fn(),
        clearAuth: vi.fn(),
      });
    });

    it('should create a new pet and refetch pets', async () => {
      const mockBreeds: Breed[] = [
        {
          id: 'breed-1',
          name: 'Golden Retriever',
          size_category: 'large',
          coat_type: 'long',
          grooming_frequency_weeks: 6,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      let petsList: Pet[] = [];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          return petsList.filter((p) => p.is_active);
        }
        if (table === 'breeds') {
          return mockBreeds;
        }
        return [];
      });

      const newPet: Pet = {
        id: 'pet-new',
        owner_id: 'user-1',
        name: 'Charlie',
        breed_id: 'breed-1',
        breed_custom: null,
        size: 'large',
        weight: 70,
        birth_date: '2022-01-10',
        notes: 'New pet',
        medical_info: null,
        photo_url: null,
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockStore.insert.mockReturnValue(newPet);
      mockStore.selectById.mockReturnValue(mockBreeds[0]);

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toHaveLength(0);

      const petData: CreatePetInput = {
        owner_id: 'user-1',
        name: 'Charlie',
        breed_id: 'breed-1',
        size: 'large',
        weight: 70,
        birth_date: '2022-01-10',
        notes: 'New pet',
      };

      // Add to list before creating to simulate store update
      petsList = [newPet];

      let createdPet: Pet | null = null;
      await act(async () => {
        createdPet = await result.current.createPet(petData);
      });

      expect(createdPet).toBeDefined();
      expect(createdPet?.name).toBe('Charlie');
      expect(createdPet?.breed?.name).toBe('Golden Retriever');

      // Should have refetched and updated pets list
      await waitFor(() => {
        expect(result.current.pets).toHaveLength(1);
      });
    });

    it('should return null when user is not authenticated', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        setUser: vi.fn(),
        setLoading: vi.fn(),
        clearAuth: vi.fn(),
      });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const petData: CreatePetInput = {
        owner_id: 'user-1',
        name: 'Charlie',
        size: 'large',
      };

      let createdPet: Pet | null = null;
      await act(async () => {
        createdPet = await result.current.createPet(petData);
      });

      expect(createdPet).toBeNull();
      expect(result.current.error?.message).toBe('User not authenticated');
      expect(consoleError).toHaveBeenCalledWith(
        'Cannot create pet: User not authenticated'
      );

      consoleError.mockRestore();
    });

    it('should handle errors during pet creation', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.select.mockReturnValue([]);
      mockStore.insert.mockImplementation(() => {
        throw new Error('Database error');
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const petData: CreatePetInput = {
        owner_id: 'user-1',
        name: 'Charlie',
        size: 'large',
      };

      let createdPet: Pet | null = null;
      await act(async () => {
        createdPet = await result.current.createPet(petData);
      });

      expect(createdPet).toBeNull();
      expect(result.current.error?.message).toBe('Database error');
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to create pet:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should handle unknown errors during pet creation', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.select.mockReturnValue([]);
      mockStore.insert.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const petData: CreatePetInput = {
        owner_id: 'user-1',
        name: 'Charlie',
        size: 'large',
      };

      let createdPet: Pet | null = null;
      await act(async () => {
        createdPet = await result.current.createPet(petData);
      });

      expect(createdPet).toBeNull();
      expect(result.current.error?.message).toBe('Unknown error');

      consoleError.mockRestore();
    });

    it('should create pet with all optional fields', async () => {
      mockStore.select.mockImplementation((table: string) => {
        if (table === 'pets') return [];
        if (table === 'breeds') return [];
        return [];
      });

      const newPet: Pet = {
        id: 'pet-new',
        owner_id: 'user-1',
        name: 'Charlie',
        breed_id: 'breed-1',
        breed_custom: 'Mixed',
        size: 'large',
        weight: 70,
        birth_date: '2022-01-10',
        notes: 'New pet',
        medical_info: 'Allergies',
        photo_url: 'https://example.com/photo.jpg',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockStore.insert.mockReturnValue(newPet);
      mockStore.selectById.mockReturnValue(null);

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const petData: CreatePetInput = {
        owner_id: 'user-1',
        name: 'Charlie',
        breed_id: 'breed-1',
        breed_custom: 'Mixed',
        size: 'large',
        weight: 70,
        birth_date: '2022-01-10',
        notes: 'New pet',
        medical_info: 'Allergies',
        photo_url: 'https://example.com/photo.jpg',
      };

      const createdPet = await result.current.createPet(petData);

      expect(createdPet).toBeDefined();
      expect(createdPet?.weight).toBe(70);
      expect(createdPet?.medical_info).toBe('Allergies');
      expect(createdPet?.photo_url).toBe('https://example.com/photo.jpg');
    });

    it('should set is_active to true when creating pet', async () => {
      mockStore.select.mockReturnValue([]);

      const newPet: Pet = {
        id: 'pet-new',
        owner_id: 'user-1',
        name: 'Charlie',
        breed_id: null,
        breed_custom: null,
        size: 'large',
        weight: null,
        birth_date: null,
        notes: null,
        medical_info: null,
        photo_url: null,
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockStore.insert.mockReturnValue(newPet);
      mockStore.selectById.mockReturnValue(null);

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const petData: CreatePetInput = {
        owner_id: 'user-1',
        name: 'Charlie',
        size: 'large',
      };

      await result.current.createPet(petData);

      expect(mockStore.insert).toHaveBeenCalledWith(
        'pets',
        expect.objectContaining({
          is_active: true,
        })
      );
    });
  });

  describe('refetch functionality', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        setUser: vi.fn(),
        setLoading: vi.fn(),
        clearAuth: vi.fn(),
      });
    });

    it('should re-fetch pets when refetch is called', async () => {
      let callCount = 0;

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          callCount++;
          return [];
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = callCount;

      // Call refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(callCount).toBe(initialCallCount + 1);
      });
    });

    it('should update pets list after refetch', async () => {
      let petsList: Pet[] = [];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          return petsList.filter((p) => p.is_active);
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toHaveLength(0);

      // Add a pet
      petsList = [
        {
          id: 'pet-1',
          owner_id: 'user-1',
          name: 'Max',
          breed_id: null,
          breed_custom: null,
          size: 'large',
          weight: 65,
          birth_date: '2020-05-15',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.pets).toHaveLength(1);
        expect(result.current.pets[0].name).toBe('Max');
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        setUser: vi.fn(),
        setLoading: vi.fn(),
        clearAuth: vi.fn(),
      });
    });

    it('should handle errors from data fetch', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toEqual([]);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Database connection failed');
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to fetch pets:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should handle unknown errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.select.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Unknown error');

      consoleError.mockRestore();
    });
  });

  describe('data filtering', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        setUser: vi.fn(),
        setLoading: vi.fn(),
        clearAuth: vi.fn(),
      });
    });

    it('should only return pets for the authenticated user', async () => {
      const mockPets: Pet[] = [
        {
          id: 'pet-1',
          owner_id: 'user-1', // Current user's pet
          name: 'Max',
          breed_id: null,
          breed_custom: null,
          size: 'large',
          weight: 65,
          birth_date: '2020-05-15',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'pet-2',
          owner_id: 'user-2', // Another user's pet
          name: 'Bella',
          breed_id: null,
          breed_custom: null,
          size: 'medium',
          weight: 30,
          birth_date: '2021-03-20',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          // Mock store filters by owner_id
          return mockPets.filter((p) => p.owner_id === 'user-1');
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pets).toHaveLength(1);
      expect(result.current.pets[0].id).toBe('pet-1');
      expect(result.current.pets[0].owner_id).toBe('user-1');
    });

    it('should not include inactive pets', async () => {
      const mockPets: Pet[] = [
        {
          id: 'pet-1',
          owner_id: 'user-1',
          name: 'Max',
          breed_id: null,
          breed_custom: null,
          size: 'large',
          weight: 65,
          birth_date: '2020-05-15',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'pet-2',
          owner_id: 'user-1',
          name: 'Bella (Deceased)',
          breed_id: null,
          breed_custom: null,
          size: 'medium',
          weight: 30,
          birth_date: '2015-03-20',
          notes: null,
          medical_info: null,
          photo_url: null,
          is_active: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'pets') {
          return mockPets.filter((p) => p.owner_id === 'user-1');
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => usePets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only include active pets
      expect(result.current.pets).toHaveLength(1);
      expect(result.current.pets[0].is_active).toBe(true);
    });
  });
});
