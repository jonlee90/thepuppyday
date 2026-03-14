# Customer Detail Page Redesign - Implementation Tasks

## Overview

Redesign the admin customer detail page (`/admin/customers/[id]`) from a 5-section vertically stacked layout into a hero + 2-column layout. The redesign surfaces safety-critical information (flags, medical info) without scrolling, provides at-a-glance customer metrics, and aligns with the admin UI design patterns (Framer Motion animations, AdminButton, warm palette, focus-trapped modals).

**Progress**: 9/10 tasks complete (90%)

**Document References**:
- Design: `docs/specs/customer-detail-redesign/design.md`

---

## Phase 1: Extract Shared Utilities (non-breaking)

### Task 0059: Export CustomerMetrics, AppointmentWithDetails, and calculateCustomerMetrics from AppointmentHistoryList
- [x] Add and export `CustomerMetrics` interface (fields: `total_appointments`, `total_spent`, `favorite_service`, `avg_visit_frequency_days`) at the top of the file
- [x] Add and export `AppointmentWithDetails` interface with base appointment fields + joined `pet`, `service`, `addons`, `report_card` (per design section 3.1)
- [x] Add and export `calculateCustomerMetrics(appointments: AppointmentWithDetails[]): CustomerMetrics` function using single-pass `for` loop (per design section 4.4 -- computes total spent, favorite service, avg visit frequency from completed appointments)
- [x] Do NOT change the component's props, internal state, or rendering -- existing page must work unchanged
- [x] Verify `npm run build` passes
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Three new named exports (`CustomerMetrics`, `AppointmentWithDetails`, `calculateCustomerMetrics`) are importable from `./AppointmentHistoryList`; existing page renders identically; build passes
- **References**: Design 4.4, Design 3.1
- **Files**: `src/components/admin/customers/AppointmentHistoryList.tsx`

---

## Phase 2: Create New Standalone Components (non-breaking)

### Task 0060: Create PetCard Component
- [x] Create `src/components/admin/customers/PetCard.tsx` with props: `{ pet: PetWithBreed, index: number, lastGroomDate?: string | null, lastGroomService?: string | null, onBook: (petId: string) => void }`
- [x] Implement size-based accent strip: Small=`bg-[#7CB9E8]`, Medium=`bg-[#77BFA3]`, Large=`bg-[#D4A574]`, XLarge=`bg-[#C97B63]`
- [x] Render pet identity row: PawPrint icon + pet name + `AdminButton variant="ghost" size="xs"` Book button (right-aligned)
- [x] Render details line: breed (`pet.breed?.name || pet.breed_custom || 'Unknown'`), size label (via `getSizeLabel`), gender, color -- joined with ` . ` separator, omitting falsy values
- [x] Render **always-visible** medical info box when `pet.medical_info` is truthy: `bg-amber-50/80 border-l-4 border-amber-400 p-3 rounded-r-lg` with `AlertTriangle` icon and text in `text-sm text-amber-800`
- [x] Render optional notes and last groom info (formatted date + service name) in muted text
- [x] Add staggered Framer Motion entrance: `initial={{ opacity: 0, y: 16 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ delay: index * 0.05, duration: 0.3 }}`
- [x] Card wrapper: `bg-white rounded-2xl shadow-sm overflow-hidden`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Component renders correctly with all pet data variations (with/without medical info, with/without breed, all 4 size colors); medical info is always visible (no collapse/expand); build passes (component not yet imported by any page)
- **References**: Design 4.2, Design 9.2, Design 9.3
- **Files**: `src/components/admin/customers/PetCard.tsx`

### Task 0061: Create CustomerHero Component
- [x] Create `src/components/admin/customers/CustomerHero.tsx` with props: `{ customer: CustomerDetail, metrics: CustomerMetrics, onBookAppointment: () => void, onAddPet: () => void }`
- [x] Render accent strip: `h-1.5 bg-gradient-to-r from-[#D4A574] to-[#E8C49A]`
- [x] Render avatar with initials: `w-16 h-16 rounded-xl bg-[#EAE0D5] text-[#434E54] text-xl font-bold`
- [x] Render customer name (`text-2xl font-bold text-[#434E54]`), email (or "Walk-in (phone only)" italic gray if `isWalkinPlaceholderEmail` returns true), formatted phone, "Customer since" date
- [x] Render flag badges using existing `CustomerFlagBadge` component with `maxVisible={5}` and `size="md"`
- [x] Render stats row: 4 items (Visits, Spent, Favorite Service, Avg Frequency) with `w-px h-8 bg-[#F0EAE0]` dividers, `text-2xl font-bold` values, `text-[10px] uppercase tracking-wider text-[#434E54]/50` labels
- [x] Render action buttons: `AdminButton variant="primary" size="sm"` (Book Appointment) + `AdminButton variant="secondary" size="sm"` (Add Pet)
- [x] Desktop layout (lg+): horizontal flow with avatar+info left, flags inline, stats row, actions right
- [x] Mobile layout (< lg): stack vertically -- avatar+info, flags row, stats as 2x2 grid, full-width action buttons
- [x] Framer Motion entrance: `initial={{ opacity: 0, y: 16 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.3 }}`
- [x] Card wrapper: `bg-white rounded-2xl shadow-sm overflow-hidden`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Hero displays customer identity, flags, metrics, and action buttons; walk-in emails show "Walk-in (phone only)"; stats show formatted values or "N/A" when null; responsive layout works at both breakpoints; build passes (component not yet imported by any page)
- **References**: Design 4.1, Design 9.1, Design 9.2
- **Files**: `src/components/admin/customers/CustomerHero.tsx`

---

## Phase 3: Refactor AppointmentHistoryList (breaking change, coordinated with CustomerProfile rewrite)

### Task 0062: Convert AppointmentHistoryList to Data-Driven Props and Remove Metrics Cards
- [x] Change component props to `AppointmentHistoryListProps`: `{ appointments: AppointmentWithDetails[], loading: boolean, error: string, onRefresh: () => void }`
- [x] Remove internal state: `appointments`, `loading`, `error` useState hooks
- [x] Remove `fetchAppointments` function and its `useEffect`
- [x] Remove the 4 metric cards section (current lines ~190-246) -- metrics now live in CustomerHero
- [x] Keep: `statusFilter` state, `filteredAppointments` useMemo, appointment card rendering, `AppointmentDetailModal` (dynamic import), all filter/display logic
- [x] Update the refresh button (if any) to call `onRefresh` prop instead of internal `fetchAppointments`
- [x] Update the empty state and error state to use the prop values
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Component accepts data via props; no internal fetch logic; no metrics cards; filter and appointment card display works with passed-in data; this task is coordinated with Task 0063 (they must be committed together since this is a breaking prop change)
- **References**: Design 4.4, Design 10 Phase 3 Step 3.1
- **Files**: `src/components/admin/customers/AppointmentHistoryList.tsx`

### Task 0063: Rewrite CustomerProfile as Hero + 2-Column Layout Orchestrator
- [x] Rewrite `src/components/admin/customers/CustomerProfile.tsx` with parallel data fetching via `Promise.all` for customer + appointments endpoints
- [x] Compute metrics with `useMemo(() => calculateCustomerMetrics(appointments), [appointments])`
- [x] Use module-level constants: `EMPTY_APPOINTMENTS` array, hoisted `LoadingState` JSX
- [x] Render full-width `CustomerHero` above a `grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6` layout
- [x] Left sidebar (`lg:sticky lg:top-6 lg:self-start space-y-6`): Pets section (PetCard list with empty state), Contact section (inline edit with `usePhoneMask`), Loyalty section (warm palette progress bar), Flags section (compact list with add/remove)
- [x] Each sidebar card: `motion.div` with `y: 16` slide-up, accent strip, `bg-white rounded-2xl shadow-sm overflow-hidden`
- [x] Right main: `AppointmentHistoryList` with data-driven props
- [x] Fix bug: replace `console.error` on contact save failure with `toast.error('Failed to update customer')` + add `toast.success('Customer updated')` on success
- [x] Fix bug: replace `console.error` on flag removal failure with `toast.error('Failed to remove flag')` + add `toast.success('Flag removed')` on success
- [x] Remove `useEffect` phone sync -- derive phone value in `handleSaveContact` from `phoneInput.rawValue`
- [x] Replace ALL inline `<button>` elements with `AdminButton` (appropriate variants/sizes)
- [x] Replace `bg-green-50`/`bg-blue-50` in loyalty section with warm palette: `bg-[#FFFBF7]` content bg, `bg-[#EAE0D5]` track, `bg-gradient-to-r from-[#D4A574] to-[#E8C49A]` fill
- [x] Dynamic imports: `AppointmentDetailModal` via `next/dynamic` with `{ ssr: false }`, `CustomerFlagForm` via dynamic `import()`
- [x] Error handling: if customer fetch fails, show full-page error; if only appointments fail, show hero + sidebar with error passed to appointment list
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Page loads with parallel API calls (verify in Network tab); hero displays above 2-column grid; sidebar is sticky on desktop; all mutations show toast notifications; no raw `<button>` elements; no `bg-green-50`/`bg-blue-50` remnants; no `useEffect` phone sync; `npm run build` passes
- **References**: Design 4.3, Design 6, Design 8, Design 10 Phase 3 Step 3.2
- **Files**: `src/components/admin/customers/CustomerProfile.tsx`

---

## Phase 4: Polish Existing Components

### Task 0064: Upgrade CustomerFlagForm Modal to Admin Pattern (AnimatePresence, Focus Trap, Warm Header/Footer)
- [x] Wrap modal with `AnimatePresence` + `motion.div` overlay (`initial/animate/exit` opacity) + `motion.div` panel (`initial/animate/exit` opacity + scale 0.95 + y: 16)
- [x] Use `<div role="dialog" aria-modal="true">` (NEVER `<dialog>` element)
- [x] Add warm header: `bg-[#EAE0D5] rounded-t-2xl` with `Flag` icon in `p-2.5 rounded-xl bg-white/60` container
- [x] Add warm footer: `bg-[#EAE0D5]/30 rounded-b-2xl` with `AdminButton` Cancel (secondary) + Submit (primary, with isLoading)
- [x] Replace all inline `<button>` with `AdminButton`
- [x] Add `createFocusTrap` from `@/lib/accessibility/focus` via `useEffect`/`useRef` -- activate on open, deactivate on close
- [x] Add body scroll lock: `document.body.style.overflow = 'hidden'` on open, restore original value on close
- [x] Add `Escape` key handler to close modal
- [x] Add backdrop click to close: `onClick={(e) => e.target === e.currentTarget && handleClose()}`
- [x] Apply the same modal pattern to `RemoveFlagConfirmation` component: `AlertTriangle` icon in header, `AdminButton variant="danger"` for confirm, focus trap, scroll lock, Escape handler
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Both modals animate in/out with Framer Motion; focus is trapped within modal; Escape closes modal; body scroll is locked; warm header/footer styling matches StaffForm reference; all buttons are AdminButton; `npm run build` passes
- **References**: Design 4.5, Design 12
- **Files**: `src/components/admin/customers/CustomerFlagForm.tsx`

### Task 0065: Simplify page.tsx -- Remove Heading and Description
- [x] In `src/app/admin/customers/[id]/page.tsx`, remove the "Customer Profile" heading and description text
- [x] Keep only the back link (`ChevronLeft` + "Back to Customers" linking to `/admin/customers`) and `<CustomerProfile customerId={id} />`
- [x] Update `params` type to `Promise<{ id: string }>` and `await params` (Next.js 16 pattern)
- [x] Keep existing `metadata` export
- [x] Wrap in `<div className="space-y-4">`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Page renders with only back link + CustomerProfile; no duplicate heading since hero now handles customer identification; `npm run build` passes
- **References**: Design 4.6, Design 10 Phase 3 Step 3.4
- **Files**: `src/app/admin/customers/[id]/page.tsx`

---

## Phase 5: Verification

### Task 0066: Build Verification and Visual QA
- [x] Run `npm run build` and verify no compilation errors (OOM is pre-existing known issue)
- [x] Run `npm run lint` and verify no lint errors in modified files — 0 errors, 0 warnings
- [x] Verify no `console.error` calls remain in CustomerProfile.tsx (all replaced with toast)
- [x] Verify no raw `<button>` elements in CustomerProfile.tsx (all replaced with AdminButton)
- [x] Verify no `bg-green-50` or `bg-blue-50` classes in CustomerProfile.tsx (all replaced with warm palette)
- [x] Verify `AppointmentHistoryList` no longer has internal fetch logic or metrics cards
- [x] Verify `CustomerFlagForm` and `RemoveFlagConfirmation` both use AnimatePresence + focus trap
- **Agent**: `@agent-code-reviewer`
- **Acceptance Criteria**: Build succeeds; lint passes; all design system compliance checks pass; no regressions in existing functionality
- **References**: Design 7.2, Design 10 Phase 4
- **Files**: All files from Tasks 0059-0065

### Task 0067: Responsive Layout and Accessibility Testing
- [ ] Test at 1440px desktop: hero visible without scrolling, 2-column layout, sticky sidebar
- [ ] Test at 1024px (lg breakpoint): 2-column layout activates
- [ ] Test at 375px mobile: single-column stacked, hero stats in 2x2 grid, full-width buttons
- [ ] Verify flag modals: Tab cycles within modal (focus trap), Escape closes, body scroll locked
- [ ] Verify walk-in customer displays "Walk-in (phone only)" in hero
- [ ] Verify empty states: no pets (PawPrint + "No pets registered"), no appointments, no loyalty, no flags
- [ ] Verify pet medical info is always visible (no expand/collapse)
- [ ] Verify both API calls fire in parallel (check Network tab)
- [ ] Verify AppointmentDetailModal loads only when appointment clicked (check Network bundle)
- **Agent**: `@agent-code-reviewer`
- **Acceptance Criteria**: All items in design doc section 7.1 (Manual Testing Checklist) pass; responsive layout correct at all breakpoints; accessibility requirements from design section 12 met
- **References**: Design 7.1, Design 11, Design 12
- **Files**: All files from Tasks 0059-0065

---

## Dependency Graph

```
Task 0059 (extract shared utilities)
  |
  v
Task 0060 (PetCard) ----+
Task 0061 (CustomerHero) +-- can run in parallel, both depend on 0059
  |                       |
  v                       v
Task 0062 (refactor AppointmentHistoryList) --+-- must be committed together
Task 0063 (rewrite CustomerProfile) ----------+
  |
  v
Task 0064 (upgrade CustomerFlagForm modals) -- depends on 0063
Task 0065 (simplify page.tsx) -- depends on 0063
  |
  v
Task 0066 (build verification) -- depends on all above
Task 0067 (responsive + accessibility testing) -- depends on 0066
```
