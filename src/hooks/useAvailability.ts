'use client';

/**
 * Hook for fetching available time slots for appointments
 * Supports both mock mode and API endpoint integration
 */

import { useState, useEffect, useCallback } from 'react';
import { getMockStore } from '@/mocks/supabase/store';
import { config } from '@/lib/config';
import {
  getAvailableSlots,
  DEFAULT_BUSINESS_HOURS,
  type TimeSlot,
  type BusinessHours,
} from '@/lib/booking/availability';
import type { Appointment, Setting } from '@/types/database';
import type { BookingSettings } from '@/types/settings';

export interface UseAvailabilityParams {
  date: string | null;
  serviceId: string | null;
}

export interface UseAvailabilityReturn {
  slots: TimeSlot[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  bookingSettings: BookingSettings | null;
}

/**
 * Fetch available time slots for a specific date and service
 *
 * @param {UseAvailabilityParams} params - Date and service ID to check availability
 * @returns {UseAvailabilityReturn} Time slots with availability status
 *
 * @example
 * ```tsx
 * const { slots, isLoading, error, refetch } = useAvailability({
 *   date: '2025-12-15',
 *   serviceId: 'service-123',
 * });
 *
 * if (isLoading) return <div>Checking availability...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {slots.map(slot => (
 *       <TimeSlotButton
 *         key={slot.time}
 *         time={slot.time}
 *         available={slot.available}
 *         waitlistCount={slot.waitlistCount}
 *         onClick={() => selectTime(slot.time)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useAvailability({
  date,
  serviceId,
}: UseAvailabilityParams): UseAvailabilityReturn {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);

  const fetchAvailability = useCallback(async () => {
    // Don't fetch if date or service not selected
    if (!date || !serviceId) {
      console.log('[useAvailability] Skipping fetch - missing date or serviceId:', { date, serviceId });
      setSlots([]);
      setIsLoading(false);
      return;
    }

    console.log('[useAvailability] Fetching availability:', { date, serviceId, useMocks: config.useMocks });
    setIsLoading(true);
    setError(null);

    try {
      // Fetch booking settings first (used by both mock and API mode)
      let settings: BookingSettings | null = null;
      try {
        const settingsResponse = await fetch('/api/booking/settings');
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          settings = settingsData.data;
          setBookingSettings(settings);
          console.log('[useAvailability] Loaded booking settings:', settings);
        }
      } catch (settingsErr) {
        console.warn('[useAvailability] Failed to load booking settings, using defaults:', settingsErr);
      }

      if (config.useMocks) {
        console.log('[useAvailability] Using mock store');
        // Fetch from mock store
        const store = getMockStore();

        // Get service to find duration
        const service = store.selectById('services', serviceId);
        if (!service) {
          throw new Error('Service not found');
        }

        // Get business hours from settings
        const businessHoursSetting = (store.select('settings', {
          column: 'key',
          value: 'business_hours',
        }) as unknown as Setting[])[0];

        const businessHours: BusinessHours = businessHoursSetting?.value
          ? (businessHoursSetting.value as BusinessHours)
          : DEFAULT_BUSINESS_HOURS;

        // Get all appointments for the date
        const allAppointments = store.select('appointments') as unknown as Appointment[];

        // Calculate available slots using utility function with booking settings
        const availableSlots = getAvailableSlots(
          date,
          (service as { duration_minutes: number }).duration_minutes,
          allAppointments,
          businessHours,
          settings || undefined
        );

        console.log('[useAvailability] Mock slots generated:', availableSlots.length);
        setSlots(availableSlots);
      } else {
        // Use API endpoint instead of direct Supabase queries
        console.log('[useAvailability] Calling /api/availability endpoint');
        const url = `/api/availability?date=${encodeURIComponent(date)}&service_id=${encodeURIComponent(serviceId)}`;
        console.log('[useAvailability] Request URL:', url);

        const response = await fetch(url);
        console.log('[useAvailability] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[useAvailability] API error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch availability');
        }

        const data = await response.json();
        console.log('[useAvailability] Received slots:', data.slots?.length || 0);

        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error('[useAvailability] Error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSlots([]);
    } finally {
      setIsLoading(false);
      console.log('[useAvailability] Fetch complete');
    }
  }, [date, serviceId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  /**
   * Manually refetch availability (useful after booking or cancellation)
   */
  const refetch = useCallback(async () => {
    await fetchAvailability();
  }, [fetchAvailability]);

  return {
    slots,
    isLoading,
    error,
    refetch,
    bookingSettings,
  };
}
