/**
 * Breed Analytics API
 * GET /api/admin/analytics/breeds
 *
 * Returns breed-grouped revenue, ABV, and visit-frequency-vs-benchmark data
 * for the admin analytics dashboard.
 *
 * Query params:
 *   start, end       — ISO dates (required)
 *   mode             — 'dashboard' (default) | 'detail'
 *   sortBy           — 'revenue' | 'abv' | 'gap' (detail mode only)
 *   minSample        — int (detail mode only, default 3)
 *   search           — string (detail mode only)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { config } from '@/lib/config';
import {
  applyDetailFilters,
  bucketByBreed,
  bucketsToMetrics,
  computeAvgVisitWeeksByBreed,
  rollupTopN,
  selectFrequencyMetrics,
  type BreedMetric,
  type DetailSortBy,
  type RawAppointmentRow,
} from '@/lib/analytics/breed-aggregation';

interface ResponseMeta {
  totalBreeds: number;
  totalAppointments: number;
  customBreedCount: number;
  filteredCount?: number;
}

interface DashboardResponse {
  mode: 'dashboard';
  dateRange: { start: string; end: string };
  topRevenue: BreedMetric[];
  avgBookingValue: BreedMetric[];
  visitFrequency: BreedMetric[];
  meta: ResponseMeta;
}

interface DetailResponse {
  mode: 'detail';
  dateRange: { start: string; end: string };
  breeds: BreedMetric[];
  meta: ResponseMeta;
}

function buildMockMetrics(): BreedMetric[] {
  return [
    { breedId: 'b-poodle', label: 'Poodle', appointmentCount: 42, customerCount: 18, totalRevenue: 4860, avgBookingValue: 115.71, avgVisitWeeks: 5.4, benchmarkWeeks: 6, cadenceGap: -0.6, isOther: false, isCustom: false },
    { breedId: 'b-golden', label: 'Golden Retriever', appointmentCount: 35, customerCount: 14, totalRevenue: 3920, avgBookingValue: 112, avgVisitWeeks: 7.8, benchmarkWeeks: 6, cadenceGap: 1.8, isOther: false, isCustom: false },
    { breedId: 'b-shihtzu', label: 'Shih Tzu', appointmentCount: 31, customerCount: 12, totalRevenue: 2790, avgBookingValue: 90, avgVisitWeeks: 5.0, benchmarkWeeks: 5, cadenceGap: 0, isOther: false, isCustom: false },
    { breedId: 'b-yorkie', label: 'Yorkshire Terrier', appointmentCount: 28, customerCount: 11, totalRevenue: 2380, avgBookingValue: 85, avgVisitWeeks: 6.5, benchmarkWeeks: 5, cadenceGap: 1.5, isOther: false, isCustom: false },
    { breedId: 'b-maltese', label: 'Maltese', appointmentCount: 22, customerCount: 9, totalRevenue: 1980, avgBookingValue: 90, avgVisitWeeks: 5.5, benchmarkWeeks: 6, cadenceGap: -0.5, isOther: false, isCustom: false },
    { breedId: 'b-cocker', label: 'Cocker Spaniel', appointmentCount: 18, customerCount: 8, totalRevenue: 1980, avgBookingValue: 110, avgVisitWeeks: 7.0, benchmarkWeeks: 6, cadenceGap: 1, isOther: false, isCustom: false },
    { breedId: 'b-husky', label: 'Husky', appointmentCount: 15, customerCount: 7, totalRevenue: 2025, avgBookingValue: 135, avgVisitWeeks: 9.2, benchmarkWeeks: 8, cadenceGap: 1.2, isOther: false, isCustom: false },
    { breedId: 'b-corgi', label: 'Corgi', appointmentCount: 14, customerCount: 6, totalRevenue: 1540, avgBookingValue: 110, avgVisitWeeks: 6.0, benchmarkWeeks: 6, cadenceGap: 0, isOther: false, isCustom: false },
    { breedId: null, label: 'Goldendoodle', appointmentCount: 12, customerCount: 5, totalRevenue: 1380, avgBookingValue: 115, avgVisitWeeks: null, benchmarkWeeks: null, cadenceGap: null, isOther: false, isCustom: true },
    { breedId: 'b-bichon', label: 'Bichon Frise', appointmentCount: 10, customerCount: 4, totalRevenue: 1100, avgBookingValue: 110, avgVisitWeeks: 6.5, benchmarkWeeks: 6, cadenceGap: 0.5, isOther: false, isCustom: false },
    { breedId: 'b-pom', label: 'Pomeranian', appointmentCount: 8, customerCount: 3, totalRevenue: 720, avgBookingValue: 90, avgVisitWeeks: 5.5, benchmarkWeeks: 6, cadenceGap: -0.5, isOther: false, isCustom: false },
    { breedId: 'b-cavalier', label: 'Cavalier King Charles', appointmentCount: 6, customerCount: 3, totalRevenue: 540, avgBookingValue: 90, avgVisitWeeks: 7, benchmarkWeeks: 6, cadenceGap: 1, isOther: false, isCustom: false },
  ];
}

function buildMockResponse(mode: 'dashboard' | 'detail', start: string, end: string, sortBy: DetailSortBy, minSample: number, search: string): DashboardResponse | DetailResponse {
  const all = buildMockMetrics();
  const meta: ResponseMeta = {
    totalBreeds: all.length,
    totalAppointments: all.reduce((s, m) => s + m.appointmentCount, 0),
    customBreedCount: all.filter((m) => m.isCustom).length,
  };

  if (mode === 'detail') {
    const filtered = applyDetailFilters(all, { sortBy, minSample, search });
    return {
      mode: 'detail',
      dateRange: { start, end },
      breeds: filtered,
      meta: { ...meta, filteredCount: filtered.length },
    };
  }

  return {
    mode: 'dashboard',
    dateRange: { start, end },
    topRevenue: rollupTopN(all, (m) => m.totalRevenue, 10),
    avgBookingValue: rollupTopN(all, (m) => m.avgBookingValue, 10),
    visitFrequency: selectFrequencyMetrics(all),
    meta,
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const start = params.get('start');
    const end = params.get('end');
    const mode = (params.get('mode') ?? 'dashboard') as 'dashboard' | 'detail';
    const sortBy = (params.get('sortBy') ?? 'revenue') as DetailSortBy;
    const minSample = Math.max(0, parseInt(params.get('minSample') ?? '3', 10) || 0);
    const search = params.get('search') ?? '';

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 });
    }
    if (mode !== 'dashboard' && mode !== 'detail') {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }
    if (sortBy !== 'revenue' && sortBy !== 'abv' && sortBy !== 'gap') {
      return NextResponse.json({ error: 'Invalid sortBy' }, { status: 400 });
    }

    if (config.useMocks) {
      return NextResponse.json(buildMockResponse(mode, start, end, sortBy, minSample, search));
    }

    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    await requireAdmin(supabase);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (serviceClient as any)
      .from('appointments')
      .select(`
        id,
        status,
        scheduled_at,
        total_price,
        pet:pets!inner (
          id,
          breed_custom,
          owner_id,
          breed:breeds (
            id,
            name,
            grooming_frequency_weeks
          )
        ),
        appointment_addons (
          price
        )
      `)
      .eq('status', 'completed')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end);

    if (error) {
      console.error('[Breed Analytics API] Query error:', error);
      throw new Error('Failed to fetch breed analytics');
    }

    // Supabase returns nested joins as arrays in some contexts; normalize.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized: RawAppointmentRow[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      status: r.status,
      scheduled_at: r.scheduled_at,
      total_price: r.total_price,
      pet: Array.isArray(r.pet)
        ? {
            id: r.pet[0]?.id,
            breed_custom: r.pet[0]?.breed_custom ?? null,
            owner_id: r.pet[0]?.owner_id,
            breed: Array.isArray(r.pet[0]?.breed) ? r.pet[0].breed[0] ?? null : r.pet[0]?.breed ?? null,
          }
        : {
            id: r.pet?.id,
            breed_custom: r.pet?.breed_custom ?? null,
            owner_id: r.pet?.owner_id,
            breed: Array.isArray(r.pet?.breed) ? r.pet.breed[0] ?? null : r.pet?.breed ?? null,
          },
      appointment_addons: r.appointment_addons ?? [],
    })).filter((r: RawAppointmentRow) => r.pet && r.pet.id && r.pet.owner_id);

    const buckets = bucketByBreed(normalized);
    const visitWeeks = computeAvgVisitWeeksByBreed(buckets);
    const allMetrics = bucketsToMetrics(buckets, visitWeeks);

    const meta: ResponseMeta = {
      totalBreeds: allMetrics.length,
      totalAppointments: normalized.length,
      customBreedCount: allMetrics.filter((m) => m.isCustom).length,
    };

    if (mode === 'detail') {
      const filtered = applyDetailFilters(allMetrics, { sortBy, minSample, search });
      const detailResponse: DetailResponse = {
        mode: 'detail',
        dateRange: { start, end },
        breeds: filtered,
        meta: { ...meta, filteredCount: filtered.length },
      };
      return NextResponse.json(detailResponse);
    }

    const dashboardResponse: DashboardResponse = {
      mode: 'dashboard',
      dateRange: { start, end },
      topRevenue: rollupTopN(allMetrics, (m) => m.totalRevenue, 10),
      avgBookingValue: rollupTopN(allMetrics, (m) => m.avgBookingValue, 10),
      visitFrequency: selectFrequencyMetrics(allMetrics),
      meta,
    };
    return NextResponse.json(dashboardResponse);
  } catch (error) {
    console.error('[Breed Analytics API] Error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
