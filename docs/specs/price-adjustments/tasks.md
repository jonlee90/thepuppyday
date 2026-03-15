# Price Adjustments for Appointments - Implementation Tasks

## Overview

Add post-creation price adjustments (surcharges and discounts) to appointments. Admins can add/remove line-item adjustments from the AppointmentDetailModal, with server-side total recalculation and full audit trail.

**Progress**: 0/6 tasks complete (0%)

**Document References**:
- Requirements: `docs/specs/price-adjustments/requirements.md`
- Design: `docs/specs/price-adjustments/design.md`

---

## Section 1: Database & Types

### Task 0077: Create appointment_price_adjustments Table and TypeScript Types
- [ ] Run SQL migration to create `appointment_price_adjustments` table with columns: `id` (UUID PK), `appointment_id` (FK → appointments, CASCADE), `label` (TEXT NOT NULL), `amount` (NUMERIC(10,2) NOT NULL), `note` (TEXT), `created_by` (FK → users), `created_at` (TIMESTAMPTZ DEFAULT now())
- [ ] Create index `idx_price_adjustments_appointment_id` on `appointment_id`
- [ ] Enable RLS on the table (no policies -- service role access only)
- [ ] Add `AppointmentPriceAdjustment` interface to `src/types/database.ts`
- [ ] Add optional `price_adjustments?: AppointmentPriceAdjustment[]` field to `Appointment` interface
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Table exists in Supabase with correct schema; TypeScript types compile; index present
- **References**: REQ-1, REQ-2, Design Data Models section
- **Files**: `src/types/database.ts`

---

## Section 2: API Routes

### Task 0078: Create Adjustments API Route (POST + DELETE) with Recalculation
- [ ] Create `src/app/api/admin/appointments/[id]/adjustments/route.ts`
- [ ] Implement POST handler: auth via `createServerSupabaseClient` + `requireAdmin`, validate with Zod (`label` required, `amount` non-zero, `note` optional max 500), insert row with `createServiceRoleClient`, recalculate total, return `{ adjustment, total_price }`
- [ ] Implement DELETE handler: auth + validate `adjustment_id` UUID, delete row, recalculate total, return `{ total_price }`
- [ ] Recalculation logic: use `Promise.all` to fetch appointment base price/addons total and sum of adjustments in parallel, then update `appointments.total_price`
- [ ] Return appropriate error codes per design error table (400, 403, 404, 500)
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: POST creates adjustment and returns recalculated total; DELETE removes adjustment and returns recalculated total; validation rejects missing label and zero amount; non-admin gets 403
- **References**: REQ-3, REQ-4, REQ-5, REQ-9, REQ-10, REQ-11, Design API Route section
- **Files**: `src/app/api/admin/appointments/[id]/adjustments/route.ts`

### Task 0079: Extend GET Appointment Route to Include Price Adjustments
- [ ] Modify `src/app/api/admin/appointments/[id]/route.ts` to join `appointment_price_adjustments` (ordered by `created_at` asc) in the appointment GET response
- [ ] Include `created_by` user info (name) for audit display
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: GET response includes `price_adjustments` array with creator info; empty array when no adjustments exist
- **References**: REQ-6, REQ-7, Design Integration Points
- **Files**: `src/app/api/admin/appointments/[id]/route.ts`

---

## Section 3: UI Integration

### Task 0080: Add Adjustments Display to AppointmentDetailModal (View Mode)
- [ ] In `AppointmentDetailModal.tsx` pricing section, render adjustments list between add-ons and total
- [ ] Display each adjustment: label, formatted amount (green `text-green-600` for discounts, default charcoal for surcharges), optional note as tooltip or secondary text
- [ ] Show "Adjustments" subheading only when adjustments exist
- [ ] Use Framer Motion `AnimatePresence` with `y: 16` slide-up and stagger `delay: index * 0.05`
- [ ] Derive adjustments total during render (not in useEffect) per `rerender-derived-state` rule
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: View mode shows adjustments as line items with correct color coding; total reflects adjustments; no adjustments = no section shown
- **References**: REQ-6, REQ-7, US-3, Design UI Component section
- **Files**: `src/components/admin/appointments/AppointmentDetailModal.tsx`

### Task 0081: Add Inline Adjustment Add/Delete Form to AppointmentDetailModal (Edit Mode)
- [ ] In edit mode, show delete button (`Trash2` icon, `text-red-400 hover:text-red-600`) on each adjustment row
- [ ] Add inline form below adjustments: label input, amount input with +/- toggle for surcharge/discount direction, optional note input, `AdminButton` size="xs" to submit
- [ ] Inputs follow admin pattern: `px-3 py-2.5 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30`
- [ ] POST to adjustments API on add, DELETE on remove; show `toast.success`/`toast.error` for each mutation
- [ ] Update local adjustments state and total_price from API response (functional setState per `rerender-functional-setstate`)
- [ ] Animate add/remove with `AnimatePresence`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Admin can add surcharge/discount with label+amount+note; can delete existing adjustments; total updates after each action; toast feedback on success/failure
- **References**: REQ-4, REQ-5, REQ-8, US-1, US-2, US-4, Design Inline Add Form section
- **Files**: `src/components/admin/appointments/AppointmentDetailModal.tsx`

---

## Section 4: Documentation

### Task 0082: Update Architecture Documentation
- [ ] Add `appointment_price_adjustments` table to Database Schema section in `docs/architecture/ARCHITECTURE.md`
- [ ] Document the new API route in the admin routes documentation
- [ ] Add price adjustments to the appointments table relationships
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Architecture docs reflect the new table, its columns, indexes, RLS status, and API route
- **References**: Design Files to Create/Modify table
- **Files**: `docs/architecture/ARCHITECTURE.md`
