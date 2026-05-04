/**
 * Helpers for capacity-2-weekend.spec.ts
 *
 * - Loads .env.local manually (Playwright host doesn't read it by default).
 * - Provides date helpers, service-role Supabase client, raw fetch wrappers
 *   for /api/availability and /api/appointments, and cleanup utilities.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, key, rawVal] = m;
      if (process.env[key]) continue;
      let val = rawVal.trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    // .env.local missing — caller will fail on missing env vars below
  }
}

loadEnvLocal();

export const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. ' +
      'Ensure .env.local is populated.'
  );
}

let _client: SupabaseClient | null = null;
export function serviceRoleClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

// ─────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────

const DAY_FRIDAY = 5;
const DAY_SATURDAY = 6;
const DAY_THURSDAY = 4;
const DAY_SUNDAY = 0;

/**
 * Returns the next date with `weekday` (0=Sun..6=Sat) at least `minDaysAhead`
 * days from today. Uses local time, returns date with time stripped to 00:00.
 */
export function getNextWeekday(weekday: number, minDaysAhead = 7): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() + minDaysAhead);
  const dayDiff = (weekday - earliest.getDay() + 7) % 7;
  earliest.setDate(earliest.getDate() + dayDiff);
  return earliest;
}

export const getNextFriday = (minDaysAhead = 7) =>
  getNextWeekday(DAY_FRIDAY, minDaysAhead);
export const getNextSaturday = (minDaysAhead = 7) =>
  getNextWeekday(DAY_SATURDAY, minDaysAhead);
export const getNextThursday = (minDaysAhead = 7) =>
  getNextWeekday(DAY_THURSDAY, minDaysAhead);
export const getNextSunday = (minDaysAhead = 7) =>
  getNextWeekday(DAY_SUNDAY, minDaysAhead);

export function formatYMD(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Build a local-timezone ISO string for `<date> HH:mm`. The booking pipeline
 * stores `scheduled_at` as ISO; the same Date in local TZ is what the user
 * intends. Returns ISO with offset suffix.
 */
export function buildScheduledAt(date: Date, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────
// API wrappers
// ─────────────────────────────────────────────────────────────────────────

export interface AvailabilityResponse {
  date: string;
  slots: Array<{ time: string; available: boolean; waitlistCount?: number }>;
  is_closed?: boolean;
  reason?: string;
}

export async function fetchAvailability(
  date: string,
  serviceId: string
): Promise<{ status: number; body: AvailabilityResponse }> {
  const res = await fetch(
    `${BASE_URL}/api/availability?date=${encodeURIComponent(date)}&service_id=${encodeURIComponent(serviceId)}`,
    { headers: { Accept: 'application/json' } }
  );
  return { status: res.status, body: (await res.json()) as AvailabilityResponse };
}

export interface AppointmentPostBody {
  customer_id?: string;
  pet_id?: string;
  service_id: string;
  scheduled_at: string;
  duration_minutes: number;
  total_price: number;
  notes?: string;
  groomer_id?: string;
  addon_ids?: string[];
  guest_info?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    zip?: string;
  };
  new_pet?: {
    name: string;
    size: 'small' | 'medium' | 'large' | 'xlarge';
    gender?: 'male' | 'female';
    color?: string;
    breed_id?: string;
    breed_custom?: string;
  };
}

export interface AppointmentSuccess {
  success: true;
  appointment_id: string;
  reference: string;
  scheduled_at: string;
}

export async function postAppointment(
  payload: AppointmentPostBody
): Promise<{ status: number; body: AppointmentSuccess | { error: string; code?: string } }> {
  const res = await fetch(`${BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  return { status: res.status, body };
}

// ─────────────────────────────────────────────────────────────────────────
// DB fixtures (via service role)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Returns the first active service whose duration fits in a 60-min slot
 * (duration <= 45 minutes after factoring the default 15-min buffer).
 * Falls back to any active service if no short one exists, and the test
 * is responsible for skipping if duration is too long.
 */
export async function getTestService(): Promise<{
  id: string;
  duration_minutes: number;
  total_price: number;
}> {
  const sb = serviceRoleClient();
  const { data, error } = await sb
    .from('services')
    .select('id, duration_minutes')
    .eq('is_active', true)
    .order('duration_minutes', { ascending: true });
  if (error || !data || data.length === 0) {
    throw new Error(`No active services: ${error?.message ?? 'empty'}`);
  }
  const svc = data.find((s: any) => s.duration_minutes <= 45) ?? data[0];

  const { data: priceRow } = await sb
    .from('service_prices')
    .select('price')
    .eq('service_id', svc.id)
    .eq('size', 'medium')
    .maybeSingle();

  return {
    id: svc.id,
    duration_minutes: svc.duration_minutes,
    total_price: priceRow ? Number((priceRow as any).price) : 50,
  };
}

export interface TestCustomer {
  id: string;
  email: string;
  petId: string;
}

/**
 * Idempotent: returns existing customer + pet if present, else creates them.
 * Customers created here are marked `is_active: false` and `role: 'customer'`.
 */
export async function ensureCustomerWithPet(
  email: string,
  firstName: string,
  lastName: string,
  petName: string
): Promise<TestCustomer> {
  const sb = serviceRoleClient();

  let userId: string | null = null;
  const { data: existing } = await sb
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (existing) {
    userId = (existing as any).id;
  } else {
    const phone = `+1555${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`;
    const { data: created, error } = await sb
      .from('users')
      .insert({
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'customer',
        is_active: false,
        avatar_url: null,
        preferences: {},
      })
      .select('id')
      .single();

    if (error?.code === '23505') {
      // Two concurrent beforeAll calls; just re-fetch
      const { data: fallback } = await sb
        .from('users')
        .select('id')
        .ilike('email', email)
        .maybeSingle();
      if (!fallback) throw new Error(`ensure user: duplicate key but re-fetch failed`);
      userId = (fallback as any).id;
    } else if (error || !created) {
      throw new Error(`ensure user: ${error?.message}`);
    } else {
      userId = (created as any).id;
    }
  }

  const { data: pet } = await sb
    .from('pets')
    .select('id')
    .eq('owner_id', userId)
    .eq('name', petName)
    .maybeSingle();

  let petId: string;
  if (pet) {
    petId = (pet as any).id;
  } else {
    const { data: newPet, error } = await sb
      .from('pets')
      .insert({
        owner_id: userId,
        name: petName,
        size: 'medium',
        gender: 'male',
      })
      .select('id')
      .single();
    if (error || !newPet) throw new Error(`ensure pet: ${error?.message}`);
    petId = (newPet as any).id;
  }

  return { id: userId!, email, petId };
}

// ─────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────

export async function cleanupAppointmentsByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const sb = serviceRoleClient();
  await sb.from('appointment_addons').delete().in('appointment_id', ids);
  await sb.from('appointments').delete().in('id', ids);
}

export async function cancelAppointment(id: string): Promise<void> {
  const sb = serviceRoleClient();
  await sb.from('appointments').update({ status: 'cancelled' }).eq('id', id);
}

/**
 * Pre-flight: confirm Sunday is in recurring_blocked_days. If a tester has
 * customised settings, A10 might fail; surface that early.
 */
export async function assertSettingsDefaults(): Promise<void> {
  const sb = serviceRoleClient();
  const { data } = await sb
    .from('settings')
    .select('value')
    .eq('key', 'booking_settings')
    .maybeSingle();
  const value = (data as any)?.value ?? {};
  const blocked: number[] = value.recurring_blocked_days ?? [0];
  if (!blocked.includes(0)) {
    throw new Error(
      `Pre-flight: booking_settings.recurring_blocked_days must include 0 (Sunday). Got: ${JSON.stringify(blocked)}`
    );
  }
}
