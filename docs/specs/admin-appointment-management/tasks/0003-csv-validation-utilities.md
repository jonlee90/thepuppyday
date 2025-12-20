# Task 0003: CSV-Specific Validation Utilities

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0002
**Estimated Effort**: 3 hours

## Objective

Create CSV-specific validation utilities that extend existing booking validation schemas.

## Requirements

- REQ-2.6, REQ-2.7: Customer validation
- REQ-3.5, REQ-3.6, REQ-3.7, REQ-3.8: Pet validation
- REQ-6.3, REQ-6.5, REQ-6.7: Date/time validation
- REQ-9.4, REQ-9.5: Payment validation

## Implementation Details

### Files to Create

**`src/lib/admin/appointments/csv-validation.ts`**

**Note**: Leverage existing validation from `src/lib/booking/validation.ts`

Implement:
```typescript
import { z } from 'zod';
import { guestInfoSchema, petFormSchema } from '@/lib/booking/validation';

// Extend existing schemas for CSV context
export const CSVCustomerSchema = guestInfoSchema.extend({
  customer_name: z.string().min(1, 'Customer name required'),
  customer_email: z.string().email('Invalid email format'),
  customer_phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Invalid phone format'),
});

export const CSVPetSchema = petFormSchema.extend({
  pet_breed: z.string().min(1, 'Breed required'),
  pet_size: z.enum(['small', 'medium', 'large', 'x-large'], {
    errorMap: () => ({ message: 'Invalid size' }),
  }),
  pet_weight: z.number().positive('Weight must be positive'),
});

export const CSVAppointmentRowSchema = z.object({
  customer_name: z.string(),
  customer_email: z.string().email(),
  customer_phone: z.string(),
  pet_name: z.string(),
  pet_breed: z.string(),
  pet_size: z.string(),
  pet_weight: z.number(),
  service_name: z.string(),
  addons: z.string().optional(),
  date: z.string(),
  time: z.string(),
  notes: z.string().optional(),
  payment_status: z.enum(['pending', 'paid', 'partially_paid']).optional(),
  amount_paid: z.number().optional(),
  payment_method: z.string().optional(),
});

/**
 * Parse CSV date/time strings supporting multiple formats
 * Formats: YYYY-MM-DD, MM/DD/YYYY, 12h (9:00 AM), 24h (09:00)
 */
export function parseCSVDateTime(dateStr: string, timeStr: string): Date | null {
  // Implementation handles multiple formats
}

/**
 * Normalize payment status to lowercase enum value
 */
export function normalizePaymentStatus(status: string): PaymentStatus {
  const normalized = status.toLowerCase().trim();
  if (['pending', 'paid', 'partially_paid'].includes(normalized)) {
    return normalized as PaymentStatus;
  }
  return 'pending';
}

/**
 * Normalize pet size to lowercase enum value
 */
export function normalizePetSize(size: string): 'small' | 'medium' | 'large' | 'x-large' {
  const normalized = size.toLowerCase().trim();
  const sizeMap: Record<string, any> = {
    small: 'small',
    s: 'small',
    medium: 'medium',
    med: 'medium',
    m: 'medium',
    large: 'large',
    l: 'large',
    'x-large': 'x-large',
    xlarge: 'x-large',
    xl: 'x-large',
  };
  return sizeMap[normalized] || 'medium';
}

/**
 * Validate weight against size - returns warning, not error
 */
export function validateWeightForSize(
  weight: number,
  size: string
): ValidationWarning | null {
  const ranges: Record<string, { min: number; max: number }> = {
    small: { min: 0, max: 18 },
    medium: { min: 19, max: 35 },
    large: { min: 36, max: 65 },
    'x-large': { min: 66, max: 999 },
  };

  const range = ranges[size];
  if (!range) return null;

  if (weight < range.min || weight > range.max) {
    return {
      field: 'pet_weight',
      message: `Weight ${weight} lbs is outside typical range for ${size} (${range.min}-${range.max} lbs)`,
      severity: 'warning',
    };
  }

  return null;
}
```

### Unit Tests

Create `__tests__/lib/admin/appointments/csv-validation.test.ts`:
- Test all date/time format variations
- Test payment status normalization
- Test pet size normalization
- Test weight/size validation warnings
- Test edge cases (empty strings, invalid formats)

## Acceptance Criteria

- [ ] All CSV-specific Zod schemas validate correctly
- [ ] Multiple date/time formats parsed successfully (YYYY-MM-DD, MM/DD/YYYY, 12h, 24h)
- [ ] Payment status normalized (case-insensitive)
- [ ] Pet size normalized (case-insensitive, abbreviations)
- [ ] Weight/size mismatch returns warning, not error
- [ ] 100% test coverage on validation functions
- [ ] All unit tests pass

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-2, 3, 6, 9)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 2.2)
- **Existing Validation**: src/lib/booking/validation.ts
