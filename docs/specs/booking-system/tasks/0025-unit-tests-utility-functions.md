# Task 25: Write Unit Tests for Booking Utility Functions

## Description
Create comprehensive unit tests for the booking utility functions (pricing, availability, validation).

## Files to create
- `src/lib/booking/__tests__/pricing.test.ts`
- `src/lib/booking/__tests__/availability.test.ts`
- `src/lib/booking/__tests__/validation.test.ts`

## Requirements References
- Req 10.1: Calculate correct size-based price
- Req 10.2: Add each add-on's price to running total
- Req 14.1: Exclude times with existing appointments
- Req 14.2: Block appropriate number of slots for duration

## Implementation Details

### pricing.test.ts
```typescript
import {
  getServicePriceForSize,
  determineSizeFromWeight,
  calculateTotal,
  formatCurrency,
} from '../pricing';

describe('getServicePriceForSize', () => {
  const mockService = {
    id: 'service-1',
    name: 'Basic Grooming',
    prices: [
      { size: 'small', price: 40 },
      { size: 'medium', price: 55 },
      { size: 'large', price: 70 },
      { size: 'xlarge', price: 85 },
    ],
  };

  it('returns correct price for small size', () => {
    expect(getServicePriceForSize(mockService, 'small')).toBe(40);
  });

  it('returns correct price for medium size', () => {
    expect(getServicePriceForSize(mockService, 'medium')).toBe(55);
  });

  it('returns correct price for large size', () => {
    expect(getServicePriceForSize(mockService, 'large')).toBe(70);
  });

  it('returns correct price for xlarge size', () => {
    expect(getServicePriceForSize(mockService, 'xlarge')).toBe(85);
  });

  it('returns 0 for size without price entry', () => {
    const serviceWithoutXlarge = {
      ...mockService,
      prices: mockService.prices.filter(p => p.size !== 'xlarge'),
    };
    expect(getServicePriceForSize(serviceWithoutXlarge, 'xlarge')).toBe(0);
  });

  it('returns 0 for service without prices array', () => {
    const serviceWithoutPrices = { ...mockService, prices: undefined };
    expect(getServicePriceForSize(serviceWithoutPrices, 'medium')).toBe(0);
  });
});

describe('determineSizeFromWeight', () => {
  it('returns small for weights 0-18 lbs', () => {
    expect(determineSizeFromWeight(0)).toBe('small');
    expect(determineSizeFromWeight(10)).toBe('small');
    expect(determineSizeFromWeight(18)).toBe('small');
  });

  it('returns medium for weights 19-35 lbs', () => {
    expect(determineSizeFromWeight(19)).toBe('medium');
    expect(determineSizeFromWeight(25)).toBe('medium');
    expect(determineSizeFromWeight(35)).toBe('medium');
  });

  it('returns large for weights 36-65 lbs', () => {
    expect(determineSizeFromWeight(36)).toBe('large');
    expect(determineSizeFromWeight(50)).toBe('large');
    expect(determineSizeFromWeight(65)).toBe('large');
  });

  it('returns xlarge for weights 66+ lbs', () => {
    expect(determineSizeFromWeight(66)).toBe('xlarge');
    expect(determineSizeFromWeight(100)).toBe('xlarge');
    expect(determineSizeFromWeight(200)).toBe('xlarge');
  });
});

describe('calculateTotal', () => {
  it('returns service price when no addons', () => {
    expect(calculateTotal(55, [])).toBe(55);
  });

  it('adds single addon price', () => {
    expect(calculateTotal(55, [{ name: 'Teeth', price: 10 }])).toBe(65);
  });

  it('adds multiple addon prices', () => {
    const addons = [
      { name: 'Teeth', price: 10 },
      { name: 'Pawdicure', price: 15 },
    ];
    expect(calculateTotal(55, addons)).toBe(80);
  });
});

describe('formatCurrency', () => {
  it('formats whole numbers', () => {
    expect(formatCurrency(55)).toBe('$55.00');
  });

  it('formats decimal numbers', () => {
    expect(formatCurrency(55.5)).toBe('$55.50');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(55.999)).toBe('$56.00');
  });
});
```

### availability.test.ts
```typescript
import {
  generateTimeSlots,
  hasConflict,
  getAvailableSlots,
  isBusinessDay,
  filterPastSlots,
} from '../availability';

describe('generateTimeSlots', () => {
  const businessHours = { open: '09:00', close: '17:00', is_open: true };

  it('generates 30-minute slots within business hours', () => {
    const slots = generateTimeSlots('2025-12-15', businessHours, 30);
    expect(slots[0]).toBe('09:00');
    expect(slots[1]).toBe('09:30');
    expect(slots[slots.length - 1]).toBe('16:30');
    expect(slots.length).toBe(16); // 8 hours * 2 slots per hour
  });

  it('returns empty array for closed day', () => {
    const closedHours = { open: '00:00', close: '00:00', is_open: false };
    const slots = generateTimeSlots('2025-12-15', closedHours, 30);
    expect(slots).toEqual([]);
  });
});

describe('hasConflict', () => {
  const existingAppointments = [
    { scheduled_at: '2025-12-15T10:00:00Z', duration_minutes: 60, status: 'confirmed' },
  ];

  it('detects conflict with overlapping appointment', () => {
    expect(hasConflict('10:00', 60, existingAppointments, '2025-12-15')).toBe(true);
    expect(hasConflict('10:30', 60, existingAppointments, '2025-12-15')).toBe(true);
  });

  it('detects conflict when new appointment overlaps end of existing', () => {
    expect(hasConflict('09:30', 60, existingAppointments, '2025-12-15')).toBe(true);
  });

  it('allows non-overlapping appointments', () => {
    expect(hasConflict('11:00', 60, existingAppointments, '2025-12-15')).toBe(false);
    expect(hasConflict('09:00', 30, existingAppointments, '2025-12-15')).toBe(false);
  });

  it('ignores cancelled appointments', () => {
    const withCancelled = [
      { scheduled_at: '2025-12-15T10:00:00Z', duration_minutes: 60, status: 'cancelled' },
    ];
    expect(hasConflict('10:00', 60, withCancelled, '2025-12-15')).toBe(false);
  });

  it('considers appointment duration', () => {
    // New 90-min appointment starting at 09:00 should conflict with 10:00 existing
    expect(hasConflict('09:00', 90, existingAppointments, '2025-12-15')).toBe(true);
    // But 30-min should not
    expect(hasConflict('09:00', 30, existingAppointments, '2025-12-15')).toBe(false);
  });
});

describe('filterPastSlots', () => {
  it('filters past slots on today', () => {
    const today = new Date().toISOString().split('T')[0];
    const slots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

    // Mock current time as 11:15
    jest.useFakeTimers().setSystemTime(new Date(`${today}T11:15:00`));

    const filtered = filterPastSlots(slots, today, 30); // 30 min buffer
    expect(filtered).not.toContain('09:00');
    expect(filtered).not.toContain('10:00');
    expect(filtered).not.toContain('11:00');
    expect(filtered).not.toContain('11:30'); // Within buffer
    expect(filtered[0]).toBe('12:00');

    jest.useRealTimers();
  });

  it('returns all slots for future dates', () => {
    const futureDate = '2025-12-31';
    const slots = ['09:00', '10:00', '11:00'];
    const filtered = filterPastSlots(slots, futureDate, 30);
    expect(filtered).toEqual(slots);
  });
});

describe('isBusinessDay', () => {
  const businessHours = {
    sunday: { is_open: false },
    monday: { is_open: true },
    tuesday: { is_open: true },
    wednesday: { is_open: true },
    thursday: { is_open: true },
    friday: { is_open: true },
    saturday: { is_open: true },
  };

  it('returns true for open days', () => {
    expect(isBusinessDay('2025-12-15', businessHours)).toBe(true); // Monday
    expect(isBusinessDay('2025-12-20', businessHours)).toBe(true); // Saturday
  });

  it('returns false for closed days', () => {
    expect(isBusinessDay('2025-12-14', businessHours)).toBe(false); // Sunday
    expect(isBusinessDay('2025-12-21', businessHours)).toBe(false); // Sunday
  });
});
```

### validation.test.ts
```typescript
import { petFormSchema, guestInfoSchema } from '../schemas';

describe('petFormSchema', () => {
  it('validates valid pet data', () => {
    const result = petFormSchema.safeParse({
      name: 'Max',
      size: 'medium',
    });
    expect(result.success).toBe(true);
  });

  it('requires name', () => {
    const result = petFormSchema.safeParse({ size: 'medium' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Pet name is required');
  });

  it('requires valid size', () => {
    const result = petFormSchema.safeParse({ name: 'Max', size: 'tiny' });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = petFormSchema.safeParse({
      name: 'Max',
      size: 'medium',
      weight: 25,
      notes: 'Friendly dog',
    });
    expect(result.success).toBe(true);
  });
});

describe('guestInfoSchema', () => {
  it('validates valid guest info', () => {
    const result = guestInfoSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
    });
    expect(result.success).toBe(true);
  });

  it('validates email format', () => {
    const result = guestInfoSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      phone: '555-123-4567',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Please enter a valid email address');
  });

  it('validates phone format', () => {
    const result = guestInfoSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Please enter a valid phone number');
  });

  it('accepts various phone formats', () => {
    const validPhones = ['555-123-4567', '(555) 123-4567', '5551234567', '+1 555 123 4567'];
    validPhones.forEach(phone => {
      const result = guestInfoSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone,
      });
      expect(result.success).toBe(true);
    });
  });
});
```

## Acceptance Criteria
- [ ] All pricing functions have test coverage
- [ ] determineSizeFromWeight boundary cases tested
- [ ] Time slot generation tested for business hours
- [ ] Conflict detection tested for various overlap scenarios
- [ ] Past slot filtering tested with mocked time
- [ ] Validation schemas tested for required fields
- [ ] Email validation error message matches requirement
- [ ] Phone validation error message matches requirement
- [ ] Multiple phone formats accepted
- [ ] All tests pass with `npm run test`

## Estimated Complexity
Medium

## Phase
Phase 8: Testing

## Dependencies
- Task 1 (utility functions to test)
- Task 20 (validation schemas)
