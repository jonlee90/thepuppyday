/**
 * Breed analytics aggregation helpers
 *
 * Pure functions — no Supabase or React imports. Designed for unit testing.
 * Used by /api/admin/analytics/breeds.
 */

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

export interface RawAppointmentRow {
  id: string;
  status: string;
  scheduled_at: string;
  total_price: number | null;
  pet: {
    id: string;
    breed_custom: string | null;
    owner_id: string;
    breed: {
      id: string;
      name: string;
      grooming_frequency_weeks: number | null;
    } | null;
  };
  appointment_addons: Array<{ price: number | null }>;
}

export interface BreedMetric {
  breedId: string | null;
  label: string;
  appointmentCount: number;
  customerCount: number;
  totalRevenue: number;
  avgBookingValue: number;
  avgVisitWeeks: number | null;
  benchmarkWeeks: number | null;
  cadenceGap: number | null;
  isOther: boolean;
  isCustom: boolean;
}

interface BucketAcc {
  breedId: string | null;
  label: string;
  isCustom: boolean;
  benchmarkWeeks: number | null;
  totalRevenue: number;
  appointmentCount: number;
  customerIds: Set<string>;
  petAppointments: Map<string, Date[]>;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function groupKey(pet: RawAppointmentRow['pet']): {
  id: string;
  label: string;
  isCustom: boolean;
  benchmarkWeeks: number | null;
} {
  if (pet.breed?.id) {
    return {
      id: pet.breed.id,
      label: pet.breed.name,
      isCustom: false,
      benchmarkWeeks: pet.breed.grooming_frequency_weeks ?? null,
    };
  }
  const custom = pet.breed_custom?.trim().toLowerCase() ?? '';
  if (!custom) {
    return { id: 'unknown', label: 'Custom / Mixed (Unknown)', isCustom: true, benchmarkWeeks: null };
  }
  return {
    id: `custom:${custom}`,
    label: capitalize(custom),
    isCustom: true,
    benchmarkWeeks: null,
  };
}

function appointmentRevenue(row: RawAppointmentRow): number {
  const base = row.total_price ?? 0;
  const addons = (row.appointment_addons ?? []).reduce(
    (sum, a) => sum + (a.price ?? 0),
    0,
  );
  return base + addons;
}

export function bucketByBreed(rows: RawAppointmentRow[]): Map<string, BucketAcc> {
  const buckets = new Map<string, BucketAcc>();

  for (const row of rows) {
    if (!row.pet) continue;
    const key = groupKey(row.pet);
    let acc = buckets.get(key.id);
    if (!acc) {
      acc = {
        breedId: key.isCustom ? null : key.id,
        label: key.label,
        isCustom: key.isCustom,
        benchmarkWeeks: key.benchmarkWeeks,
        totalRevenue: 0,
        appointmentCount: 0,
        customerIds: new Set(),
        petAppointments: new Map(),
      };
      buckets.set(key.id, acc);
    }
    acc.totalRevenue += appointmentRevenue(row);
    acc.appointmentCount += 1;
    acc.customerIds.add(row.pet.owner_id);

    const petAppts = acc.petAppointments.get(row.pet.id) ?? [];
    petAppts.push(new Date(row.scheduled_at));
    acc.petAppointments.set(row.pet.id, petAppts);
  }

  return buckets;
}

/**
 * Per-pet avg weeks between consecutive completed appointments.
 * Pets with <2 appointments are excluded.
 * Returns map of breedKey -> avg of pet-level avgs (avoids one heavy-rebooker dominating).
 */
export function computeAvgVisitWeeksByBreed(
  buckets: Map<string, BucketAcc>,
): Map<string, number | null> {
  const result = new Map<string, number | null>();

  for (const [key, bucket] of buckets) {
    const petAvgs: number[] = [];
    for (const dates of bucket.petAppointments.values()) {
      if (dates.length < 2) continue;
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
      const deltas: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        deltas.push((sorted[i].getTime() - sorted[i - 1].getTime()) / MS_PER_WEEK);
      }
      const petAvg = deltas.reduce((s, d) => s + d, 0) / deltas.length;
      petAvgs.push(petAvg);
    }
    if (petAvgs.length === 0) {
      result.set(key, null);
      continue;
    }
    const breedAvg = petAvgs.reduce((s, v) => s + v, 0) / petAvgs.length;
    result.set(key, breedAvg);
  }

  return result;
}

export function bucketsToMetrics(
  buckets: Map<string, BucketAcc>,
  visitWeeksByBreed: Map<string, number | null>,
): BreedMetric[] {
  const metrics: BreedMetric[] = [];
  for (const [key, b] of buckets) {
    const avgVisitWeeks = visitWeeksByBreed.get(key) ?? null;
    const benchmarkWeeks = b.benchmarkWeeks;
    const cadenceGap =
      avgVisitWeeks != null && benchmarkWeeks != null ? avgVisitWeeks - benchmarkWeeks : null;
    metrics.push({
      breedId: b.breedId,
      label: b.label,
      appointmentCount: b.appointmentCount,
      customerCount: b.customerIds.size,
      totalRevenue: Math.round(b.totalRevenue * 100) / 100,
      avgBookingValue:
        b.appointmentCount > 0
          ? Math.round((b.totalRevenue / b.appointmentCount) * 100) / 100
          : 0,
      avgVisitWeeks: avgVisitWeeks != null ? Math.round(avgVisitWeeks * 10) / 10 : null,
      benchmarkWeeks,
      cadenceGap: cadenceGap != null ? Math.round(cadenceGap * 10) / 10 : null,
      isOther: false,
      isCustom: b.isCustom,
    });
  }
  return metrics;
}

/**
 * Top N by `keyFn`; remaining buckets aggregated into one "Other (N breeds)" entry.
 * `cadenceGap`/`avgVisitWeeks`/`benchmarkWeeks` null on the Other bucket (incoherent across breeds).
 */
export function rollupTopN(
  metrics: BreedMetric[],
  keyFn: (m: BreedMetric) => number,
  topN = 10,
): BreedMetric[] {
  if (metrics.length <= topN) {
    return [...metrics].sort((a, b) => keyFn(b) - keyFn(a));
  }
  const sorted = [...metrics].sort((a, b) => keyFn(b) - keyFn(a));
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const otherRevenue = rest.reduce((s, m) => s + m.totalRevenue, 0);
  const otherAppts = rest.reduce((s, m) => s + m.appointmentCount, 0);
  const otherCustomers = rest.reduce((s, m) => s + m.customerCount, 0);
  const other: BreedMetric = {
    breedId: null,
    label: `Other (${rest.length} breeds)`,
    appointmentCount: otherAppts,
    customerCount: otherCustomers,
    totalRevenue: Math.round(otherRevenue * 100) / 100,
    avgBookingValue: otherAppts > 0 ? Math.round((otherRevenue / otherAppts) * 100) / 100 : 0,
    avgVisitWeeks: null,
    benchmarkWeeks: null,
    cadenceGap: null,
    isOther: true,
    isCustom: false,
  };
  return [...top, other];
}

/**
 * Visit frequency selection — only breeds with both benchmark + at least one
 * pet contributing avgVisitWeeks. Sorted by `cadenceGap` DESC (most overdue first).
 */
export function selectFrequencyMetrics(metrics: BreedMetric[]): BreedMetric[] {
  return metrics
    .filter((m) => m.benchmarkWeeks != null && m.avgVisitWeeks != null)
    .sort((a, b) => (b.cadenceGap ?? 0) - (a.cadenceGap ?? 0));
}

export type DetailSortBy = 'revenue' | 'abv' | 'gap';

export function applyDetailFilters(
  metrics: BreedMetric[],
  opts: { minSample?: number; search?: string; sortBy?: DetailSortBy },
): BreedMetric[] {
  const minSample = opts.minSample ?? 3;
  const search = opts.search?.trim().toLowerCase() ?? '';
  const sortBy: DetailSortBy = opts.sortBy ?? 'revenue';

  let filtered = metrics.filter((m) => m.customerCount >= minSample);
  if (search) {
    filtered = filtered.filter((m) => m.label.toLowerCase().includes(search));
  }

  const sorter = (a: BreedMetric, b: BreedMetric): number => {
    if (sortBy === 'abv') return b.avgBookingValue - a.avgBookingValue;
    if (sortBy === 'gap') {
      const ga = a.cadenceGap ?? Number.NEGATIVE_INFINITY;
      const gb = b.cadenceGap ?? Number.NEGATIVE_INFINITY;
      return gb - ga;
    }
    return b.totalRevenue - a.totalRevenue;
  };
  return filtered.sort(sorter);
}
