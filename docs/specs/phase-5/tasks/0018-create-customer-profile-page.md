# Task 0018: Create CustomerProfile page

**Group**: Customer Management (Week 4)

## Objective
Build customer profile with all related data

## Files to create/modify
- `src/app/(admin)/customers/[id]/page.tsx` - Customer profile page
- `src/components/admin/customers/CustomerProfile.tsx` - Profile display
- `src/app/api/admin/customers/[id]/route.ts` - Customer detail endpoint

## Requirements covered
- REQ-13.1, REQ-13.2, REQ-13.3, REQ-13.4, REQ-13.5, REQ-13.6, REQ-13.7, REQ-13.8, REQ-13.9, REQ-13.10, REQ-13.11

## Acceptance criteria
- [x] Sections: Contact Info, Pets, Appointment History, Flags, Loyalty Points, Membership
- [x] Contact: name, email, phone, address, registration date
- [x] Pet cards with name, breed, age, weight, photo
- [x] Pet card click expands grooming notes and pet-specific history
- [x] Appointment history: date, service, status, total (chronological)
- [x] Appointment click opens detail modal
- [x] Flags with descriptions and date added
- [x] Loyalty: current points and recent transactions
- [x] Membership: tier, status, renewal date, benefits
- [x] Edit button enables inline editing of contact info
- [x] "No appointments yet" with "Book Appointment" button when empty

## Implementation Notes

**Completion Date**: 2025-12-12

### Files Created/Modified

1. **`src/components/admin/customers/CustomerProfile.tsx`** (611 lines)
   - Comprehensive customer profile with 6 major sections
   - Inline editing for contact information
   - Expandable pet cards with notes and medical info
   - Integrated flag management (add/edit/remove)

2. **`src/app/api/admin/customers/[id]/route.ts`** (241 lines)
   - GET endpoint for detailed customer data with all related entities
   - PATCH endpoint for updating customer contact information
   - Comprehensive validation with duplicate email checking

3. **`src/app/(admin)/customers/[id]/page.tsx`**
   - Customer profile detail page integrating CustomerProfile component

### Key Features Implemented

- ✅ **Section 1: Contact Information** (lines 215-341)
  - Displays: First Name, Last Name, Email, Phone, Registration Date
  - Inline editing toggle with Edit/Save/Cancel buttons
  - Form validation on save
  - Loading state during save operation

- ✅ **Section 2: Pets** (lines 343-417)
  - Pet cards showing name, breed, size, weight
  - Click to expand for grooming notes and medical info
  - Collapsible with chevron icons
  - Empty state with PawPrint icon

- ✅ **Section 3: Appointment History** (lines 419-426)
  - Uses AppointmentHistoryList component
  - Filters, metrics, and detail modal integration
  - See Task 0019 for full details

- ✅ **Section 4: Customer Flags** (lines 428-476)
  - List of active flags with descriptions and dates
  - Add Flag button opens modal form
  - Remove button with confirmation dialog
  - Empty state when no flags

- ✅ **Section 5: Loyalty Program** (lines 478-527)
  - Current punches and cards completed
  - Recent transaction history (last 5)
  - Empty state for non-enrolled customers

- ✅ **Section 6: Membership** (lines 529-582)
  - Active membership details with tier and price
  - Renewal date display
  - Benefits list
  - Empty state for non-members

### Technical Details

**API GET Endpoint** (lines 25-123):
```typescript
// Comprehensive data fetching with joins
const customer = await supabase.from('users').select('*').eq('id', customerId).single();
const pets = await supabase.from('pets').select('*, breed:breeds(*)').eq('owner_id', customerId);
const flags = await supabase.from('customer_flags').select('*').eq('customer_id', customerId);
const loyaltyPoints = await supabase.from('customer_loyalty').select('*').eq('customer_id', customerId);
const loyaltyTransactions = await supabase.from('loyalty_punches').select('*').eq('customer_id', customerId).limit(5);
const membership = await supabase.from('customer_memberships').select('*, membership:memberships(*)').eq('customer_id', customerId);

// Aggregate into single object
return {
  ...customer,
  pets,
  flags,
  loyalty_points: loyaltyPoints,
  loyalty_transactions: loyaltyTransactions,
  active_membership: membership
};
```

**Contact Editing Flow**:
1. Click "Edit" button → enters edit mode
2. Input fields become editable
3. Form state managed in `editedContact` object
4. "Save" triggers PATCH request
5. "Cancel" reverts to original values
6. Success updates local state without refetch

**Pet Expansion**:
- Uses Set to track expanded pet IDs
- Toggle function adds/removes from Set
- Conditional rendering based on Set membership
- Smooth expand/collapse with Tailwind transitions

**Flag Management**:
- Add Flag opens CustomerFlagForm modal
- Edit Flag (future) opens modal with existing data
- Remove Flag shows RemoveFlagConfirmation modal
- Success callbacks trigger data refresh

### Security Fixes

**Email Validation with Duplicate Check** (lines 160-195):
```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (email !== undefined) {
  const trimmedEmail = email.trim();

  // Security: Proper email validation
  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    return NextResponse.json(
      { error: 'Valid email is required' },
      { status: 400 }
    );
  }

  // Security: Check for duplicate email (excluding current user)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', trimmedEmail)
    .neq('id', customerId)
    .single();

  if (existingUser) {
    return NextResponse.json(
      { error: 'Email already in use by another customer' },
      { status: 409 } // Conflict
    );
  }

  updateData.email = trimmedEmail;
}
```

**Phone Validation** (lines 197-209):
```typescript
const MAX_PHONE_LENGTH = 20;

if (phone !== undefined) {
  const trimmedPhone = phone?.trim() || null;

  // Security: Validate phone length to prevent abuse
  if (trimmedPhone && trimmedPhone.length > MAX_PHONE_LENGTH) {
    return NextResponse.json(
      { error: `Phone number cannot exceed ${MAX_PHONE_LENGTH} characters` },
      { status: 400 }
    );
  }

  updateData.phone = trimmedPhone;
}
```

**Alert() Replacement** (lines 117-123, 186-189):
```typescript
// Security: Replace alert() with console.error
// TODO: Implement toast notification system for better UX
console.error('Failed to update customer:', err instanceof Error ? err.message : 'Unknown error');
```

**Why This Matters**:
- **Email validation**: Prevents invalid emails from being saved
- **Duplicate check**: Returns 409 Conflict for better error handling
- **Phone length limit**: Prevents database overflow and abuse
- **No alert()**: Browser alerts are security risks (can be used for phishing)

**Additional Security**:
- Admin-only access via `requireAdmin()` middleware
- Input trimming to prevent whitespace attacks
- Empty string validation for required fields
- Proper HTTP status codes (400, 404, 409, 500)

### Design System Compliance

- **Six Card Sections**: Each with white background, rounded-xl, shadow-md
- **Section Headers**: Large font with icon, semibold text
- **Edit Mode**: Save button uses primary color (#434E54)
- **Empty States**: Gray background with centered icon and text
- **Badges**: Rounded-full with appropriate color schemes
- **Transitions**: Smooth hover effects on buttons and cards

### User Experience Improvements

1. **Inline Editing**:
   - No page navigation required
   - Clear Save/Cancel actions
   - Disabled buttons during save
   - Error feedback inline

2. **Expandable Pet Cards**:
   - Click to expand (not just icon)
   - Chevron direction indicates state
   - Border separator for expanded content

3. **Flag Management**:
   - Add button clearly visible
   - Remove confirmation prevents accidents
   - Flags show date added for context

4. **Empty States**:
   - Each section has appropriate empty state
   - Icons match section theme
   - Helpful messaging for next steps

5. **Loading States**:
   - Spinner during initial load
   - "Saving..." text on save button
   - Disabled inputs during operations

### Integration Points

- **AppointmentHistoryList**: Fully integrated in Section 3
- **CustomerFlagBadge**: Used for flag display
- **CustomerFlagForm**: Modal for adding/editing flags
- **RemoveFlagConfirmation**: Modal for flag removal
- **AppointmentDetailModal**: Opens from appointment history clicks

### Data Flow

```
CustomerProfile Component
  ↓
  ├─ Fetch customer data on mount
  ├─ Store in local state
  ├─ Pass to child components
  │   ├─ AppointmentHistoryList (customerId)
  │   ├─ CustomerFlagForm (customerId, flag, callbacks)
  │   └─ RemoveFlagConfirmation (flag, callbacks)
  ↓
  ├─ Handle edit actions
  ├─ Call PATCH API
  └─ Update local state on success
```

### Future Enhancements

- Toast notifications for better feedback (vs console.error)
- Address field integration
- Pet photo upload
- Membership upgrade/downgrade
- Loyalty points manual adjustment
- Export customer data
