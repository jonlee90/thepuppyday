# Task 0014: Create AppointmentDetailModal component

**Group**: Appointments Management (Week 3)

## Objective
Build comprehensive appointment detail modal

## Files to create/modify
- `src/components/admin/appointments/AppointmentDetailModal.tsx` - Detail modal
- `src/app/api/admin/appointments/[id]/route.ts` - Single appointment endpoint

## Requirements covered
- REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4, REQ-9.5, REQ-9.6, REQ-9.7, REQ-9.8, REQ-9.9, REQ-9.10, REQ-9.11, REQ-9.12

## Acceptance criteria
- [x] Displays customer info, pet info, service, add-ons, pricing, notes, status
- [x] Customer info with click-to-call phone
- [x] Pet photo, breed, age, weight if available
- [x] Customer flags prominently at top with descriptions
- [x] Itemized pricing: base service, add-ons, subtotal, tax, total
- [x] Context-aware action buttons (Confirm, Cancel, Check In, Start, Complete, No-Show)
- [x] Cancellation requires reason dropdown
- [x] No-show confirmation dialog with implications
- [x] Status change timeline with timestamps and admin user
- [x] Inline edit for date/time and special requests
- [x] Past appointments disable buttons except Complete/No-Show

## Implementation Notes

**Status:** ✅ Completed (2025-12-12)

**Files Created/Modified:**
- `src/components/admin/appointments/AppointmentDetailModal.tsx` - Comprehensive appointment detail modal
- `src/app/api/admin/appointments/[id]/route.ts` - Single appointment GET endpoint with full joins

**Key Features Implemented:**
- ✓ Full appointment details with customer, pet, service, add-ons
- ✓ Click-to-call phone number with tel: protocol
- ✓ Pet information card with photo, breed, age, weight, special notes
- ✓ Customer flags displayed prominently with color-coded badges
- ✓ Complete pricing breakdown with line items
- ✓ Context-aware action buttons based on current status
- ✓ Cancellation reason dropdown (7 predefined reasons)
- ✓ No-show confirmation with warning about customer record impact
- ✓ Status transition timeline with audit trail
- ✓ Inline editing for scheduled time and special requests
- ✓ Smart button disabling for past appointments

**Modal Layout Sections:**
1. **Header**: Customer name, status badge, close button
2. **Customer Flags**: Color-coded badges for VIP, high-value, no-show history, etc.
3. **Customer Info**: Name, email, phone (clickable), address
4. **Pet Info**: Photo, name, breed, age, weight, special notes
5. **Service Details**: Service name, duration, scheduled date/time
6. **Add-ons**: List of selected add-ons with individual prices
7. **Pricing Breakdown**: Base service, add-ons subtotal, tax, total
8. **Special Requests**: Customer notes/instructions
9. **Status Timeline**: Chronological status changes with timestamps
10. **Action Buttons**: Context-aware workflow buttons

**Customer Flags Implementation:**
```typescript
// Flags displayed at top of modal
{customer_flags.map(flag => (
  <div className={`badge ${getFlagColor(flag.flag_type)}`}>
    {flag.flag_type}: {flag.description}
  </div>
))}
```

Flag types:
- VIP: `badge-warning` (gold)
- High Value: `badge-success` (green)
- No-Show History: `badge-error` (red)
- Special Needs: `badge-info` (blue)

**Pricing Breakdown:**
```typescript
Base Service: ${service.price}
Add-ons:
  - Long Hair: $10.00
  - Teeth Brushing: $10.00
  ─────────────────
Subtotal: ${subtotal}
Tax (9.5%): ${tax}
─────────────────
Total: ${total}
```

**Context-Aware Action Buttons:**
```typescript
// Buttons shown based on current status
pending → [Confirm] [Cancel] [No-Show]
confirmed → [Check In] [Cancel] [No-Show]
checked_in → [Start Service] [Cancel] [No-Show]
in_progress → [Complete] [Cancel]
completed → (no actions)
cancelled → (no actions)
no_show → (no actions)
```

**Cancellation Flow:**
1. User clicks "Cancel" button
2. Modal shows cancellation reason dropdown
3. Required reasons:
   - Customer request
   - Customer no-show
   - Emergency
   - Double booking
   - Pet health issue
   - Staff unavailable
   - Other
4. User confirms cancellation
5. Status updated + notification sent

**No-Show Confirmation:**
```typescript
"Marking as no-show will:
- Update customer's no-show count
- May affect future booking eligibility
- Cannot be undone

Are you sure you want to continue?"
```

**Status Timeline:**
```typescript
Timeline Entry {
  status: 'confirmed',
  timestamp: '2025-12-12 10:30 AM',
  admin_user: 'Sarah Johnson',
  notes: 'Customer called to confirm'
}
```

**Inline Editing:**
- **Date/Time**: Click to edit, shows date picker + time selector
- **Special Requests**: Click to edit, shows textarea
- Auto-save on blur with optimistic UI updates
- Validation before save (no past dates, within business hours)

**Past Appointment Handling:**
```typescript
const isPast = new Date(scheduled_at) < new Date();

// Disable most buttons for past appointments
<button disabled={isPast && status !== 'in_progress'}>
  Complete
</button>

// Allow marking no-show even for past appointments
<button disabled={false}>
  No-Show
</button>
```

**API Endpoint:**
```typescript
GET /api/admin/appointments/[id]

Response includes:
- Full appointment details
- Customer with flags
- Pet with breed info
- Service with pricing
- Add-ons with prices
- Status history
```

**Design System:**
- DaisyUI modal component
- Card-based sections with dividers
- Status badges with semantic colors
- Click-to-call styling for phone numbers
- Responsive layout for mobile/tablet/desktop

**Security & Validation:**
- Admin-only route protection
- Input sanitization for inline edits
- SQL injection prevention
- XSS protection for user-generated content
- Proper error handling with user-friendly messages

**Performance:**
- Lazy loading of modal content
- Optimistic UI updates
- Debounced inline edit saves
- Memoized computed values (pricing totals)
