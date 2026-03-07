'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CalendarAppointment, Groomer, GroomerColorMap, CalendarDateRange } from '../types';
import { GROOMER_COLORS, UNASSIGNED_COLOR } from '../constants';

export function useCalendarAppointments(dateRange: CalendarDateRange) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>('all');
  const [groomerColorMap, setGroomerColorMap] = useState<GroomerColorMap>({});

  // Load groomer filter from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appointmentGroomerFilter');
    if (saved) setSelectedGroomerId(saved);
  }, []);

  // Save groomer filter
  useEffect(() => {
    if (selectedGroomerId) {
      localStorage.setItem('appointmentGroomerFilter', selectedGroomerId);
    }
  }, [selectedGroomerId]);

  // Fetch groomers
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/admin/settings/staff?role=groomer&status=active');
        const result = await response.json();
        if (response.ok) {
          const list: Groomer[] = result.data || [];
          setGroomers(list);
          const colorMap: GroomerColorMap = {};
          list.forEach((g, i) => {
            colorMap[g.id] = GROOMER_COLORS[i % GROOMER_COLORS.length];
          });
          colorMap['unassigned'] = UNASSIGNED_COLOR;
          setGroomerColorMap(colorMap);
        }
      } catch (error) {
        console.error('[Calendar] Error fetching groomers:', error);
      }
    })();
  }, []);

  // Stable date range values for dependency array
  const startTime = dateRange.start.getTime();
  const endTime = dateRange.end.getTime();

  // Fetch appointments for date range
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let data: CalendarAppointment[] = [];

      if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
        const { getMockStore } = await import('@/mocks/supabase/store');
        const store = getMockStore();

        const all = store.select('appointments', {
          order: { column: 'scheduled_at', ascending: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as Record<string, any>[];

        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        const filtered = all.filter((apt) => {
          const aptDate = new Date(apt.scheduled_at);
          return aptDate >= dateRange.start && aptDate <= endDate;
        });

        data = filtered.map((apt) => ({
          ...apt,
          customer: store.selectById('users', apt.customer_id),
          pet: store.selectById('pets', apt.pet_id),
          service: store.selectById('services', apt.service_id),
          groomer: apt.groomer_id ? store.selectById('users', apt.groomer_id) : null,
        }));
      } else {
        const params = new URLSearchParams({
          dateFrom: dateRange.start.toISOString(),
          dateTo: dateRange.end.toISOString(),
          limit: '200',
        });
        const response = await fetch(`/api/admin/appointments?${params}`);
        const result = await response.json();
        if (response.ok && result.data) {
          data = result.data;
        }
      }

      setAppointments(data);
    } catch (error) {
      console.error('[Calendar] Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Filter by groomer
  const filteredAppointments = appointments.filter((apt) => {
    if (selectedGroomerId === 'all') return true;
    if (selectedGroomerId === 'unassigned') return !apt.groomer_id;
    return apt.groomer_id === selectedGroomerId;
  });

  // Get active groomer IDs (those with appointments or all groomers)
  const activeGroomerIds = groomers.map((g) => g.id);
  // Include unassigned if any appointment lacks groomer
  const hasUnassigned = filteredAppointments.some((apt) => !apt.groomer_id);

  return {
    appointments: filteredAppointments,
    allAppointments: appointments,
    loading,
    groomers,
    selectedGroomerId,
    setSelectedGroomerId,
    groomerColorMap,
    activeGroomerIds,
    hasUnassigned,
    refetch: fetchAppointments,
  };
}
