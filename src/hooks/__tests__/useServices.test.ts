/**
 * Unit tests for useServices hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useServices } from '../useServices';
import { getMockStore } from '@/mocks/supabase/store';
import type { Service, ServicePrice } from '@/types/database';

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

describe('useServices', () => {
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
    it('should return services with prices sorted by display_order', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Basic Grooming',
          description: 'Standard grooming',
          duration_minutes: 60,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'service-2',
          name: 'Premium Grooming',
          description: 'Premium service',
          duration_minutes: 90,
          display_order: 2,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockPrices: ServicePrice[] = [
        {
          id: 'price-1',
          service_id: 'service-1',
          size: 'small',
          price: 40,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'price-2',
          service_id: 'service-1',
          size: 'medium',
          price: 55,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'price-3',
          service_id: 'service-2',
          size: 'small',
          price: 70,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'services') {
          return mockServices;
        }
        if (table === 'service_prices') {
          return mockPrices;
        }
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.services).toHaveLength(2);
      expect(result.current.services[0].id).toBe('service-1');
      expect(result.current.services[0].prices).toHaveLength(2);
      expect(result.current.services[1].prices).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should start with loading state', async () => {
      mockStore.select.mockReturnValue([]);

      const { result } = renderHook(() => useServices());

      // After waiting, loading should be false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.services).toEqual([]);
    });

    it('should filter only active services', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Active Service',
          description: 'Active',
          duration_minutes: 60,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'service-2',
          name: 'Inactive Service',
          description: 'Inactive',
          duration_minutes: 60,
          display_order: 2,
          is_active: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'services') {
          // Mock store filters by is_active: true
          return mockServices.filter((s) => s.is_active);
        }
        if (table === 'service_prices') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.services).toHaveLength(1);
      expect(result.current.services[0].id).toBe('service-1');
    });

    it('should respect display_order sorting', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-3',
          name: 'Third',
          description: 'Third',
          duration_minutes: 60,
          display_order: 3,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'service-1',
          name: 'First',
          description: 'First',
          duration_minutes: 60,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'service-2',
          name: 'Second',
          description: 'Second',
          duration_minutes: 60,
          display_order: 2,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string, options?: any) => {
        if (table === 'services') {
          // Mock store sorts by display_order
          return [...mockServices].sort((a, b) => a.display_order - b.display_order);
        }
        if (table === 'service_prices') {
          return [];
        }
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.services[0].id).toBe('service-1');
      expect(result.current.services[1].id).toBe('service-2');
      expect(result.current.services[2].id).toBe('service-3');
    });
  });

  describe('getServiceById', () => {
    it('should return correct service by ID', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Basic Grooming',
          description: 'Standard grooming',
          duration_minutes: 60,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'service-2',
          name: 'Premium Grooming',
          description: 'Premium service',
          duration_minutes: 90,
          display_order: 2,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'services') return mockServices;
        if (table === 'service_prices') return [];
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const service = result.current.getServiceById('service-2');
      expect(service).toBeDefined();
      expect(service?.id).toBe('service-2');
      expect(service?.name).toBe('Premium Grooming');
    });

    it('should return undefined for non-existent service ID', async () => {
      mockStore.select.mockImplementation((table: string) => {
        if (table === 'services') return [];
        if (table === 'service_prices') return [];
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const service = result.current.getServiceById('non-existent');
      expect(service).toBeUndefined();
    });

    it('should include prices in returned service', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Basic Grooming',
          description: 'Standard grooming',
          duration_minutes: 60,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockPrices: ServicePrice[] = [
        {
          id: 'price-1',
          service_id: 'service-1',
          size: 'small',
          price: 40,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'price-2',
          service_id: 'service-1',
          size: 'medium',
          price: 55,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'services') return mockServices;
        if (table === 'service_prices') return mockPrices;
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const service = result.current.getServiceById('service-1');
      expect(service?.prices).toHaveLength(2);
      expect(service?.prices[0].size).toBe('small');
      expect(service?.prices[1].size).toBe('medium');
    });
  });

  describe('edge cases', () => {
    it('should return empty array when no services exist', async () => {
      mockStore.select.mockReturnValue([]);

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.services).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle services with no prices', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Basic Grooming',
          description: 'Standard grooming',
          duration_minutes: 60,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'services') return mockServices;
        if (table === 'service_prices') return [];
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.services).toHaveLength(1);
      expect(result.current.services[0].prices).toEqual([]);
    });

    it('should handle errors from data fetch', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.services).toEqual([]);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Database connection failed');
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to fetch services:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should handle unknown errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.select.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Unknown error');

      consoleError.mockRestore();
    });
  });

  describe('data consistency', () => {
    it('should correctly associate prices with services', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Service 1',
          description: 'Desc 1',
          duration_minutes: 60,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'service-2',
          name: 'Service 2',
          description: 'Desc 2',
          duration_minutes: 90,
          display_order: 2,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockPrices: ServicePrice[] = [
        {
          id: 'price-1',
          service_id: 'service-1',
          size: 'small',
          price: 40,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'price-2',
          service_id: 'service-2',
          size: 'small',
          price: 70,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'price-3',
          service_id: 'service-1',
          size: 'medium',
          price: 55,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'services') return mockServices;
        if (table === 'service_prices') return mockPrices;
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Service 1 should have 2 prices
      expect(result.current.services[0].prices).toHaveLength(2);
      expect(result.current.services[0].prices.every((p) => p.service_id === 'service-1')).toBe(
        true
      );

      // Service 2 should have 1 price
      expect(result.current.services[1].prices).toHaveLength(1);
      expect(result.current.services[1].prices[0].service_id).toBe('service-2');
    });

    it('should not include prices from other services', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Service 1',
          description: 'Desc 1',
          duration_minutes: 60,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockPrices: ServicePrice[] = [
        {
          id: 'price-1',
          service_id: 'service-1',
          size: 'small',
          price: 40,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'price-2',
          service_id: 'service-2', // Different service
          size: 'small',
          price: 70,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockStore.select.mockImplementation((table: string) => {
        if (table === 'services') return mockServices;
        if (table === 'service_prices') return mockPrices;
        return [];
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only have the price for service-1
      expect(result.current.services[0].prices).toHaveLength(1);
      expect(result.current.services[0].prices[0].id).toBe('price-1');
    });
  });
});
