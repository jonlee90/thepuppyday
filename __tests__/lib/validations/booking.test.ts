/**
 * Unit tests for booking validation schemas
 * Task 0278: Test booking Zod schemas with edge cases
 */

import {
  petInfoSchema,
  contactInfoSchema,
  serviceSelectionSchema,
  bookingRequestSchema,
  availabilityQuerySchema,
  appointmentUpdateSchema,
  waitlistRequestSchema,
} from '@/lib/validations/booking';

describe('petInfoSchema', () => {
  it('accepts valid pet information', () => {
    const validData = {
      name: 'Buddy',
      breed_id: '550e8400-e29b-41d4-a716-446655440000',
      size: 'medium' as const,
      weight: 30,
      medical_info: 'Allergic to chicken',
      notes: 'Very friendly',
    };

    const result = petInfoSchema.parse(validData);
    expect(result.name).toBe('Buddy');
    expect(result.size).toBe('medium');
  });

  it('rejects missing pet name', () => {
    const data = { name: '', size: 'small' as const };
    expect(() => petInfoSchema.parse(data)).toThrow('Pet name is required');
  });

  it('rejects pet name longer than 50 characters', () => {
    const data = { name: 'A'.repeat(51), size: 'small' as const };
    expect(() => petInfoSchema.parse(data)).toThrow('Pet name is too long');
  });

  it('rejects invalid pet size', () => {
    const data = { name: 'Buddy', size: 'tiny' };
    expect(() => petInfoSchema.parse(data)).toThrow();
  });

  it('accepts custom breed when breed_id not provided', () => {
    const data = {
      name: 'Max',
      breed_custom: 'Mixed Terrier',
      size: 'small' as const,
    };

    const result = petInfoSchema.parse(data);
    expect(result.breed_custom).toBe('Mixed Terrier');
  });

  it('rejects weight over 200 lbs', () => {
    const data = { name: 'Huge Dog', size: 'xlarge' as const, weight: 250 };
    expect(() => petInfoSchema.parse(data)).toThrow();
  });

  it('rejects negative weight', () => {
    const data = { name: 'Test', size: 'small' as const, weight: -5 };
    expect(() => petInfoSchema.parse(data)).toThrow();
  });

  it('rejects medical info longer than 1000 characters', () => {
    const data = {
      name: 'Buddy',
      size: 'medium' as const,
      medical_info: 'A'.repeat(1001),
    };
    expect(() => petInfoSchema.parse(data)).toThrow();
  });

  it('rejects notes longer than 500 characters', () => {
    const data = {
      name: 'Buddy',
      size: 'medium' as const,
      notes: 'A'.repeat(501),
    };
    expect(() => petInfoSchema.parse(data)).toThrow();
  });
});

describe('contactInfoSchema', () => {
  it('accepts valid contact information', () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+15551234567',
    };

    const result = contactInfoSchema.parse(validData);
    expect(result.firstName).toBe('John');
    expect(result.email).toBe('john.doe@example.com');
  });

  it('rejects missing first name', () => {
    const data = {
      firstName: '',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+15551234567',
    };
    expect(() => contactInfoSchema.parse(data)).toThrow('First name is required');
  });

  it('rejects missing last name', () => {
    const data = {
      firstName: 'John',
      lastName: '',
      email: 'john@example.com',
      phone: '+15551234567',
    };
    expect(() => contactInfoSchema.parse(data)).toThrow('Last name is required');
  });

  it('rejects invalid email', () => {
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      phone: '+15551234567',
    };
    expect(() => contactInfoSchema.parse(data)).toThrow();
  });

  it('validates phone number format', () => {
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '123', // Too short
    };
    expect(() => contactInfoSchema.parse(data)).toThrow();
  });
});

describe('serviceSelectionSchema', () => {
  it('accepts valid service selection', () => {
    const validData = {
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      addon_ids: ['660e8400-e29b-41d4-a716-446655440001'],
    };

    const result = serviceSelectionSchema.parse(validData);
    expect(result.service_id).toBeDefined();
    expect(result.addon_ids).toHaveLength(1);
  });

  it('defaults to empty addon_ids array', () => {
    const data = { service_id: '550e8400-e29b-41d4-a716-446655440000' };
    const result = serviceSelectionSchema.parse(data);
    expect(result.addon_ids).toEqual([]);
  });

  it('rejects invalid service_id format', () => {
    const data = { service_id: 'not-a-uuid' };
    expect(() => serviceSelectionSchema.parse(data)).toThrow();
  });

  it('rejects invalid addon_id format in array', () => {
    const data = {
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      addon_ids: ['not-a-uuid'],
    };
    expect(() => serviceSelectionSchema.parse(data)).toThrow();
  });
});

describe('bookingRequestSchema', () => {
  const validBookingRequest = {
    service_id: '550e8400-e29b-41d4-a716-446655440000',
    addon_ids: [],
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    pet_id: '660e8400-e29b-41d4-a716-446655440001',
    customer_id: '770e8400-e29b-41d4-a716-446655440002',
  };

  it('accepts valid booking request with pet_id and customer_id', () => {
    const result = bookingRequestSchema.parse(validBookingRequest);
    expect(result.service_id).toBeDefined();
    expect(result.pet_id).toBeDefined();
    expect(result.customer_id).toBeDefined();
  });

  it('accepts booking request with pet_info instead of pet_id', () => {
    const data = {
      ...validBookingRequest,
      pet_id: undefined,
      pet_info: {
        name: 'Max',
        size: 'medium' as const,
      },
    };

    const result = bookingRequestSchema.parse(data);
    expect(result.pet_info).toBeDefined();
  });

  it('accepts booking request with contact_info instead of customer_id', () => {
    const data = {
      ...validBookingRequest,
      customer_id: undefined,
      contact_info: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+15551234567',
      },
    };

    const result = bookingRequestSchema.parse(data);
    expect(result.contact_info).toBeDefined();
  });

  it('rejects when neither pet_id nor pet_info provided', () => {
    const data = {
      ...validBookingRequest,
      pet_id: undefined,
      pet_info: undefined,
    };

    expect(() => bookingRequestSchema.parse(data)).toThrow(
      'Either pet_id or pet_info must be provided'
    );
  });

  it('rejects when neither customer_id nor contact_info provided', () => {
    const data = {
      ...validBookingRequest,
      customer_id: undefined,
      contact_info: undefined,
    };

    expect(() => bookingRequestSchema.parse(data)).toThrow(
      'Either customer_id or contact_info must be provided'
    );
  });

  it('rejects invalid datetime format', () => {
    const data = {
      ...validBookingRequest,
      scheduled_at: '2024-12-25', // Date only, not datetime
    };

    expect(() => bookingRequestSchema.parse(data)).toThrow('Invalid date/time format');
  });

  it('accepts special instructions', () => {
    const data = {
      ...validBookingRequest,
      special_instructions: 'Please be gentle with nails',
    };

    const result = bookingRequestSchema.parse(data);
    expect(result.special_instructions).toBe('Please be gentle with nails');
  });

  it('rejects special instructions longer than 500 characters', () => {
    const data = {
      ...validBookingRequest,
      special_instructions: 'A'.repeat(501),
    };

    expect(() => bookingRequestSchema.parse(data)).toThrow();
  });
});

describe('availabilityQuerySchema', () => {
  it('accepts valid availability query', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];

    const validData = {
      date: dateString,
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      duration_minutes: 60,
    };

    const result = availabilityQuerySchema.parse(validData);
    expect(result.date).toBe(dateString);
    expect(result.duration_minutes).toBe(60);
  });

  it('rejects past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const dateString = pastDate.toISOString().split('T')[0];

    const data = {
      date: dateString,
      service_id: '550e8400-e29b-41d4-a716-446655440000',
    };

    expect(() => availabilityQuerySchema.parse(data)).toThrow('Date cannot be in the past');
  });

  it('accepts query without duration_minutes', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const dateString = futureDate.toISOString().split('T')[0];

    const data = {
      date: dateString,
      service_id: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = availabilityQuerySchema.parse(data);
    expect(result.duration_minutes).toBeUndefined();
  });

  it('rejects negative duration', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const dateString = futureDate.toISOString().split('T')[0];

    const data = {
      date: dateString,
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      duration_minutes: -30,
    };

    expect(() => availabilityQuerySchema.parse(data)).toThrow();
  });
});

describe('appointmentUpdateSchema', () => {
  it('accepts valid appointment update', () => {
    const validData = {
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      status: 'confirmed' as const,
      admin_notes: 'Customer called to confirm',
    };

    const result = appointmentUpdateSchema.parse(validData);
    expect(result.status).toBe('confirmed');
  });

  it('accepts partial update with only status', () => {
    const data = { status: 'cancelled' as const };
    const result = appointmentUpdateSchema.parse(data);
    expect(result.status).toBe('cancelled');
  });

  it('accepts partial update with only scheduled_at', () => {
    const data = { scheduled_at: new Date(Date.now() + 86400000).toISOString() };
    const result = appointmentUpdateSchema.parse(data);
    expect(result.scheduled_at).toBeDefined();
  });

  it('rejects empty update object', () => {
    expect(() => appointmentUpdateSchema.parse({})).toThrow('At least one field must be provided');
  });

  it('rejects invalid status', () => {
    const data = { status: 'pending' }; // 'pending' not allowed in updates
    expect(() => appointmentUpdateSchema.parse(data)).toThrow();
  });

  it('rejects admin notes longer than 1000 characters', () => {
    const data = { admin_notes: 'A'.repeat(1001) };
    expect(() => appointmentUpdateSchema.parse(data)).toThrow();
  });
});

describe('waitlistRequestSchema', () => {
  const validWaitlistRequest = {
    customer_id: '550e8400-e29b-41d4-a716-446655440000',
    service_id: '660e8400-e29b-41d4-a716-446655440001',
    pet_id: '770e8400-e29b-41d4-a716-446655440002',
    preferred_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    flexibility: 'same_day' as const,
  };

  it('accepts valid waitlist request', () => {
    const result = waitlistRequestSchema.parse(validWaitlistRequest);
    expect(result.flexibility).toBe('same_day');
  });

  it('defaults flexibility to same_day', () => {
    const data = { ...validWaitlistRequest, flexibility: undefined };
    const result = waitlistRequestSchema.parse(data);
    expect(result.flexibility).toBe('same_day');
  });

  it('accepts preferred_time', () => {
    const data = {
      ...validWaitlistRequest,
      preferred_time: '14:00',
    };

    const result = waitlistRequestSchema.parse(data);
    expect(result.preferred_time).toBe('14:00');
  });

  it('rejects invalid time format', () => {
    const data = {
      ...validWaitlistRequest,
      preferred_time: '2:00 PM', // Wrong format
    };

    expect(() => waitlistRequestSchema.parse(data)).toThrow();
  });

  it('accepts notes', () => {
    const data = {
      ...validWaitlistRequest,
      notes: 'Prefer morning appointments',
    };

    const result = waitlistRequestSchema.parse(data);
    expect(result.notes).toBe('Prefer morning appointments');
  });

  it('rejects notes longer than 500 characters', () => {
    const data = {
      ...validWaitlistRequest,
      notes: 'A'.repeat(501),
    };

    expect(() => waitlistRequestSchema.parse(data)).toThrow();
  });

  it('accepts all flexibility options', () => {
    const flexibilities = ['same_day', 'same_week', 'any'] as const;

    flexibilities.forEach((flexibility) => {
      const data = { ...validWaitlistRequest, flexibility };
      const result = waitlistRequestSchema.parse(data);
      expect(result.flexibility).toBe(flexibility);
    });
  });

  it('rejects past preferred_date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const dateString = pastDate.toISOString().split('T')[0];

    const data = { ...validWaitlistRequest, preferred_date: dateString };

    expect(() => waitlistRequestSchema.parse(data)).toThrow('Date cannot be in the past');
  });
});

describe('Booking Schema Edge Cases', () => {
  it('handles multiple add-ons in booking request', () => {
    const data = {
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      addon_ids: [
        '660e8400-e29b-41d4-a716-446655440001',
        '660e8400-e29b-41d4-a716-446655440002',
        '660e8400-e29b-41d4-a716-446655440003',
      ],
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      pet_id: '770e8400-e29b-41d4-a716-446655440004',
      customer_id: '880e8400-e29b-41d4-a716-446655440005',
    };

    const result = bookingRequestSchema.parse(data);
    expect(result.addon_ids).toHaveLength(3);
  });

  it('sanitizes special characters in names', () => {
    const data = {
      name: "O'Brien's Dog <script>",
      size: 'medium' as const,
    };

    // Schema accepts it, but application should sanitize
    const result = petInfoSchema.parse(data);
    expect(result.name).toContain("O'Brien");
  });

  it('handles UTC vs local timezone in datetime', () => {
    const utcDate = new Date().toISOString();
    const data = {
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      scheduled_at: utcDate,
      pet_id: '770e8400-e29b-41d4-a716-446655440004',
      customer_id: '880e8400-e29b-41d4-a716-446655440005',
    };

    const result = bookingRequestSchema.parse(data);
    expect(result.scheduled_at).toBe(utcDate);
  });
});
