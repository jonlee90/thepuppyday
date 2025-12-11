'use client';

/**
 * Hook for fetching available time slots for appointments
 * Supports both mock mode and future Supabase integration
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

export interface UseAvailabilityParams {
  date: string | null;
  serviceId: string | null;
}

export interface UseAvailabilityReturn {
  slots: TimeSlot[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
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

  const fetchAvailability = useCallback(async () => {
    // Don't fetch if date or service not selected
    if (!date || !serviceId) {
      setSlots([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (config.useMocks) {
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

        // Calculate available slots using utility function
        const availableSlots = getAvailableSlots(
          date,
          (service as { duration_minutes: number }).duration_minutes,
          allAppointments,
          businessHours
        );

        setSlots(availableSlots);
      } else {
        // TODO: Implement Supabase query when ready
        // const supabase = createClient();
        //
        // // Fetch service duration
        // const { data: service } = await supabase
        //   .from('services')
        //   .select('duration_minutes')
        //   .eq('id', serviceId)
        //   .single();
        //
        // // Fetch business hours
        // const { data: settings } = await supabase
        //   .from('settings')
        //   .select('value')
        //   .eq('key', 'business_hours')
        //   .single();
        //
        // // Fetch appointments for the date
        // const startOfDay = new Date(date + 'T00:00:00').toISOString();
        // const endOfDay = new Date(date + 'T23:59:59').toISOString();
        // const { data: appointments } = await supabase
        //   .from('appointments')
        //   .select('*')
        //   .gte('scheduled_at', startOfDay)
        //   .lte('scheduled_at', endOfDay)
        //   .not('status', 'in', '(cancelled,no_show)');

        throw new Error('Supabase integration not yet implemented');
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSlots([]);
    } finally {
      setIsLoading(false);
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
  };
}
