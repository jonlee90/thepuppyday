# Schema Updates (Users Address + Pets Gender/Color) - Implementation Tasks

## Overview

Schema changes to support real customer/pet data import: add optional address fields (address, city, zip) to users table, and replace the redundant `weight` column on pets with `gender` (required) and `color` (optional), while exposing the existing `birth_date` column in UI forms. Affects 34 files across database, types, validation, API routes, booking flow, customer portal, admin panel, CSV import, mocks, and tests.

**Progress**: 15/15 tasks complete (100%)

**Document References**:
- Design: `docs/specs/schema-updates/design.md`

---

## Section 1: Database & Type Definitions

### Task 0028: Run Database Migration for Users Address and Pets Gender/Color
- [x] Create and apply migration `supabase/migrations/20260313_users_address_pets_gender_color.sql`
- [x] Add `address text`, `city text`, `zip text` columns to `users` table (all nullable)
- [x] Drop `weight` column from `pets` table
- [x] Add `gender text NOT NULL DEFAULT 'male'` and `color text` columns to `pets` table
- [x] Add CHECK constraint `chk_pets_gender` restricting gender to `('male', 'female')`
- [x] Verify migration applied: existing pets have `gender = 'male'`, weight column gone, users have new nullable columns
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Migration applied successfully. `SELECT column_name FROM information_schema.columns WHERE table_name = 'pets'` shows gender/color, no weight. Users table has address/city/zip. CHECK constraint rejects invalid gender values.
- **References**: Design Section 1 (Database Migration)
- **Files**: `supabase/migrations/20260313_users_address_pets_gender_color.sql`

### Task 0029: Update TypeScript Type Definitions and Store Interfaces
- [x] Update `src/types/supabase.ts` -- pets table: remove `weight` from Row/Insert/Update, add `gender: string` (Row), `gender?: string` (Insert/Update), `color: string | null` (Row), `color?: string | null` (Insert/Update)
- [x] Update `src/types/supabase.ts` -- users table: add `address: string | null`, `city: string | null`, `zip: string | null` to Row/Insert/Update
- [x] Update `src/types/admin-appointments.ts` -- `SelectedPet` interface: remove `weight: number`, add `gender: string`, `color?: string | null`
- [x] Update `src/types/admin-appointments.ts` -- CSV import row interface: remove `pet_weight: string`, add `pet_gender: string`, `pet_color: string`
- [x] Update `src/stores/bookingStore.ts` -- `GuestInfo` interface: add optional `address?: string`, `city?: string`, `zip?: string`
- [x] Update `src/components/admin/appointments/calendar/types.ts` -- pet type: remove `weight?: number | null`, add `gender?: string`, `color?: string | null`
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All type definitions reflect the new schema. No TypeScript errors from type changes alone (downstream files may still reference weight -- that is addressed in later tasks).
- **References**: Design Sections 2, 6 (Type Definitions, Additional Types)
- **Files**: `src/types/supabase.ts`, `src/types/admin-appointments.ts`, `src/stores/bookingStore.ts`, `src/components/admin/appointments/calendar/types.ts`

---

## Section 2: Validation Schemas

### Task 0030: Update All Validation Schemas for New Fields
- [x] Update `src/lib/booking/validation.ts` -- `guestInfoSchema`: add optional `address` (max 200), `city` (max 100), `zip` (regex `/^\d{5}(-\d{4})?$/`, optional, or empty string)
- [x] Update `src/lib/booking/validation.ts` -- `petFormSchema`: remove `weight`, add required `gender` (enum male/female with message), optional `color` (max 100), optional `birth_date` (string)
- [x] Update `src/lib/validations/customer.ts` -- `profileUpdateSchema`: add optional `address` (max 200), `city` (max 100), `zip` (regex, optional or empty)
- [x] Update `src/lib/validations/customer.ts` -- `createPetSchema`: remove `weight`, add required `gender` (enum), optional `color` (max 100)
- [x] Update `src/lib/validations/booking.ts` -- `petInfoSchema`: remove `weight`, add required `gender` (enum), optional `color` (max 100), optional `birth_date`
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All three validation files compile. Gender is required in pet schemas. ZIP accepts "90638", "90638-1234", and empty string. Weight references removed from all schemas.
- **References**: Design Section 3 (Validation Schema Changes)
- **Files**: `src/lib/booking/validation.ts`, `src/lib/validations/customer.ts`, `src/lib/validations/booking.ts`

---

## Section 3: API Routes

### Task 0031: Update Appointment API Routes for New Fields
- [x] Update `src/app/api/appointments/route.ts` -- `appointmentRequestSchema`: add address/city/zip to `guest_info` object; remove weight from `new_pet`, add `gender` (default 'male') and `color`
- [x] Update `src/app/api/appointments/route.ts` -- user insert logic: include `address`, `city`, `zip` from guest_info
- [x] Update `src/app/api/appointments/route.ts` -- pet insert logic: remove `weight`, include `gender` and `color`
- [x] Update `src/app/api/admin/appointments/route.ts` -- apply same schema and insert logic changes for customer and pet creation
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Both appointment routes accept gender/color for pets and address/city/zip for customers. Weight is no longer accepted or inserted. New fields are correctly passed through to Supabase inserts.
- **References**: Design Section 4 (API Route Changes -- appointments)
- **Files**: `src/app/api/appointments/route.ts`, `src/app/api/admin/appointments/route.ts`

### Task 0032: Update Profile and Pets API Routes for New Fields
- [x] Update `src/app/api/customer/profile/route.ts` -- `updateProfileSchema`: add nullable optional `address` (max 200), `city` (max 100), `zip` (max 10)
- [x] Update `src/app/api/pets/route.ts` -- pet insert: remove `weight`, add `gender` (default 'male') and `color`
- [x] Update `src/app/api/admin/customers/[id]/pets/route.ts` -- mock data: remove `weight`, add `gender` and `color`
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Profile PATCH accepts and persists address fields. Pet POST creates records with gender/color, no weight. Mock pets endpoint returns gender/color instead of weight.
- **References**: Design Sections 4, 6 (API Routes -- profile, pets)
- **Files**: `src/app/api/customer/profile/route.ts`, `src/app/api/pets/route.ts`, `src/app/api/admin/customers/[id]/pets/route.ts`

---

## Section 4: Booking Submission Logic & Hooks

### Task 0033: Update Booking Submission and Hook Logic
- [x] Update `src/lib/booking/submit.ts` -- `submitCustomerAppointment`: remove weight from newPet object, add `gender` and `color`; ensure guestInfo passes through address/city/zip
- [x] Update `src/lib/booking/submit.ts` -- `submitAdminAppointment` and `submitWalkinAppointment`: remove weight from selectedPet/newPetData objects, add gender/color; add address/city/zip to customer object for new customers
- [x] Update `src/hooks/useBooking.ts` -- remove all `weight` references in mock pet insert and guest pet payload; add `gender` and `color` fields
- [x] Update `src/hooks/usePets.ts` -- mock `createPet` path: remove `weight`, add `gender` (default 'male') and `color`
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All submission paths pass gender/color for pets and address/city/zip for customers. Zero references to `weight` remain in submit.ts, useBooking.ts, or usePets.ts.
- **References**: Design Sections 5, 6 (Submission Logic, Hooks)
- **Files**: `src/lib/booking/submit.ts`, `src/hooks/useBooking.ts`, `src/hooks/usePets.ts`

---

## Section 5: UI Components -- Booking Flow

### Task 0034: Update PetForm Component (Remove Weight, Add Gender/Color/BirthDate)
- [x] Remove the weight input section entirely from `src/components/booking/PetForm.tsx`
- [x] Add required gender select (male/female) with validation error display, placed after breed section
- [x] Add optional color/markings text input (placeholder: "e.g. Golden, Black & White, Brown with spots")
- [x] Add optional birth date input with `max` set to today's date
- [x] Update `defaultValues` to include `gender`, `color`, `birth_date` from initialData; remove `weight`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: PetForm renders gender select (required), color input (optional), birth_date input (optional). No weight field. Form validates gender is selected before submission. Styling matches existing form fields (rounded-lg, border-2 border-[#EAE0D5], focus ring).
- **References**: Design Section 9 (PetForm.tsx)
- **Files**: `src/components/booking/PetForm.tsx`

### Task 0035: Update DetailsStep with Address Fields and Pet Data Passthrough
- [x] Add `address`, `city`, `zip` to `newCustomerForm` state in `src/components/booking/steps/DetailsStep.tsx`, initialized from guestInfo
- [x] Add address/city/zip form fields to `renderNewCustomerFormFields()` after phone -- address (full width), city + ZIP (2-column grid)
- [x] Update `handleNewCustomerSubmit` to pass address/city/zip to `setGuestInfo()`
- [x] Update `handlePetFormSubmit` to pass `gender`, `color`, `birth_date` to `setNewPetData()` and remove `weight`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: New customer form shows address/city/zip fields. Address data flows into guestInfo store. Pet form data includes gender/color/birth_date. No weight references remain.
- **References**: Design Section 9 (DetailsStep.tsx)
- **Files**: `src/components/booking/steps/DetailsStep.tsx`

### Task 0036: Update Review Steps and Appointment Detail Views
- [x] Update `src/components/booking/steps/ReviewStep.tsx` -- remove weight from pet review object, add gender/color
- [x] Update `src/components/booking/steps/WalkinReviewStep.tsx` -- remove weight, add gender/color
- [x] Update `src/app/(customer)/appointments/[id]/page.tsx` -- update select query to include gender/color instead of weight; update display to show gender/color
- [x] Update `src/components/admin/appointments/AppointmentDetailModal.tsx` -- remove weight display, add gender (capitalized) and color
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All review/detail views show gender and color (when present), no weight. Appointment detail query fetches correct pet fields.
- **References**: Design Sections 7, 9 (Review Steps, Appointment Details)
- **Files**: `src/components/booking/steps/ReviewStep.tsx`, `src/components/booking/steps/WalkinReviewStep.tsx`, `src/app/(customer)/appointments/[id]/page.tsx`, `src/components/admin/appointments/AppointmentDetailModal.tsx`

---

## Section 6: UI Components -- Customer Portal

### Task 0037: Update Customer Pets Pages and Profile Editor
- [x] Update `src/app/(customer)/pets/page.tsx` -- remove weight display from pet cards, add gender badge/icon and color display
- [x] Update `src/app/(customer)/pets/[id]/page.tsx` -- remove weight field from detail view, add gender and color fields
- [x] Update `src/app/(customer)/profile/page.tsx` -- pass `address`, `city`, `zip` to `ProfileInfoEditor`
- [x] Update `src/components/customer/ProfileInfoEditor.tsx` -- add address/city/zip to `ProfileUser` interface, display mode (formatted address line), edit mode (address full width + city/zip 2-column grid), and `handleSave` PATCH body
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Pet list and detail pages show gender/color, no weight. Profile displays address when present and allows editing address/city/zip. Save persists address fields via PATCH API.
- **References**: Design Sections 8, 9 (Customer Profile, Customer Pets)
- **Files**: `src/app/(customer)/pets/page.tsx`, `src/app/(customer)/pets/[id]/page.tsx`, `src/app/(customer)/profile/page.tsx`, `src/components/customer/ProfileInfoEditor.tsx`

---

## Section 7: UI Components -- Admin Panel

### Task 0038: Update Admin CustomerProfile Component
- [x] Update `src/components/admin/customers/CustomerProfile.tsx` -- customer info section: add address/city/zip display when present
- [x] Update `src/components/admin/customers/CustomerProfile.tsx` -- pet info section: remove weight display, add gender and color
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Admin customer profile shows formatted address for customers who have it. Pet cards show gender (capitalized) and color, no weight.
- **References**: Design Section 9 (CustomerProfile.tsx)
- **Files**: `src/components/admin/customers/CustomerProfile.tsx`

---

## Section 8: CSV Import System

### Task 0039: Update CSV Import System (Template, Validation, Processing)
- [x] Update `src/app/api/admin/appointments/import/template/route.ts` -- replace `pet_weight` with `pet_gender,pet_color` in CSV template header
- [x] Update `src/lib/admin/appointments/csv-validation.ts` -- remove `pet_weight` from CSV row schemas, add `pet_gender` and `pet_color`; remove `validateWeightForSize` function entirely
- [x] Update `src/lib/admin/appointments/csv-processor.ts` -- remove `pet_weight` references and weight-size validation; replace with `pet_gender` and `pet_color` in row mapping
- [x] Update `src/lib/admin/appointments/batch-processor.ts` -- remove weight parsing; add `gender` (default 'male') and `color` to pet insert object
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: CSV template downloads with pet_gender/pet_color columns (no pet_weight). Import processes gender/color correctly. Missing gender defaults to 'male'. No weight references remain in any CSV import file.
- **References**: Design Section 9 (CSV Import System)
- **Files**: `src/app/api/admin/appointments/import/template/route.ts`, `src/lib/admin/appointments/csv-validation.ts`, `src/lib/admin/appointments/csv-processor.ts`, `src/lib/admin/appointments/batch-processor.ts`

---

## Section 9: Mocks, Tests & Documentation

### Task 0040: Update Mock Data and Seed Files
- [x] Update `src/mocks/supabase/seed.ts` -- remove `weight` from all mock pet objects, add `gender` ('male'/'female') and `color` values
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Mock seed data compiles with no weight references. All mock pets have gender and color values.
- **References**: Design Section 10 (Mocks)
- **Files**: `src/mocks/supabase/seed.ts`

### Task 0041: Update Test Files and Add Gender Validation Tests
- [x] Update `src/hooks/__tests__/usePets.test.ts` -- remove `weight` from all mock pet objects (~20 lines), add `gender` and `color`; replace `createdPet?.weight` assertion with gender/color assertions
- [x] Update `src/lib/booking/__tests__/validation.test.ts` -- remove `weight: 25` from sample data; delete entire `weight validation` describe block; add `gender validation` describe block (tests: requires gender, accepts male, accepts female, rejects invalid)
- [x] Run `npm run test` to verify all updated tests pass
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All test files compile and pass. No weight references in test assertions. Gender validation tests cover required field, valid values, and invalid values.
- **References**: Design Section 10 (Tests)
- **Files**: `src/hooks/__tests__/usePets.test.ts`, `src/lib/booking/__tests__/validation.test.ts`

---

## Section 10: Documentation & Build Verification

### Task 0042: Update Architecture Documentation and Verify Build
- [x] Update `docs/architecture/ARCHITECTURE.md` -- Users table schema: add `address text`, `city text`, `zip text`
- [x] Update `docs/architecture/ARCHITECTURE.md` -- Pets table schema: remove `weight numeric` row, add `gender text NOT NULL DEFAULT 'male'` with CHECK constraint note, add `color text`
- [x] Run `npm run build` and verify no type errors from weight removal or new field additions
- [x] Run `npm run lint` and verify clean output
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Architecture docs accurately reflect the new schema. Build and lint pass cleanly.
- **References**: Design Section (Documentation Updates)
- **Files**: `docs/architecture/ARCHITECTURE.md`
