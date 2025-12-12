# Task 0021: Create CustomerFlagForm modal

**Group**: Customer Management (Week 4)

## Objective
Build form for adding/editing customer flags

## Files to create/modify
- `src/components/admin/customers/CustomerFlagForm.tsx` - Flag form modal
- `src/app/api/admin/customers/[id]/flags/route.ts` - POST flag endpoint
- `src/app/api/admin/customers/[id]/flags/[flagId]/route.ts` - PATCH/DELETE flag endpoint

## Requirements covered
- REQ-15.1, REQ-15.2, REQ-15.3, REQ-15.4, REQ-15.5, REQ-15.6, REQ-15.7, REQ-15.8, REQ-15.9, REQ-15.10

## Acceptance criteria
- [x] Add Flag opens modal with type dropdown and description textarea
- [x] Flag types: Aggressive Dog, Payment Issues, VIP, Special Needs, Grooming Notes, Other
- [x] Aggressive Dog defaults to red color
- [x] VIP defaults to green color
- [x] Other requires custom description
- [x] Description limited to 500 characters with counter
- [x] Save inserts to customer_flags with customer_id, flag_type, description, color, created_at, created_by
- [x] Remove flag shows confirmation then soft-deletes (is_active=false)

## Implementation Notes

**Completion Date**: 2025-12-12

### Files Created/Modified

1. **`src/components/admin/customers/CustomerFlagForm.tsx`** (285 lines)
   - CustomerFlagForm: Modal form for add/edit flag
   - RemoveFlagConfirmation: Confirmation modal for flag removal

2. **`src/app/api/admin/customers/[id]/flags/route.ts`** (117 lines)
   - POST endpoint for creating new customer flags

3. **`src/app/api/admin/customers/[id]/flags/[flagId]/route.ts`** (151 lines)
   - PATCH endpoint for updating existing flags
   - DELETE endpoint for soft-deleting flags

### Key Features Implemented

- ✅ **CustomerFlagForm Modal** (lines 33-208)
  - Add new flag or edit existing flag
  - Flag type dropdown with 6 options
  - Description textarea with character counter
  - Validation and error handling
  - Loading states during save

- ✅ **Flag Type Options** (lines 22-29)
  ```typescript
  const FLAG_TYPE_OPTIONS = [
    { value: 'aggressive_dog', label: 'Aggressive Dog', defaultColor: 'red' },
    { value: 'payment_issues', label: 'Payment Issues', defaultColor: 'red' },
    { value: 'vip', label: 'VIP', defaultColor: 'green' },
    { value: 'special_needs', label: 'Special Needs', defaultColor: 'yellow' },
    { value: 'grooming_notes', label: 'Grooming Notes', defaultColor: 'yellow' },
    { value: 'other', label: 'Other', defaultColor: 'yellow' },
  ];
  ```

- ✅ **Character Counter** (lines 166-172)
  - 500 character maximum
  - Real-time count display
  - Warning color when < 50 characters remaining
  - maxLength attribute prevents typing beyond limit

- ✅ **RemoveFlagConfirmation Modal** (lines 210-284)
  - Shows flag type and description
  - Confirmation required before deletion
  - Explains soft-delete behavior
  - Loading state during removal

- ✅ **Soft Delete** (lines 110-150 in [flagId]/route.ts)
  - Sets `is_active` to false
  - Preserves flag history
  - No data loss
  - Can be reactivated if needed (future enhancement)

### Technical Details

**API POST Endpoint** (lines 19-98 in flags/route.ts):
```typescript
POST /api/admin/customers/[id]/flags

Request Body:
{
  flag_type: CustomerFlagType,
  description: string,
  color?: CustomerFlagColor
}

Response:
{
  data: {
    id: string,
    customer_id: string,
    flag_type: CustomerFlagType,
    description: string,
    color: CustomerFlagColor,
    is_active: true,
    created_by: string,
    created_at: string
  }
}
```

**API PATCH Endpoint** (lines 20-105 in [flagId]/route.ts):
```typescript
PATCH /api/admin/customers/[id]/flags/[flagId]

Request Body:
{
  flag_type?: CustomerFlagType,
  description?: string,
  color?: CustomerFlagColor
}

Response:
{
  data: CustomerFlag
}
```

**API DELETE Endpoint** (lines 110-150 in [flagId]/route.ts):
```typescript
DELETE /api/admin/customers/[id]/flags/[flagId]

Response:
{
  data: CustomerFlag (with is_active: false)
}
```

**Default Color Assignment** (lines 103-116 in flags/route.ts):
```typescript
function getDefaultColor(flagType: CustomerFlagType): CustomerFlagColor {
  switch (flagType) {
    case 'aggressive_dog':
    case 'payment_issues':
      return 'red';
    case 'vip':
      return 'green';
    case 'special_needs':
    case 'grooming_notes':
    case 'other':
    default:
      return 'yellow';
  }
}
```

### Form Validation

**Client-Side** (lines 48-59):
```typescript
if (!description.trim()) {
  setError('Description is required');
  return;
}

if (description.length > MAX_DESCRIPTION_LENGTH) {
  setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
  return;
}
```

**Server-Side** (lines 33-58 in flags/route.ts):
```typescript
// Required fields
if (!flag_type || !description?.trim()) {
  return NextResponse.json(
    { error: 'Flag type and description are required' },
    { status: 400 }
  );
}

// Length validation
if (description.length > 500) {
  return NextResponse.json(
    { error: 'Description must be 500 characters or less' },
    { status: 400 }
  );
}

// Valid flag type
const validFlagTypes = ['aggressive_dog', 'payment_issues', 'vip', 'special_needs', 'grooming_notes', 'other'];
if (!validFlagTypes.includes(flag_type)) {
  return NextResponse.json({ error: 'Invalid flag type' }, { status: 400 });
}
```

### Security Considerations

**1. 500 Character Limit** (line 31):
```typescript
const MAX_DESCRIPTION_LENGTH = 500;
```
- Prevents database overflow
- Prevents abuse
- Ensures UI consistency
- Enforced both client and server

**2. Admin-Only Access**:
```typescript
const { user } = await requireAdmin(supabase);
```
- All endpoints require admin authentication
- User ID captured as `created_by`
- Audit trail maintained

**3. Input Trimming**:
```typescript
description: description.trim()
```
- Prevents whitespace-only descriptions
- Cleans up user input
- Consistent data storage

**4. Type Safety**:
- TypeScript types for all flag types and colors
- Prevents invalid values
- Compile-time checking

**5. Soft Delete**:
- No data loss from accidental deletion
- Historical record preserved
- Can implement "undo" feature later

### Modal UX

**CustomerFlagForm**:
1. Opens with `isOpen` prop
2. Displays title based on edit mode
3. Pre-fills form if editing existing flag
4. Disables inputs during save
5. Shows loading text on submit button
6. Closes and resets on success
7. Calls `onSuccess` callback to refresh data

**RemoveFlagConfirmation**:
1. Shows flag type label and description
2. Explains soft-delete behavior
3. Red "Remove Flag" button for danger action
4. Disables buttons during removal
5. Shows "Removing..." loading text
6. Calls `onConfirm` callback on confirm

### Design System Compliance

**Modal Structure**:
- Fixed overlay with bg-black/50
- Centered white card with rounded-xl
- Shadow-lg for elevation
- Max-w-md width
- Max-h-[90vh] with overflow-y-auto

**Form Elements**:
- Consistent padding and spacing
- Border-gray-200 for inputs
- Focus ring with primary color
- Red asterisk for required fields
- Disabled state styling

**Buttons**:
- Primary: bg-[#434E54] with hover:bg-[#363F44]
- Secondary: border-gray-200 with hover:bg-gray-50
- Danger: bg-red-600 with hover:bg-red-700
- Disabled state with opacity-50

**Character Counter**:
- Normal: text-gray-500
- Warning (< 50 chars): text-orange-600
- Shows "N characters remaining"

### Integration with CustomerProfile

**Add Flag Flow** (lines 150-153 in CustomerProfile.tsx):
```typescript
const handleAddFlag = () => {
  setSelectedFlag(null); // No existing flag
  setIsFlagFormOpen(true);
};
```

**Remove Flag Flow** (lines 160-192):
```typescript
const handleRemoveFlag = (flag: CustomerFlag) => {
  setSelectedFlag(flag);
  setIsRemoveFlagOpen(true);
};

const confirmRemoveFlag = async () => {
  const response = await fetch(
    `/api/admin/customers/${customerId}/flags/${selectedFlag.id}`,
    { method: 'DELETE' }
  );

  if (response.ok) {
    fetchCustomer(); // Refresh data
    setIsRemoveFlagOpen(false);
  }
};
```

**Success Callback**:
```typescript
<CustomerFlagForm
  customerId={customerId}
  flag={selectedFlag}
  isOpen={isFlagFormOpen}
  onClose={() => {
    setIsFlagFormOpen(false);
    setSelectedFlag(null);
  }}
  onSuccess={fetchCustomer} // Refresh customer data
/>
```

### Keyboard Accessibility

- **Escape**: Close modal (implemented in parent)
- **Tab**: Navigate between form fields
- **Enter**: Submit form (when focused on input)
- **Form Submit**: Prevented if description empty

### Error Handling

**Client-Side**:
- Inline error display in red box
- Error cleared on new submit attempt
- Disabled submit button when invalid

**Server-Side**:
- 400 Bad Request for validation errors
- 401 Unauthorized for auth failures
- 404 Not Found for invalid flag ID
- 500 Internal Server Error for unexpected errors
- Descriptive error messages

### Future Enhancements

- Edit flag feature (currently only add/remove)
- Flag templates with pre-filled descriptions
- Flag expiration dates (e.g., payment issues resolved)
- Flag severity levels (low, medium, high)
- Bulk flag operations
- Flag change history/audit log
- Email notifications on flag add/remove
- Custom flag types per business needs
- Flag attachments (e.g., incident reports)
