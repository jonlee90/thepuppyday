# Customer Detail Page Redesign — Design Document

## Overview

Redesign `/admin/customers/[id]` from 5 stacked white cards into a hero + 2-column layout that surfaces safety-critical information (flags, medical info) without scrolling, provides at-a-glance customer metrics, and follows the project's admin UI patterns (Framer Motion, AdminButton, warm palette, focus-trapped modals).

## Problem Statement

| Problem | Impact |
|---------|--------|
| Flags buried in section 4 (~800px scroll) | Safety risk — aggressive_dog not visible on load |
| No hero/summary | Admin can't confirm right customer at a glance |
| Single-column vertical stacking | Wasted screen real estate on 1440px+ desktops |
| Pets are text-only, medical info collapsed | Central business entity underserved; safety data hidden |
| `console.error` on contact save failure (L137, L208) | Silent errors — violates toast notification rule |
| No quick actions (Book, Add Pet) | Extra navigation required for common tasks |
| Metrics nested inside AppointmentHistoryList | No at-a-glance KPIs; coupled component responsibility |
| No Framer Motion animations | Inconsistent with admin UI patterns |
| Inline buttons instead of AdminButton | Inconsistent with design system |
| `bg-green-50`/`bg-blue-50` in loyalty section | Off-palette — should use warm design system colors |

---

## Architecture

### Component Tree (After Redesign)

```
page.tsx (Server Component)
└── CustomerProfile (Client — orchestrator)
    ├── CustomerHero (NEW — full width)
    │   ├── Avatar + Name + Contact inline
    │   ├── Flag badges (CustomerFlagBadge)
    │   ├── Stats row (metrics from appointments)
    │   └── Action buttons (Book Appointment, Add Pet)
    ├── Sidebar (left column, lg:sticky)
    │   ├── Pets section
    │   │   └── PetCard[] (NEW — per pet)
    │   ├── Contact info section (compact, edit inline)
    │   ├── Loyalty section (compact progress bar)
    │   └── Flags section (compact list + add)
    └── Main content (right column)
        └── AppointmentHistoryList (EDITED — metrics removed)
            ├── Filters
            ├── Appointment cards
            └── AppointmentDetailModal (dynamic import)
```

### Data Flow

```
CustomerProfile
  ├── fetch(`/api/admin/customers/${id}`) → customer, pets, flags, loyalty
  ├── fetch(`/api/admin/customers/${id}/appointments`) → appointments[]
  │
  ├── useMemo → metrics (from appointments) → passed to CustomerHero
  ├── customer/pets/flags/loyalty → passed to sidebar sections
  └── appointments + filters → passed to AppointmentHistoryList
```

**Key change**: CustomerProfile now fetches appointments (previously AppointmentHistoryList fetched its own). This allows metrics to be computed once and shared between Hero and History list. Both fetches run in parallel via `Promise.all`.

---

## New Components

### 1. CustomerHero

**File**: `src/components/admin/customers/CustomerHero.tsx`

**Props**:
```ts
interface CustomerHeroProps {
  customer: CustomerDetail;
  metrics: CustomerMetrics;
  onBookAppointment: () => void;
  onAddPet: () => void;
}
```

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ h-1.5 accent strip (gradient from-[#D4A574] to-[#E8C49A])     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [JK]  Jon Kim           [VIP] [Aggressive Dog]                │
│        jon@email.com | (213) 555-1234                          │
│        Customer since Mar 2026                                  │
│                                                                 │
│  ┌──────────┬──────────┬──────────┬──────────┐   [Book Appt]  │
│  │ 3 Visits │ $240.00  │ Premium  │ 45 days  │   [Add Pet]   │
│  │          │  Spent   │ Grooming │ avg freq │                │
│  └──────────┴──────────┴──────────┴──────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

**Design tokens**:
- Card: `bg-white rounded-2xl shadow-sm overflow-hidden`
- Accent strip: `h-1.5 bg-gradient-to-r from-[#D4A574] to-[#E8C49A]`
- Avatar: `w-16 h-16 rounded-xl bg-[#EAE0D5] text-[#434E54] text-xl font-bold` (initials)
- Name: `text-2xl font-bold text-[#434E54]`
- Contact: `text-sm text-[#434E54]/70` with `|` separator
- Stats: `text-2xl font-bold text-[#434E54]` values, `text-[10px] uppercase tracking-wider text-[#434E54]/50` labels, `w-px h-8 bg-[#F0EAE0]` dividers
- Action buttons: `AdminButton` primary (Book) + secondary (Add Pet), both `size="sm"`
- Flag badges: `CustomerFlagBadge` with `maxVisible={5}` and `size="md"` — aggressive_dog always first, pulsing red
- Walk-in email handling: Show "Walk-in (phone only)" in italic gray instead of placeholder email

**Animation**: `motion.div` with `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}`

**Responsive**:
- Desktop (lg+): Horizontal layout — avatar+info left, stats center, actions right
- Mobile: Stack vertically — avatar+info, flags, stats (2x2 grid), actions (full width)

---

### 2. PetCard

**File**: `src/components/admin/customers/PetCard.tsx`

**Props**:
```ts
interface PetCardProps {
  pet: Pet & { breed?: { name: string } };
  index: number;
  lastGroomDate?: string | null;
  lastGroomService?: string | null;
  onBook: (petId: string) => void;
}
```

**Layout**:
```
┌─────────────────────────────────────────────┐
│ h-1.5 accent strip (colored by size)        │
├─────────────────────────────────────────────┤
│  [🐾]  Cafe                    [Book ▸]    │
│        Chihuahua · Large · Female · Brown   │
│                                             │
│  ┌─ Medical ──────────────────────────────┐ │
│  │ ⚠ Sensitive skin, use hypoallergenic  │ │
│  │   shampoo                              │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  Notes: Prefers gentle handling             │
│  Last groom: Mar 10 — Premium Grooming      │
└─────────────────────────────────────────────┘
```

**Design tokens**:
- Card: `bg-white rounded-xl shadow-sm border border-[#F0EAE0] overflow-hidden`
- Size-based accent strip color:
  - Small: `bg-[#7CB9E8]` (soft blue)
  - Medium: `bg-[#77BFA3]` (soft green)
  - Large: `bg-[#D4A574]` (warm tan — matches design system)
  - X-Large: `bg-[#C97B63]` (warm terracotta)
- Pet icon: `PawPrint` in `w-10 h-10 rounded-lg bg-[#EAE0D5]` — or `photo_url` if available (future)
- Name: `text-base font-semibold text-[#434E54]`
- Details: `text-sm text-[#434E54]/70`, joined with `·` separator
- Size badge: `px-2 py-0.5 rounded-full bg-[#EAE0D5] text-[#434E54] text-xs font-medium`
- Medical info: **Always visible** (safety-critical), `bg-amber-50/80 border-l-4 border-amber-400 p-3 rounded-r-lg text-sm text-amber-800` — with `AlertTriangle` icon
- Notes: `text-sm text-[#434E54]/70`
- Last groom: `text-xs text-[#434E54]/50`
- Book button: `AdminButton variant="ghost" size="xs"`

**Animation**: `motion.div` with staggered entrance: `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}`

**Empty state**: `PawPrint` icon in gray + "No pets registered" + `AdminButton` "Add Pet"

---

## Modified Components

### 3. CustomerProfile (REWRITE)

**File**: `src/components/admin/customers/CustomerProfile.tsx`

**Key Changes**:

1. **Parallel data fetching**: CustomerProfile fetches both customer data AND appointments via `Promise.all`
2. **Metrics computed at this level**: `useMemo` computes `CustomerMetrics` from appointments, shared to Hero
3. **2-column layout**: `grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6`
4. **Sticky sidebar**: `lg:sticky lg:top-6 lg:self-start`
5. **Dynamic imports**: `AppointmentDetailModal` via `next/dynamic`, `CustomerFlagForm` via dynamic `import()`
6. **Toast notifications**: Replace `console.error` with `toast.error()`/`toast.success()`
7. **AdminButton**: Replace all inline `<button>` elements
8. **Warm palette**: Replace `bg-green-50`/`bg-blue-50` in loyalty section
9. **Framer Motion**: `AnimatePresence` + `motion.div` for all sections
10. **Derived phone state**: Remove `useEffect` phone sync — derive during render

**State**:
```ts
// Data
const [customer, setCustomer] = useState<CustomerDetail | null>(null);
const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

// Contact editing
const [isEditingContact, setIsEditingContact] = useState(false);
const [editedContact, setEditedContact] = useState({...});
const [savingContact, setSavingContact] = useState(false);

// Flag modals (lazy-loaded)
const [isFlagFormOpen, setIsFlagFormOpen] = useState(false);
const [selectedFlag, setSelectedFlag] = useState<CustomerFlag | null>(null);
const [isRemoveFlagOpen, setIsRemoveFlagOpen] = useState(false);
const [removingFlag, setRemovingFlag] = useState(false);
```

**Layout structure**:
```tsx
<div className="space-y-6">
  {/* Full-width Hero */}
  <CustomerHero
    customer={customer}
    metrics={metrics}
    onBookAppointment={handleBookAppointment}
    onAddPet={handleAddPet}
  />

  {/* 2-column layout */}
  <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
    {/* Left sidebar — sticky on desktop */}
    <div className="lg:sticky lg:top-6 lg:self-start space-y-6">
      {/* Pets */}
      <SidebarSection title="Pets" count={customer.pets.length} action={{ label: "Add Pet", onClick: handleAddPet }}>
        {customer.pets.map((pet, i) => (
          <PetCard key={pet.id} pet={pet} index={i} onBook={handleBookPet} />
        ))}
      </SidebarSection>

      {/* Contact Info */}
      <ContactInfoSection ... />

      {/* Loyalty */}
      <LoyaltySection ... />

      {/* Flags */}
      <FlagsSection ... />
    </div>

    {/* Main content */}
    <div>
      <AppointmentHistoryList
        appointments={appointments}
        loading={appointmentsLoading}
        error={appointmentsError}
        onRefresh={fetchAppointments}
      />
    </div>
  </div>
</div>
```

**Sidebar sections** are inline within CustomerProfile (not separate files) — they're small and tightly coupled to the parent's state. Each is wrapped in:
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: sectionIndex * 0.05, duration: 0.3 }}
  className="bg-white rounded-2xl shadow-sm overflow-hidden"
>
  <div className="h-1.5 bg-gradient-to-r from-[#D4A574] to-[#E8C49A]" />
  {/* section content */}
</motion.div>
```

**Bug fixes in this rewrite**:
- L137: `console.error` → `toast.error('Failed to update customer')`
- After successful save: add `toast.success('Customer updated')`
- L208: `console.error` → `toast.error('Failed to remove flag')`
- After successful flag removal: add `toast.success('Flag removed')`
- Remove `useEffect` for phone sync — derive in `handleSaveContact`

**Loyalty section redesign** (inline, not a separate component):
```
┌───────────────────────────────────────┐
│ 🏆 Loyalty                           │
│                                       │
│  [═══════════>          ] 3/10        │
│                                       │
│  Cards completed: 1                   │
│                                       │
│  Recent: Punch added — Mar 10         │
│          Punch added — Feb 28         │
└───────────────────────────────────────┘
```
- Progress bar: `bg-[#EAE0D5]` track, `bg-gradient-to-r from-[#D4A574] to-[#E8C49A]` fill
- Replace `bg-green-50`/`bg-blue-50` with `bg-[#FFFBF7]` backgrounds
- Compact layout — no grid cards, just inline stats

**Flags section redesign** (inline):
```
┌───────────────────────────────────────┐
│ 🚩 Flags (2)                [+ Add]  │
│                                       │
│  [Aggressive Dog]  Bites when scared  │
│                           [Remove]    │
│  [VIP]  Long-time customer            │
│                           [Remove]    │
└───────────────────────────────────────┘
```
- Compact list within sidebar card
- `AdminButton variant="ghost" size="xs"` for Add and Remove

---

### 4. AppointmentHistoryList (EDIT)

**File**: `src/components/admin/customers/AppointmentHistoryList.tsx`

**Changes**:
1. **Remove internal data fetching** — receive `appointments`, `loading`, `error` as props
2. **Remove metrics cards** (lines 190-246) — metrics now in CustomerHero
3. **Export `CustomerMetrics` interface** — shared with CustomerHero
4. **Export metrics calculation as a standalone function** — `calculateCustomerMetrics(appointments)`
5. Keep: filters, appointment list rendering, AppointmentDetailModal

**New props interface**:
```ts
interface AppointmentHistoryListProps {
  appointments: AppointmentWithDetails[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}
```

**Exported utility**:
```ts
export function calculateCustomerMetrics(appointments: AppointmentWithDetails[]): CustomerMetrics {
  // Single-pass calculation (combine filter + reduce + forEach)
  let totalSpent = 0;
  const serviceCounts: Record<string, number> = {};
  const completedDates: number[] = [];

  for (const apt of appointments) {
    if (apt.status === 'completed') {
      totalSpent += apt.total_price || 0;
      if (apt.service) {
        serviceCounts[apt.service.name] = (serviceCounts[apt.service.name] || 0) + 1;
      }
      completedDates.push(new Date(apt.scheduled_at).getTime());
    }
  }

  // ... rest of calculation (favorite service, avg frequency)
  return { total_appointments, total_spent, favorite_service, avg_visit_frequency_days };
}
```

---

### 5. CustomerFlagForm + RemoveFlagConfirmation (EDIT)

**File**: `src/components/admin/customers/CustomerFlagForm.tsx`

**Changes** to match admin modal pattern (reference: `StaffForm.tsx`):

1. **Framer Motion**: Wrap with `AnimatePresence` + `motion.div` overlay + `motion.div` modal
2. **Focus trap**: Add `createFocusTrap` from `@/lib/accessibility/focus`
3. **Semantic markup**: `<div role="dialog" aria-modal="true">` (NOT `<dialog>` element)
4. **Warm header**: `bg-[#EAE0D5]` with warm icon
5. **Warm footer**: `bg-[#EAE0D5]/30`
6. **AdminButton**: Replace inline `<button>` elements with `AdminButton`
7. **Body scroll lock**: `document.body.style.overflow = 'hidden'` on open

**Modal animation pattern**:
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        {/* Warm header */}
        <div className="flex items-center gap-3 p-6 bg-[#EAE0D5] rounded-t-2xl">
          <div className="p-2.5 rounded-xl bg-white/60">
            <Flag className="w-5 h-5 text-[#434E54]" />
          </div>
          <h2 className="text-xl font-semibold text-[#434E54]">...</h2>
          <button ... />
        </div>

        {/* Form body */}
        <form ...>...</form>

        {/* Warm footer */}
        <div className="flex gap-3 p-6 bg-[#EAE0D5]/30 rounded-b-2xl">
          <AdminButton variant="secondary" ...>Cancel</AdminButton>
          <AdminButton variant="primary" ...>Save</AdminButton>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

Same pattern applied to `RemoveFlagConfirmation` but with `variant="danger"` for the confirm button and `AlertTriangle` icon in header.

---

### 6. Page Component (EDIT)

**File**: `src/app/admin/customers/[id]/page.tsx`

**Changes**:
- Remove "Customer Profile" heading and description (hero handles customer identification)
- Keep back button
- Simplify to just back link + `<CustomerProfile customerId={id} />`

```tsx
export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      <CustomerProfile customerId={id} />
    </div>
  );
}
```

---

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| < 768px (mobile) | Single column. Hero stacks vertically. Stats become 2x2 grid. Sidebar sections stack above appointments. |
| 768px - 1023px (tablet) | Single column. Hero horizontal but compact. Full-width sections stacked. |
| >= 1024px (lg) | 2-column: 360px sticky sidebar + flex-1 main. Hero full width above. |

**Sidebar sticky behavior**: On lg+, sidebar uses `lg:sticky lg:top-6 lg:self-start` so it stays visible while scrolling through appointment history. On mobile, it renders above the appointment history in natural document order.

---

## Performance Optimizations

### Bundle Size
| Optimization | Technique |
|-------------|-----------|
| `AppointmentDetailModal` | `next/dynamic` — only loaded when appointment clicked |
| `CustomerFlagForm` | Dynamic `import()` — only loaded when flag modal opens |
| Lucide icons | Direct imports (`import { User } from 'lucide-react'`) not barrel |

### Re-renders
| Optimization | Technique |
|-------------|-----------|
| Metrics computation | `useMemo` over appointments array |
| Default empty arrays | Hoisted as module-level constants (`const EMPTY_ARRAY: never[] = []`) |
| Derived phone state | Remove `useEffect` sync — compute in `handleSaveContact` |
| Static JSX | Loading spinner, empty states hoisted as module-level constants |

### Data Fetching
| Optimization | Technique |
|-------------|-----------|
| Parallel fetches | `Promise.all([fetchCustomer(), fetchAppointments()])` |
| No waterfalls | Both API calls initiated simultaneously in single `useEffect` |

### Rendering
| Optimization | Technique |
|-------------|-----------|
| Conditional rendering | Ternary `condition ? <A /> : null` (not `&&`) |
| `content-visibility` | `content-visibility: auto` on appointment cards below the fold |

---

## Accessibility

| Requirement | Implementation |
|------------|----------------|
| Focus trap in modals | `createFocusTrap` from `@/lib/accessibility/focus` |
| Modal semantics | `role="dialog" aria-modal="true"` |
| Keyboard dismissal | `Escape` key closes modals |
| Body scroll lock | `document.body.style.overflow = 'hidden'` when modal open |
| Screen reader | Flag badges have `title` attribute with description |
| Color contrast | All text meets WCAG AA on warm backgrounds |
| Action labels | AdminButton with descriptive text (not icon-only) |

---

## Files Changed

| File | Action | Lines (est.) |
|------|--------|-------------|
| `src/components/admin/customers/CustomerHero.tsx` | **Create** | ~120 |
| `src/components/admin/customers/PetCard.tsx` | **Create** | ~100 |
| `src/components/admin/customers/CustomerProfile.tsx` | **Rewrite** | ~500 |
| `src/components/admin/customers/AppointmentHistoryList.tsx` | **Edit** | -70, +30 |
| `src/components/admin/customers/CustomerFlagForm.tsx` | **Edit** | ~+60 (modal pattern) |
| `src/app/admin/customers/[id]/page.tsx` | **Edit** | -15, +10 |

---

## Verification Checklist

- [ ] `npm run build` — no TypeScript errors
- [ ] Hero section visible without scrolling on desktop
- [ ] Flags (especially aggressive_dog) visible in hero on load
- [ ] 2-column layout on lg+ screens, stacked on mobile
- [ ] Pet cards show medical info without expanding/clicking
- [ ] "Book Appointment" works from hero
- [ ] "Add Pet" button present in hero and empty pets state
- [ ] Contact edit shows `toast.success` on save, `toast.error` on failure
- [ ] Flag remove shows `toast.success` on success, `toast.error` on failure
- [ ] All modals have Framer Motion entrance/exit animations
- [ ] All modals have focus trapping (Tab cycles within modal)
- [ ] Escape key closes modals
- [ ] Loyalty section uses warm palette (no `bg-green-50`/`bg-blue-50`)
- [ ] All buttons use AdminButton component
- [ ] Walk-in customer (placeholder email) handled gracefully
- [ ] Test with: multiple pets, flags, loyalty points, appointment history
- [ ] Test with: new customer (no appointments, no pets, no flags)
- [ ] Sidebar sticky on desktop when scrolling through long appointment list
