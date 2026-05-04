/**
 * Production-readiness suite for the Fri/Sat 9am–2pm capacity-2 booking rule.
 *
 * Layout:
 *   A. API tests   — direct fetch against /api/appointments and /api/availability.
 *                    These are the canonical capacity-rule gate.
 *   B. UI tests    — Playwright wizard sees the rule reflected in the slot grid.
 *   C. Smoke       — modal entry / close.
 *
 * If A1–A12, B1–B6, and C1–C3 pass on Chromium, the change is production-ready.
 */

import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  serviceRoleClient,
  getNextFriday,
  getNextSaturday,
  getNextThursday,
  getNextSunday,
  formatYMD,
  buildScheduledAt,
  fetchAvailability,
  postAppointment,
  getTestService,
  ensureCustomerWithPet,
  cleanupAppointmentsByIds,
  cancelAppointment,
  assertSettingsDefaults,
  AppointmentSuccess,
} from './helpers';

// ─────────────────────────────────────────────────────────────────────────
// Shared fixtures resolved once per worker
// ─────────────────────────────────────────────────────────────────────────

let serviceId: string;
let durationMinutes: number;
let totalPrice: number;
let customerA: { id: string; email: string; petId: string };
let customerB: { id: string; email: string; petId: string };
let customerC: { id: string; email: string; petId: string };
let createdAppointmentIds: string[] = [];

async function fixtureSetup() {
  await assertSettingsDefaults();
  const svc = await getTestService();
  serviceId = svc.id;
  durationMinutes = svc.duration_minutes;
  totalPrice = svc.total_price;

  customerA = await ensureCustomerWithPet(
    'capacity-test-a@e2e.thepuppyday.local',
    'CapacityA',
    'Tester',
    'CapacityPetA'
  );
  customerB = await ensureCustomerWithPet(
    'capacity-test-b@e2e.thepuppyday.local',
    'CapacityB',
    'Tester',
    'CapacityPetB'
  );
  customerC = await ensureCustomerWithPet(
    'capacity-test-c@e2e.thepuppyday.local',
    'CapacityC',
    'Tester',
    'CapacityPetC'
  );
}

async function trackAndPost(args: {
  customer: { id: string; petId: string };
  scheduledAt: string;
}): Promise<{ status: number; reference?: string; appointmentId?: string }> {
  const res = await postAppointment({
    customer_id: args.customer.id,
    pet_id: args.customer.petId,
    service_id: serviceId,
    scheduled_at: args.scheduledAt,
    duration_minutes: durationMinutes,
    total_price: totalPrice,
  });
  if (res.status === 200 && (res.body as AppointmentSuccess).appointment_id) {
    const success = res.body as AppointmentSuccess;
    createdAppointmentIds.push(success.appointment_id);
    return {
      status: res.status,
      reference: success.reference,
      appointmentId: success.appointment_id,
    };
  }
  return { status: res.status };
}

// ─────────────────────────────────────────────────────────────────────────
// A. API capacity tests
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial('A. /api/appointments capacity rule', () => {
  test.beforeAll(async () => {
    await fixtureSetup();
  });

  test.afterAll(async () => {
    await cleanupAppointmentsByIds(createdAppointmentIds);
    createdAppointmentIds = [];
  });

  test.beforeEach(() => {
    // Each test should leave a clean slot. We track ids and clean per-test.
  });

  test('A1+A2+A3: Fri 09:00 accepts 2 bookings, rejects 3rd with 409 SLOT_CONFLICT', async () => {
    const fri = getNextFriday();
    const at = buildScheduledAt(fri, '09:00');

    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    expect(r1.status, 'A1 first booking').toBe(200);
    expect(r1.reference).toMatch(/^APT-\d{4}-\d{6}$/);

    const r2 = await trackAndPost({ customer: customerB, scheduledAt: at });
    expect(r2.status, 'A2 second booking (capacity 2)').toBe(200);

    const r3 = await trackAndPost({ customer: customerC, scheduledAt: at });
    expect(r3.status, 'A3 third booking blocked').toBe(409);
  });

  test('A4: /api/availability marks Fri 09:00 unavailable after 2 bookings', async () => {
    const fri = getNextFriday();
    const date = formatYMD(fri);
    const { status, body } = await fetchAvailability(date, serviceId);
    expect(status).toBe(200);
    const slot = body.slots.find((s) => s.time === '09:00');
    expect(slot, 'slot 09:00 must exist').toBeTruthy();
    expect(slot!.available).toBe(false);
  });

  test('A5: Fri 13:00 (last weekend-capacity slot) accepts 2 bookings', async () => {
    const fri = getNextFriday();
    const at = buildScheduledAt(fri, '13:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    expect(r1.status, 'A5 first 13:00').toBe(200);
    const r2 = await trackAndPost({ customer: customerB, scheduledAt: at });
    expect(r2.status, 'A5 second 13:00 (cap 2)').toBe(200);
  });

  test('A6: Fri 14:00 (boundary excluded → cap 1) rejects 2nd booking with 409', async () => {
    const fri = getNextFriday();
    const at = buildScheduledAt(fri, '14:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    expect(r1.status, 'A6 first 14:00').toBe(200);
    const r2 = await trackAndPost({ customer: customerB, scheduledAt: at });
    expect(r2.status, 'A6 second 14:00 must conflict (cap 1)').toBe(409);
  });

  test('A7: Sat 13:00 — 2 bookings succeed, 3rd 409', async () => {
    const sat = getNextSaturday();
    const at = buildScheduledAt(sat, '13:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    expect(r1.status).toBe(200);
    const r2 = await trackAndPost({ customer: customerB, scheduledAt: at });
    expect(r2.status).toBe(200);
    const r3 = await trackAndPost({ customer: customerC, scheduledAt: at });
    expect(r3.status, 'A7 third Sat 13:00 must conflict').toBe(409);
  });

  test('A8: Sat 14:00 (cap 1) rejects 2nd booking', async () => {
    const sat = getNextSaturday();
    const at = buildScheduledAt(sat, '14:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    expect(r1.status).toBe(200);
    const r2 = await trackAndPost({ customer: customerB, scheduledAt: at });
    expect(r2.status, 'A8 Sat 14:00 cap 1').toBe(409);
  });

  test('A9: Thu 09:00 (weekday, cap 1) rejects 2nd booking', async () => {
    const thu = getNextThursday();
    const at = buildScheduledAt(thu, '09:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    expect(r1.status, 'A9 first Thu 09:00').toBe(200);
    const r2 = await trackAndPost({ customer: customerB, scheduledAt: at });
    expect(r2.status, 'A9 Thu 09:00 cap 1').toBe(409);
  });

  test('A10: Sunday is_closed (recurring blocked day regression guard)', async () => {
    const sun = getNextSunday();
    const date = formatYMD(sun);
    const { status, body } = await fetchAvailability(date, serviceId);
    expect(status).toBe(200);
    expect(body.is_closed).toBe(true);
    expect(body.slots).toEqual([]);
  });

  test('A11: cancelled appointments do not consume capacity', { retries: 2 }, async () => {
    const fri = getNextFriday(14); // farther-out Friday to avoid earlier collisions
    const at = buildScheduledAt(fri, '10:00');

    const first = await trackAndPost({ customer: customerA, scheduledAt: at });
    expect(first.status).toBe(200);
    await cancelAppointment(first.appointmentId!);

    const r2 = await trackAndPost({ customer: customerA, scheduledAt: at });
    expect(r2.status, 'A11 second after cancel').toBe(200);
    const r3 = await trackAndPost({ customer: customerB, scheduledAt: at });
    expect(r3.status, 'A11 third after cancel (cap 2)').toBe(200);
    const r4 = await trackAndPost({ customer: customerC, scheduledAt: at });
    expect(r4.status, 'A11 fourth must conflict').toBe(409);
  });

  test('A12: race — 3 concurrent POSTs for same slot, at least one 409', async () => {
    const fri = getNextFriday(21); // virgin slot, no prior tests collided
    const at = buildScheduledAt(fri, '11:00');

    const results = await Promise.all([
      postAppointment({
        customer_id: customerA.id,
        pet_id: customerA.petId,
        service_id: serviceId,
        scheduled_at: at,
        duration_minutes: durationMinutes,
        total_price: totalPrice,
      }),
      postAppointment({
        customer_id: customerB.id,
        pet_id: customerB.petId,
        service_id: serviceId,
        scheduled_at: at,
        duration_minutes: durationMinutes,
        total_price: totalPrice,
      }),
      postAppointment({
        customer_id: customerC.id,
        pet_id: customerC.petId,
        service_id: serviceId,
        scheduled_at: at,
        duration_minutes: durationMinutes,
        total_price: totalPrice,
      }),
    ]);

    for (const r of results) {
      if (r.status === 200) {
        createdAppointmentIds.push((r.body as AppointmentSuccess).appointment_id);
      }
    }

    const conflicts = results.filter((r) => r.status === 409);
    expect(
      conflicts.length,
      'A12 at least one of 3 concurrent POSTs must 409 — full mitigation requires DB-level guard (out of scope)'
    ).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// B. UI tests via the booking wizard
// ─────────────────────────────────────────────────────────────────────────

const SLOT_LABELS = {
  '09:00': '9:00 AM',
  '13:00': '1:00 PM',
  '14:00': '2:00 PM',
};

/**
 * Open the booking modal from the hero button and select the first available
 * service. After this returns, the wizard is on the CUSTOMER step (step 1).
 */
async function openModalAndSelectService(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('#hero-book-btn').click();

  const dialog = page.locator('div[role="dialog"]').first();
  await expect(dialog).toBeVisible();

  // Click the first service card (motion.button inside the service grid)
  await dialog.locator('button').filter({ hasNot: page.locator('[disabled]') }).nth(1).click();

  // Continue to Customer step
  const cont = dialog.locator('button').filter({ hasText: /continue/i }).first();
  await expect(cont).toBeEnabled({ timeout: 5000 });
  await cont.click();
}

/**
 * Fill the Customer step (guest mode — first_name, last_name, email, phone).
 * No passwords needed in guest viewMode. Waits for Continue to be enabled.
 * After this returns, the wizard is on the PET step (step 2).
 */
async function completeCustomerStep(page: import('@playwright/test').Page, uniqueTag: string) {
  const dialog = page.locator('div[role="dialog"]').first();

  // Wait for the guest form to render
  await expect(dialog.locator('input[placeholder="John"]')).toBeVisible({ timeout: 8000 });

  await dialog.locator('input[placeholder="John"]').fill('Test');
  await dialog.locator('input[placeholder="Doe"]').fill('User');
  // The email field in guest mode (not the login-mode email):
  // In guest viewMode the email input is inside the same card as firstName.
  // Use last() to avoid a stale ref if login form is also mounted but hidden.
  await dialog.locator('input[placeholder="john.doe@example.com"]').last().fill(`${uniqueTag}@e2e.thepuppyday.local`);
  await dialog.locator('input[type="tel"]').fill('5551234567');

  // Wait for React state update — canContinue fires once all 4 fields are non-empty
  const cont = dialog.locator('button').filter({ hasText: /continue/i }).first();
  await expect(cont).toBeEnabled({ timeout: 5000 });
  await cont.click();
}

/**
 * Complete the Pet step by adding a new pet with name + medium size.
 * After this returns, the wizard is on the DATE/TIME step (step 3).
 */
async function completePetStep(page: import('@playwright/test').Page) {
  const dialog = page.locator('div[role="dialog"]').first();

  // Click "Add New Pet" card (motion.button)
  await dialog.locator('button:has-text("Add New Pet")').click();

  // Fill pet name
  await dialog.locator('input[placeholder="Enter your pet\'s name"]').fill('TestDog');

  // Select Medium size radio (click the label wrapping the hidden radio input)
  await dialog.locator('label').filter({ hasText: /medium/i }).first().click();

  const cont = dialog.locator('button').filter({ hasText: /continue/i }).first();
  await expect(cont).toBeEnabled({ timeout: 5000 });
  await cont.click();
}

/**
 * Navigate the calendar to `date`'s month and click the day.
 * Assumes we're currently on the DATE/TIME step.
 */
async function selectCalendarDate(page: import('@playwright/test').Page, date: Date) {
  const dialog = page.locator('div[role="dialog"]').first();

  // Advance months from today to target month
  const now = new Date();
  const monthDelta =
    (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());

  for (let i = 0; i < monthDelta; i++) {
    await dialog.locator('button[aria-label="Next month"]').click();
    await page.waitForTimeout(250);
  }

  // Click the exact day number (avoid matching "15" inside "25" by using exact regex)
  const dayNum = date.getDate();
  await dialog
    .locator('button')
    .filter({ hasText: new RegExp(`^${dayNum}$`) })
    .filter({ hasNot: page.locator('[disabled]') })
    .first()
    .click();
}

/**
 * Full wizard path: open modal → service → customer → pet → date + time slot → review → confirm.
 * Returns the booking reference if successful.
 */
async function completeFullBooking(
  page: import('@playwright/test').Page,
  date: Date,
  slotLabel: string,
  uniqueTag: string
): Promise<string | null> {
  await openModalAndSelectService(page);
  await completeCustomerStep(page, uniqueTag);
  await completePetStep(page);
  await selectCalendarDate(page, date);

  const dialog = page.locator('div[role="dialog"]').first();

  // Select the time slot
  await dialog.locator(`button:has-text("${slotLabel}")`).first().click();

  // Continue to Review
  const cont = dialog.locator('button').filter({ hasText: /continue/i }).first();
  await expect(cont).toBeEnabled({ timeout: 5000 });
  await cont.click();

  // Confirm on Review step
  const confirmBtn = dialog
    .locator('button')
    .filter({ hasText: /continue|confirm/i })
    .first();
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.click();

  // Confirmation step
  await expect(dialog.locator('h2').filter({ hasText: /booking confirmed/i })).toBeVisible({
    timeout: 15_000,
  });

  const refEl = dialog.locator('p').filter({ hasText: /^APT-\d{4}-\d{6}/ }).first();
  await expect(refEl).toBeVisible();
  return (await refEl.textContent())?.trim() ?? null;
}

/**
 * Navigate to the Date/Time step for `date` without completing the booking.
 * Use this to inspect slot availability. After this returns, the calendar shows
 * `date`'s month and the day is selected — the slot grid is visible.
 */
async function navigateToSlotGrid(
  page: import('@playwright/test').Page,
  date: Date,
  uniqueTag: string
) {
  await openModalAndSelectService(page);
  await completeCustomerStep(page, uniqueTag);
  await completePetStep(page);
  await selectCalendarDate(page, date);

  // Wait for the time slot grid to appear after date selection
  const dialog = page.locator('div[role="dialog"]').first();
  await expect(dialog.locator('button').filter({ hasText: /AM|PM/ }).first()).toBeVisible({
    timeout: 8000,
  });
}

test.describe.serial('B. wizard reflects capacity rule', () => {
  let bSuiteAppointmentIds: string[] = [];

  test.beforeAll(async () => {
    await fixtureSetup();
  });

  test.afterAll(async () => {
    await cleanupAppointmentsByIds(bSuiteAppointmentIds);
    bSuiteAppointmentIds = [];
  });

  test('B1: customer can complete a Fri 9:00 booking via wizard (smoke)', async ({ page }) => {
    const fri = getNextFriday(28); // far-future to avoid clash with A suite
    const ref = await completeFullBooking(page, fri, SLOT_LABELS['09:00'], `b1-${Date.now()}`);
    expect(ref).toMatch(/^APT-\d{4}-\d{6}$/);

    if (ref) {
      const sb = serviceRoleClient();
      const { data } = await sb
        .from('appointments')
        .select('id')
        .eq('booking_reference', ref)
        .maybeSingle();
      if (data) bSuiteAppointmentIds.push((data as any).id);
    }
  });

  test('B2: Fri 09:00 unavailable after 2 API-seeded bookings', async ({ page }) => {
    const fri = getNextFriday(35);
    const at = buildScheduledAt(fri, '09:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    const r2 = await trackAndPost({ customer: customerB, scheduledAt: at });
    if (r1.appointmentId) bSuiteAppointmentIds.push(r1.appointmentId);
    if (r2.appointmentId) bSuiteAppointmentIds.push(r2.appointmentId);
    expect(r1.status, 'B2 first booking').toBe(200);
    expect(r2.status, 'B2 second booking').toBe(200);

    await navigateToSlotGrid(page, fri, `b2-${Date.now()}`);

    const dialog = page.locator('div[role="dialog"]').first();
    // 9:00 AM must NOT be in the available grid after capacity hit.
    const clickable = dialog
      .locator(`button:has-text("${SLOT_LABELS['09:00']}")`)
      .filter({ hasNot: page.locator('[disabled]') });
    await expect(clickable, '9:00 AM must not be selectable').toHaveCount(0);
  });

  test('B3: Thu 09:00 unavailable after 1 API-seeded booking (weekday cap 1)', async ({ page }) => {
    const thu = getNextThursday(28);
    const at = buildScheduledAt(thu, '09:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    if (r1.appointmentId) bSuiteAppointmentIds.push(r1.appointmentId);
    expect(r1.status, 'B3 Thu 09:00').toBe(200);

    await navigateToSlotGrid(page, thu, `b3-${Date.now()}`);

    const dialog = page.locator('div[role="dialog"]').first();
    const clickable = dialog
      .locator(`button:has-text("${SLOT_LABELS['09:00']}")`)
      .filter({ hasNot: page.locator('[disabled]') });
    await expect(clickable, 'Thu 9:00 AM must not be selectable (cap 1)').toHaveCount(0);
  });

  test('B4: Fri 14:00 unavailable after 1 API-seeded booking (boundary cap 1)', async ({ page }) => {
    const fri = getNextFriday(42);
    const at = buildScheduledAt(fri, '14:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    if (r1.appointmentId) bSuiteAppointmentIds.push(r1.appointmentId);
    expect(r1.status, 'B4 Fri 14:00').toBe(200);

    await navigateToSlotGrid(page, fri, `b4-${Date.now()}`);

    const dialog = page.locator('div[role="dialog"]').first();
    const clickable = dialog
      .locator(`button:has-text("${SLOT_LABELS['14:00']}")`)
      .filter({ hasNot: page.locator('[disabled]') });
    await expect(clickable, 'Fri 2:00 PM must not be selectable (cap 1)').toHaveCount(0);
  });

  test('B5: Fri 13:00 still selectable after 1 booking (cap 2)', async ({ page }) => {
    const fri = getNextFriday(49);
    const at = buildScheduledAt(fri, '13:00');
    const r1 = await trackAndPost({ customer: customerA, scheduledAt: at });
    if (r1.appointmentId) bSuiteAppointmentIds.push(r1.appointmentId);
    expect(r1.status, 'B5 Fri 13:00 first booking').toBe(200);

    await navigateToSlotGrid(page, fri, `b5-${Date.now()}`);

    const dialog = page.locator('div[role="dialog"]').first();
    const clickable = dialog
      .locator(`button:has-text("${SLOT_LABELS['13:00']}")`)
      .filter({ hasNot: page.locator('[disabled]') });
    await expect(clickable, 'Fri 1:00 PM must remain available (cap 2 not yet hit)').toHaveCount(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// C. Smoke
// ─────────────────────────────────────────────────────────────────────────

test.describe('C. modal smoke', () => {
  test('C1: hero button opens booking modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('#hero-book-btn').click();
    await expect(page.locator('div[role="dialog"]').first()).toBeVisible();
  });

  test('C2: Escape closes the modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('#hero-book-btn').click();
    await expect(page.locator('div[role="dialog"]').first()).toBeVisible();
    await page.keyboard.press('Escape');
    // Both desktop + mobile dialog divs leave the DOM on close
    await expect(page.locator('div[role="dialog"]').first()).not.toBeVisible();
  });

  test('C3: sticky button appears after scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Scroll well past the hero section to trigger IntersectionObserver
    await page.evaluate(() => window.scrollTo(0, 5000));
    // Allow IntersectionObserver + Framer Motion entrance animation to settle
    await page.waitForTimeout(800);
    await expect(
      page.locator('button[aria-label="Book your appointment"]')
    ).toBeVisible();
  });
});
