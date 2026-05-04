import { describe, it, expect } from 'vitest';
import {
  applyDetailFilters,
  bucketByBreed,
  bucketsToMetrics,
  computeAvgVisitWeeksByBreed,
  groupKey,
  rollupTopN,
  selectFrequencyMetrics,
  type BreedMetric,
  type RawAppointmentRow,
} from '../breed-aggregation';

const baseRow = (overrides: Partial<RawAppointmentRow> & { pet: RawAppointmentRow['pet'] }): RawAppointmentRow => ({
  id: overrides.id ?? Math.random().toString(),
  status: 'completed',
  scheduled_at: overrides.scheduled_at ?? '2026-01-01T00:00:00Z',
  total_price: overrides.total_price ?? 100,
  pet: overrides.pet,
  appointment_addons: overrides.appointment_addons ?? [],
});

const breededPet = (breedId: string, name: string, frequency: number | null = 6, ownerId = 'owner-a', petId = 'pet-1') => ({
  id: petId,
  breed_custom: null,
  owner_id: ownerId,
  breed: { id: breedId, name, grooming_frequency_weeks: frequency },
});

const customPet = (custom: string | null, ownerId = 'owner-x', petId = 'pet-x') => ({
  id: petId,
  breed_custom: custom,
  owner_id: ownerId,
  breed: null,
});

describe('groupKey', () => {
  it('uses breed.id when breed exists', () => {
    const k = groupKey(breededPet('b1', 'Poodle'));
    expect(k.id).toBe('b1');
    expect(k.label).toBe('Poodle');
    expect(k.isCustom).toBe(false);
    expect(k.benchmarkWeeks).toBe(6);
  });

  it('falls back to lowercased breed_custom', () => {
    const k = groupKey(customPet('GoldenDoodle'));
    expect(k.id).toBe('custom:goldendoodle');
    expect(k.label).toBe('Goldendoodle');
    expect(k.isCustom).toBe(true);
    expect(k.benchmarkWeeks).toBeNull();
  });

  it('handles blank breed_custom and missing breed as Unknown', () => {
    expect(groupKey(customPet(null)).id).toBe('unknown');
    expect(groupKey(customPet('   ')).id).toBe('unknown');
  });

  it('groups same breed_custom strings regardless of case/whitespace', () => {
    const a = groupKey(customPet('Cavapoo'));
    const b = groupKey(customPet(' cavapoo '));
    expect(a.id).toBe(b.id);
  });
});

describe('bucketByBreed + bucketsToMetrics', () => {
  it('aggregates revenue, addons, and customer count', () => {
    const rows: RawAppointmentRow[] = [
      baseRow({
        pet: breededPet('b1', 'Poodle', 6, 'cust-1', 'pet-1'),
        total_price: 100,
        appointment_addons: [{ price: 10 }, { price: 5 }],
      }),
      baseRow({
        pet: breededPet('b1', 'Poodle', 6, 'cust-2', 'pet-2'),
        total_price: 80,
        appointment_addons: [],
      }),
      baseRow({
        pet: breededPet('b1', 'Poodle', 6, 'cust-1', 'pet-3'),
        total_price: 50,
      }),
    ];
    const buckets = bucketByBreed(rows);
    const visits = computeAvgVisitWeeksByBreed(buckets);
    const metrics = bucketsToMetrics(buckets, visits);

    expect(metrics).toHaveLength(1);
    const m = metrics[0];
    expect(m.appointmentCount).toBe(3);
    expect(m.customerCount).toBe(2);
    expect(m.totalRevenue).toBe(245);
    expect(m.avgBookingValue).toBeCloseTo(245 / 3, 1);
    expect(m.benchmarkWeeks).toBe(6);
    expect(m.isCustom).toBe(false);
    expect(m.avgVisitWeeks).toBeNull();
  });

  it('keeps separate buckets for distinct custom strings', () => {
    const rows = [
      baseRow({ pet: customPet('Goldendoodle'), total_price: 100 }),
      baseRow({ pet: customPet('Cavapoo'), total_price: 80 }),
      baseRow({ pet: customPet('goldendoodle'), total_price: 60 }),
    ];
    const buckets = bucketByBreed(rows);
    expect(buckets.size).toBe(2);
    const labels = [...buckets.values()].map((b) => b.label).sort();
    expect(labels).toEqual(['Cavapoo', 'Goldendoodle']);
  });
});

describe('computeAvgVisitWeeksByBreed', () => {
  it('returns null for breeds where no pet has ≥2 appointments', () => {
    const rows = [
      baseRow({ pet: breededPet('b1', 'Poodle', 6, 'c1', 'p1') }),
      baseRow({ pet: breededPet('b1', 'Poodle', 6, 'c2', 'p2') }),
    ];
    const buckets = bucketByBreed(rows);
    const visits = computeAvgVisitWeeksByBreed(buckets);
    expect(visits.get('b1')).toBeNull();
  });

  it('computes pet-level avg from consecutive deltas, then breed-level avg', () => {
    // Pet-1: 0w, 4w, 8w → deltas [4, 4] → pet avg 4
    // Pet-2: 0w, 6w     → delta [6]    → pet avg 6
    // Breed avg = (4 + 6) / 2 = 5
    const d = (weeksFromBase: number) =>
      new Date(Date.UTC(2026, 0, 1) + weeksFromBase * 7 * 86_400_000).toISOString();
    const rows: RawAppointmentRow[] = [
      baseRow({ scheduled_at: d(0), pet: breededPet('b1', 'Poodle', 6, 'c1', 'p1') }),
      baseRow({ scheduled_at: d(4), pet: breededPet('b1', 'Poodle', 6, 'c1', 'p1') }),
      baseRow({ scheduled_at: d(8), pet: breededPet('b1', 'Poodle', 6, 'c1', 'p1') }),
      baseRow({ scheduled_at: d(0), pet: breededPet('b1', 'Poodle', 6, 'c2', 'p2') }),
      baseRow({ scheduled_at: d(6), pet: breededPet('b1', 'Poodle', 6, 'c2', 'p2') }),
    ];
    const buckets = bucketByBreed(rows);
    const visits = computeAvgVisitWeeksByBreed(buckets);
    expect(visits.get('b1')).toBeCloseTo(5, 5);

    const metrics = bucketsToMetrics(buckets, visits);
    expect(metrics[0].avgVisitWeeks).toBe(5);
    expect(metrics[0].cadenceGap).toBe(-1);
  });

  it('excludes pets with single appointment from frequency calc', () => {
    const d = (w: number) => new Date(Date.UTC(2026, 0, 1) + w * 7 * 86_400_000).toISOString();
    const rows: RawAppointmentRow[] = [
      baseRow({ scheduled_at: d(0), pet: breededPet('b1', 'Poodle', 4, 'c1', 'p1') }),
      baseRow({ scheduled_at: d(0), pet: breededPet('b1', 'Poodle', 4, 'c2', 'p2') }),
      baseRow({ scheduled_at: d(8), pet: breededPet('b1', 'Poodle', 4, 'c2', 'p2') }),
    ];
    const visits = computeAvgVisitWeeksByBreed(bucketByBreed(rows));
    expect(visits.get('b1')).toBeCloseTo(8, 5);
  });
});

describe('rollupTopN', () => {
  const make = (label: string, revenue: number): BreedMetric => ({
    breedId: label,
    label,
    appointmentCount: 5,
    customerCount: 5,
    totalRevenue: revenue,
    avgBookingValue: revenue / 5,
    avgVisitWeeks: null,
    benchmarkWeeks: null,
    cadenceGap: null,
    isOther: false,
    isCustom: false,
  });

  it('returns sorted list when ≤ topN', () => {
    const m = [make('a', 100), make('b', 200)];
    const out = rollupTopN(m, (x) => x.totalRevenue, 10);
    expect(out.map((x) => x.label)).toEqual(['b', 'a']);
    expect(out.find((x) => x.isOther)).toBeUndefined();
  });

  it('rolls remainder into Other when > topN', () => {
    const m = Array.from({ length: 15 }, (_, i) => make(`b${i}`, 100 - i));
    const out = rollupTopN(m, (x) => x.totalRevenue, 10);
    expect(out).toHaveLength(11);
    const other = out[10];
    expect(other.isOther).toBe(true);
    expect(other.label).toBe('Other (5 breeds)');
    expect(other.appointmentCount).toBe(25);
    expect(other.totalRevenue).toBe(100 - 14 + 100 - 13 + 100 - 12 + 100 - 11 + 100 - 10);
  });
});

describe('selectFrequencyMetrics', () => {
  const m = (label: string, gap: number | null, benchmark: number | null, avg: number | null): BreedMetric => ({
    breedId: label,
    label,
    appointmentCount: 1,
    customerCount: 1,
    totalRevenue: 0,
    avgBookingValue: 0,
    avgVisitWeeks: avg,
    benchmarkWeeks: benchmark,
    cadenceGap: gap,
    isOther: false,
    isCustom: false,
  });

  it('drops breeds without benchmark or visit data', () => {
    const out = selectFrequencyMetrics([
      m('a', 1, 4, 5),
      m('b', null, null, 5),
      m('c', null, 4, null),
    ]);
    expect(out.map((x) => x.label)).toEqual(['a']);
  });

  it('sorts by cadenceGap DESC (most overdue first)', () => {
    const out = selectFrequencyMetrics([
      m('low', -2, 4, 2),
      m('high', 5, 4, 9),
      m('mid', 1, 4, 5),
    ]);
    expect(out.map((x) => x.label)).toEqual(['high', 'mid', 'low']);
  });
});

describe('applyDetailFilters', () => {
  const make = (label: string, opts: Partial<BreedMetric> = {}): BreedMetric => ({
    breedId: label,
    label,
    appointmentCount: opts.appointmentCount ?? 5,
    customerCount: opts.customerCount ?? 5,
    totalRevenue: opts.totalRevenue ?? 100,
    avgBookingValue: opts.avgBookingValue ?? 20,
    avgVisitWeeks: opts.avgVisitWeeks ?? null,
    benchmarkWeeks: opts.benchmarkWeeks ?? null,
    cadenceGap: opts.cadenceGap ?? null,
    isOther: false,
    isCustom: false,
  });

  it('drops breeds below minSample', () => {
    const out = applyDetailFilters(
      [make('keep', { customerCount: 5 }), make('drop', { customerCount: 2 })],
      { minSample: 3, sortBy: 'revenue' },
    );
    expect(out.map((x) => x.label)).toEqual(['keep']);
  });

  it('case-insensitive search', () => {
    const out = applyDetailFilters(
      [make('Standard Poodle'), make('Bulldog')],
      { search: 'POODLE', minSample: 0 },
    );
    expect(out.map((x) => x.label)).toEqual(['Standard Poodle']);
  });

  it('sorts by revenue/abv/gap', () => {
    const a = make('a', { totalRevenue: 100, avgBookingValue: 50, cadenceGap: 2 });
    const b = make('b', { totalRevenue: 200, avgBookingValue: 25, cadenceGap: 5 });
    const c = make('c', { totalRevenue: 150, avgBookingValue: 75, cadenceGap: null });
    expect(applyDetailFilters([a, b, c], { sortBy: 'revenue', minSample: 0 }).map((x) => x.label)).toEqual(['b', 'c', 'a']);
    expect(applyDetailFilters([a, b, c], { sortBy: 'abv', minSample: 0 }).map((x) => x.label)).toEqual(['c', 'a', 'b']);
    expect(applyDetailFilters([a, b, c], { sortBy: 'gap', minSample: 0 }).map((x) => x.label)).toEqual(['b', 'a', 'c']);
  });
});
