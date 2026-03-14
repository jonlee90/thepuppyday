# Shared Email Layout with Mood System - Implementation Tasks

## Overview

Redesign the shared email template system with mood-based visual differentiation, branded header/footer, pet hero sections, and new CTA component functions. All changes are confined to 3 TypeScript/HTML files with no database or API modifications.

**Progress**: 7/8 tasks complete (87.5%)

**Document References**:
- Requirements: `docs/specs/notification-templates/requirements.md`
- Design: `docs/specs/notification-templates/design.md`

---

## Section 1: HTML Shell Redesign

### Task 0068: Redesign email-base.html Header, Accent Strip, Mood Placeholder, and Footer ✅ 2026-03-13
- [x] Replace the plain text header with charcoal (#434E54) background block containing paw print emoji (`&#x1F43E;`), "The Puppy Day" in Georgia serif cream (#F8EEE5) text, and "Professional Dog Grooming" subtitle in gold (#D4A574) uppercase
- [x] Update the gold accent strip from solid `background-color` to gradient with solid fallback: `background-color: #D4A574; background-image: linear-gradient(to right, #D4A574, #E8C9A0, #D4A574);`
- [x] Add `{{MOOD_BANNER}}` placeholder between the gold accent strip and the spacer row
- [x] Update footer: replace `border-top: 1px solid #E5E5E5` with gold gradient divider, change muted text and unsubscribe link color from `#9CA3AF` to `#6B7280`, update hours text to `#6B7280`
- [x] Update CSS `.button` class: `border-radius: 8px` to `border-radius: 50px`, `background-color: #434E54` to `background-color: #D4A574`, add `font-weight: 600`
- [x] Update CSS `.button-secondary` class: `border-radius: 8px` to `border-radius: 50px`, `border: 1px solid #434E54` to `border: 2px solid #D4A574`, `color: #434E54` to `color: #D4A574`
- [x] Update CSS `.footer-muted` color from `#9CA3AF` to `#6B7280`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: HTML file contains charcoal header with paw emoji, gold gradient strip, `{{MOOD_BANNER}}` placeholder, updated footer with #6B7280 contrast, pill-shaped button CSS classes
- **References**: REQ-MOOD-2, Design 4.1
- **Files**: `src/lib/notifications/templates/email-base.html`

---

## Section 2: email-base.ts Mood System and Components

### Task 0069: Add Mood Type System and Update EmailBaseOptions ✅ 2026-03-13
- [x] Add `EmailMood` type: `'celebration' | 'reminder' | 'urgent' | 'info' | 'warning' | 'success'`
- [x] Add `MoodConfig` interface with `backgroundColor`, `textColor`, `emoji`, `defaultTitle`
- [x] Add `MOOD_CONFIGS` constant with all 6 mood configurations (exact colors and emojis from design doc section 3.1)
- [x] Update `EmailBaseOptions` interface to add optional `mood?: EmailMood` and `moodTitle?: string` properties
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Types compile without errors; `MOOD_CONFIGS` contains all 6 moods with correct colors/emojis; `EmailBaseOptions` is backward-compatible (new fields are optional)
- **References**: REQ-MOOD-1, REQ-MOOD-7, Design 3.1, Design 3.2
- **Files**: `src/lib/notifications/email-base.ts`

### Task 0070: Add generateMoodBanner and Update wrapEmailContent ✅ 2026-03-13
- [x] Add internal `generateMoodBanner(mood, title?)` function that produces the mood banner HTML (colored rounded box with emoji and title text, per design doc section 3.5)
- [x] Update `wrapEmailContent()` to generate mood banner HTML when `options.mood` is set, with validation that the mood exists in `MOOD_CONFIGS` (fallback to empty string for invalid moods)
- [x] Add `{{MOOD_BANNER}}` replacement in the `.replace()` chain (before `{{CONTENT}}`)
- [x] Update `getFallbackTemplate()` to include `{{MOOD_BANNER}}` placeholder between header and content
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: `wrapEmailContent(html)` with no mood produces no banner (empty replacement); `wrapEmailContent(html, { mood: 'celebration' })` produces banner with `#FFF8F0` background; invalid mood values produce no banner; fallback template includes `{{MOOD_BANNER}}`
- **References**: REQ-MOOD-3, REQ-MOOD-7, Design 3.4, Design 3.5, Design 6.1, Design 6.2
- **Files**: `src/lib/notifications/email-base.ts`

### Task 0071: Add 7 New Component Functions and Update Existing Buttons ✅ 2026-03-13
- [x] Add `createPetHero(petName, context?)` -- centered dog emoji, pet name in Georgia serif h2, optional context subtitle; all params escaped via `escapeHtml()` (design section 3.3)
- [x] Add `createPrimaryCTA(text, url)` -- gold (#D4A574) pill button with VML roundrect fallback for Outlook, box-shadow (design section 3.3)
- [x] Add `createSecondaryCTA(text, url)` -- outlined pill with gold border, transparent background (design section 3.3)
- [x] Add `createDangerCTA(text, url)` -- red (#DC2626) pill button with VML roundrect fallback (design section 3.3)
- [x] Add `createTimeComparison(oldDate, oldTime, newDate, newTime)` -- vertical stacked layout with strikethrough old time and highlighted new time; all 4 params escaped (design section 3.3)
- [x] Add `createDivider()` -- gold gradient horizontal rule with solid fallback (design section 3.3)
- [x] Add `createTip(text)` -- cream background callout with paw emoji prefix and gold left border; text escaped (design section 3.3)
- [x] Update `createButton()` inline styles: `background-color` from `#434E54` to `#D4A574`, `border-radius` from `8px` to `50px`, add `box-shadow`, `font-weight` from `500` to `600` (design section 3.6)
- [x] Update `createSecondaryButton()` inline styles: `border-radius` from `8px` to `50px`, `border` from `1px solid #434E54` to `2px solid #D4A574`, `color` from `#434E54` to `#D4A574` (design section 3.6)
- [x] Update `createWarmButton()` inline styles: `border-radius` from `8px` to `50px` (design section 3.6)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All 7 new functions are exported; all escape user input via `escapeHtml()`; VML fallbacks present in `createPrimaryCTA` and `createDangerCTA`; existing `createButton`/`createSecondaryButton`/`createWarmButton` signatures unchanged but produce updated gold pill styling
- **References**: REQ-MOOD-4, REQ-MOOD-6, REQ-MOOD-7, Design 3.3, Design 3.6
- **Files**: `src/lib/notifications/email-base.ts`

---

## Section 3: Template Function Updates

### Task 0072: Update Celebration and Success Templates (4 templates) ✅ 2026-03-13
- [x] Update `generateBookingConfirmationEmail`: add `mood: 'celebration'` to `wrapEmailContent()`, add `createPetHero(pet_name, 'Grooming Booked')`, replace `createButton` with `createPrimaryCTA`, add `createDivider()` between content sections
- [x] Update `generateReportCardEmail`: add `mood: 'celebration'` and `moodTitle: 'Looking Fresh!'`, add `createPetHero(pet_name, 'Looking Fresh')`, move photos before text content, replace button with `createPrimaryCTA`
- [x] Update `generateReviewRequestEmail`: add `mood: 'celebration'`, add `createPetHero(pet_name, 'Thanks for Visiting')`, replace primary button with `createPrimaryCTA`, add `createSecondaryCTA` for secondary action
- [x] Update `generatePaymentSuccessEmail`: add `mood: 'success'` to `wrapEmailContent()`
- [x] Update imports at top of file to include new component functions: `createPetHero`, `createPrimaryCTA`, `createSecondaryCTA`, `createDangerCTA`, `createTimeComparison`, `createDivider`, `createTip`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All 4 templates pass `mood` to `wrapEmailContent()`; booking confirmation, report card, and review request include pet hero sections; review request has both primary and secondary CTAs; all templates still return valid `{html, text, subject}`
- **References**: REQ-MOOD-5, Design 4.2
- **Files**: `src/lib/notifications/email-templates.ts`

### Task 0073: Update Reminder Templates (3 templates) ✅ 2026-03-13
- [x] Update `generateAppointmentReminderEmail`: add `mood: 'reminder'`, add `createPetHero(pet_name, 'Appointment Tomorrow')`, replace button with `createPrimaryCTA`, add `createTip('Arrive 5 minutes early for a stress-free check-in')`
- [x] Update `generateRetentionReminderEmail`: add `mood: 'reminder'`, add `createPetHero(pet_name, 'Time for a Trim')`, replace button with `createPrimaryCTA`, add `createTip` with grooming advice
- [x] Update `generateAppointmentRescheduledEmail`: add `mood: 'info'`, replace side-by-side date layout with `createTimeComparison(oldDate, oldTime, newDate, newTime)`, replace button with `createPrimaryCTA`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Reminder templates include pet hero and tip components; rescheduled template uses vertical `createTimeComparison` instead of side-by-side columns; all templates pass correct mood
- **References**: REQ-MOOD-5, Design 4.2
- **Files**: `src/lib/notifications/email-templates.ts`

### Task 0074: Update Warning, Info, and Urgent Templates (6 templates) ✅ 2026-03-13
- [x] Update `generatePaymentFailedEmail`: add `mood: 'warning'`, replace button with `createDangerCTA`
- [x] Update `generatePaymentReminderEmail`: add `mood: 'info'`
- [x] Update `generatePaymentFinalNoticeEmail`: add `mood: 'warning'`, replace button with `createDangerCTA`, keep existing `createUrgencyBox` usage
- [x] Update `generateAppointmentCancelledEmail`: add `mood: 'info'`, add `createPetHero(pet_name, 'Appointment Cancelled')`, replace button with `createPrimaryCTA` for rebooking
- [x] Update `generateWaitlistAddedEmail`: add `mood: 'info'`
- [x] Update `generateWaitlistAvailableEmail`: add `mood: 'urgent'`, replace button with `createPrimaryCTA`, keep existing `createUrgencyBox` usage
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Payment failed and final notice use red danger CTAs; cancelled appointment includes pet hero; waitlist available uses urgent mood; all 6 templates pass correct mood to `wrapEmailContent()`
- **References**: REQ-MOOD-5, Design 4.2
- **Files**: `src/lib/notifications/email-templates.ts`

---

## Section 4: Testing and Verification

### Task 0075: Write Unit Tests for email-base.ts Mood System and Components
- [ ] Test `wrapEmailContent` with no mood (backward compat): verify `{{MOOD_BANNER}}` replaced with empty string
- [ ] Test `wrapEmailContent` with each of the 6 mood types: verify correct `backgroundColor` and emoji in output HTML
- [ ] Test `wrapEmailContent` with custom `moodTitle`: verify custom title overrides default
- [ ] Test `wrapEmailContent` with invalid mood: verify graceful fallback (no banner, no error)
- [ ] Test `createPetHero` renders pet name in Georgia serif, optional context subtitle, and escapes HTML in inputs
- [ ] Test `createPrimaryCTA` renders `#D4A574` background, `border-radius: 50px`, VML roundrect fallback
- [ ] Test `createSecondaryCTA` renders gold border, transparent background
- [ ] Test `createDangerCTA` renders `#DC2626` background, VML roundrect fallback
- [ ] Test `createTimeComparison` renders vertical layout with `line-through` on old date and bold serif on new date; escapes all 4 params
- [ ] Test `createDivider` renders gold gradient with solid fallback
- [ ] Test `createTip` renders paw emoji prefix, cream background, left border; escapes text input
- [ ] Test `createButton` now uses gold pill style (backward compat -- same signature, updated styling)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All tests pass via `npm run test -- --testPathPattern=email-base`; covers mood system, all 7 new components, and backward-compatible button updates
- **References**: Design 7.1
- **Files**: `src/lib/notifications/__tests__/email-base.test.ts`

### Task 0076: Write Integration Tests for email-templates.ts and Run Build Verification
- [ ] Test `generateBookingConfirmationEmail` output contains celebration mood banner (`#FFF8F0`) and pet hero
- [ ] Test `generatePaymentFailedEmail` output contains warning mood banner (`#FEF2F2`) and red danger CTA (`#DC2626`)
- [ ] Test `generateAppointmentRescheduledEmail` output contains `createTimeComparison` vertical layout with `line-through`
- [ ] Test `generateAppointmentReminderEmail` output contains tip callout with paw emoji
- [ ] Test `generateReviewRequestEmail` output contains both primary gold CTA and outlined secondary CTA
- [ ] Test `generateWaitlistAvailableEmail` output contains urgent mood banner and urgency box
- [ ] Parameterized test: all 13 templates return valid `{html, text, subject}` with non-empty values
- [ ] Parameterized test: all 13 templates include `{{UNSUBSCRIBE_LINK}}` or actual unsubscribe link in output
- [ ] Run `npm run build` -- verify no TypeScript compilation errors
- [ ] Run `npm run lint` -- verify no lint errors
- [ ] Run `npm run test -- --testPathPattern=email` -- verify all email tests pass
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All integration tests pass; build compiles cleanly; lint passes; no regressions in existing email template tests
- **References**: Design 7.2, Design 7.4
- **Files**: `src/lib/notifications/__tests__/email-templates.test.ts`
