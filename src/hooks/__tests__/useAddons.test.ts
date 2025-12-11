/**
 * Unit tests for useAddons hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAddons } from '../useAddons';
import { getMockStore } from '@/mocks/supabase/store';
import type { Addon, Breed } from '@/types/database';

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

describe('useAddons', () => {
  let mockStore: {
    select: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStore = {
      select: vi.fn(),
    };
    vi.mocked(getMockStore).mockReturnValue(mockStore as any);
  });

  describe('basic functionality', () => {
    it('should return active add-ons sorted by display_order', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Teeth Brushing',
          description: 'Professional teeth brushing',
          price: 10,
          display_order: 1,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-2',
          name: 'Pawdicure',
          description: 'Nail polish and paw treatment',
          price: 15,
          display_order: 2,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

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

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'addons') {
          return mockAddons;
        }
        if (table === 'breeds') {
          return mockBreeds;
        }
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toHaveLength(2);
      expect(result.current.addons[0].id).toBe('addon-1');
      expect(result.current.addons[1].id).toBe('addon-2');
      expect(result.current.error).toBeNull();
    });

    it('should start with loading state', async () => {
      mockStore.select.mockReturnValue([]);

      const { result } = renderHook(() => useAddons());

      // Initial state should have loading true or false depending on sync/async
      // After waiting, loading should be false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toEqual([]);
    });

    it('should filter only active add-ons', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Active Addon',
          description: 'Active',
          price: 10,
          display_order: 1,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-2',
          name: 'Inactive Addon',
          description: 'Inactive',
          price: 15,
          display_order: 2,
          upsell_breeds: [],
          is_active: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'addons') {
          // Mock store filters by is_active: true
          return mockAddons.filter((a) => a.is_active);
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toHaveLength(1);
      expect(result.current.addons[0].id).toBe('addon-1');
    });

    it('should respect display_order sorting', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-3',
          name: 'Third',
          description: 'Third',
          price: 20,
          display_order: 3,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-1',
          name: 'First',
          description: 'First',
          price: 10,
          display_order: 1,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-2',
          name: 'Second',
          description: 'Second',
          price: 15,
          display_order: 2,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'addons') {
          // Mock store sorts by display_order
          return [...mockAddons].sort((a, b) => a.display_order - b.display_order);
        }
        if (table === 'breeds') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons[0].id).toBe('addon-1');
      expect(result.current.addons[1].id).toBe('addon-2');
      expect(result.current.addons[2].id).toBe('addon-3');
    });
  });

  describe('getUpsellAddons', () => {
    const mockBreeds: Breed[] = [
      {
        id: 'breed-golden',
        name: 'Golden Retriever',
        size_category: 'large',
        coat_type: 'long',
        grooming_frequency_weeks: 6,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 'breed-poodle',
        name: 'Poodle',
        size_category: 'medium',
        coat_type: 'curly',
        grooming_frequency_weeks: 4,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    it('should return add-ons that match the breed', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Long Hair Treatment',
          description: 'For long-haired breeds',
          price: 10,
          display_order: 1,
          upsell_breeds: ['Golden Retriever', 'Afghan Hound'],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-2',
          name: 'Curly Coat Care',
          description: 'For curly-coated breeds',
          price: 15,
          display_order: 2,
          upsell_breeds: ['Poodle'],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-3',
          name: 'Universal Treatment',
          description: 'For all breeds',
          price: 5,
          display_order: 3,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return mockAddons;
        if (table === 'breeds') return mockBreeds;
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const upsellAddons = result.current.getUpsellAddons('breed-golden');
      expect(upsellAddons).toHaveLength(2);
      expect(upsellAddons.map((a) => a.id)).toContain('addon-1'); // Matches Golden Retriever
      expect(upsellAddons.map((a) => a.id)).toContain('addon-3'); // Universal (no breed restrictions)
      expect(upsellAddons.map((a) => a.id)).not.toContain('addon-2'); // Only for Poodle
    });

    it('should return only universal add-ons when breed does not match', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Poodle Special',
          description: 'Only for Poodles',
          price: 10,
          display_order: 1,
          upsell_breeds: ['Poodle'],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-2',
          name: 'Universal Treatment',
          description: 'For all breeds',
          price: 5,
          display_order: 2,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return mockAddons;
        if (table === 'breeds') return mockBreeds;
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const upsellAddons = result.current.getUpsellAddons('breed-golden');
      expect(upsellAddons).toHaveLength(1);
      expect(upsellAddons[0].id).toBe('addon-2');
    });

    it('should return only universal add-ons when breed_id is null', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Breed Specific',
          description: 'For specific breeds',
          price: 10,
          display_order: 1,
          upsell_breeds: ['Golden Retriever'],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-2',
          name: 'Universal Treatment',
          description: 'For all breeds',
          price: 5,
          display_order: 2,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return mockAddons;
        if (table === 'breeds') return mockBreeds;
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const upsellAddons = result.current.getUpsellAddons(null);
      expect(upsellAddons).toHaveLength(1);
      expect(upsellAddons[0].id).toBe('addon-2');
    });

    it('should return universal add-ons when breed is not found', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Breed Specific',
          description: 'For specific breeds',
          price: 10,
          display_order: 1,
          upsell_breeds: ['Golden Retriever'],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'addon-2',
          name: 'Universal Treatment',
          description: 'For all breeds',
          price: 5,
          display_order: 2,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return mockAddons;
        if (table === 'breeds') return mockBreeds;
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const upsellAddons = result.current.getUpsellAddons('non-existent-breed-id');
      expect(upsellAddons).toHaveLength(1);
      expect(upsellAddons[0].id).toBe('addon-2');
    });

    it('should handle case-insensitive breed matching', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Golden Treatment',
          description: 'For Golden Retrievers',
          price: 10,
          display_order: 1,
          upsell_breeds: ['GOLDEN RETRIEVER'], // Uppercase in addon
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockBreedsWithCase: Breed[] = [
        {
          id: 'breed-golden',
          name: 'golden retriever', // Lowercase in breed
          size_category: 'large',
          coat_type: 'long',
          grooming_frequency_weeks: 6,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return mockAddons;
        if (table === 'breeds') return mockBreedsWithCase;
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const upsellAddons = result.current.getUpsellAddons('breed-golden');
      expect(upsellAddons).toHaveLength(1);
      expect(upsellAddons[0].id).toBe('addon-1');
    });

    it('should return empty array when no add-ons are available', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Poodle Only',
          description: 'Only for Poodles',
          price: 10,
          display_order: 1,
          upsell_breeds: ['Poodle'],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return mockAddons;
        if (table === 'breeds') return mockBreeds;
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const upsellAddons = result.current.getUpsellAddons('breed-golden');
      expect(upsellAddons).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should return empty array when no add-ons exist', async () => {
      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return [];
        if (table === 'breeds') return [];
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors from data fetch', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toEqual([]);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Database connection failed');
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to fetch add-ons:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should handle unknown errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.select.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Unknown error');

      consoleError.mockRestore();
    });

    it('should handle add-ons with empty upsell_breeds array', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Universal Addon',
          description: 'For all breeds',
          price: 10,
          display_order: 1,
          upsell_breeds: [],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return mockAddons;
        if (table === 'breeds') return [];
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const upsellAddons = result.current.getUpsellAddons('any-breed-id');
      expect(upsellAddons).toHaveLength(1);
      expect(upsellAddons[0].id).toBe('addon-1');
    });

    it('should handle multiple breeds in upsell_breeds array', async () => {
      const mockAddons: Addon[] = [
        {
          id: 'addon-1',
          name: 'Multi-Breed Addon',
          description: 'For multiple breeds',
          price: 10,
          display_order: 1,
          upsell_breeds: ['Golden Retriever', 'Labrador', 'German Shepherd'],
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockBreeds: Breed[] = [
        {
          id: 'breed-lab',
          name: 'Labrador',
          size_category: 'large',
          coat_type: 'short',
          grooming_frequency_weeks: 8,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'addons') return mockAddons;
        if (table === 'breeds') return mockBreeds;
        return [];
      });

      const { result } = renderHook(() => useAddons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const upsellAddons = result.current.getUpsellAddons('breed-lab');
      expect(upsellAddons).toHaveLength(1);
      expect(upsellAddons[0].id).toBe('addon-1');
    });
  });
});
