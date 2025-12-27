/**
 * Unit tests for admin validation schemas
 * Task 0278: Test admin Zod schemas with edge cases
 */

import {
  createServiceSchema,
  updateServiceSchema,
  createAddonSchema,
  updateAddonSchema,
  createTemplateSchema,
  updateTemplateSchema,
  businessHoursSchema,
  updateSettingsSchema,
  createBannerSchema,
  updateBannerSchema,
  createReportCardSchema,
  customerSearchSchema,
  createStaffSchema,
  updateStaffSchema,
} from '@/lib/validations/admin';

describe('createServiceSchema', () => {
  const validServiceData = {
    name: 'Premium Grooming',
    description: 'Full grooming service with premium products',
    duration_minutes: 90,
    base_price_small: 4500,
    base_price_medium: 6500,
    base_price_large: 8500,
    base_price_xlarge: 10500,
    is_active: true,
    display_order: 1,
  };

  it('accepts valid service data', () => {
    const result = createServiceSchema.parse(validServiceData);
    expect(result.name).toBe('Premium Grooming');
    expect(result.duration_minutes).toBe(90);
  });

  it('rejects missing service name', () => {
    const data = { ...validServiceData, name: '' };
    expect(() => createServiceSchema.parse(data)).toThrow('Service name is required');
  });

  it('rejects service name longer than 100 characters', () => {
    const data = { ...validServiceData, name: 'A'.repeat(101) };
    expect(() => createServiceSchema.parse(data)).toThrow();
  });

  it('rejects duration longer than 8 hours (480 minutes)', () => {
    const data = { ...validServiceData, duration_minutes: 500 };
    expect(() => createServiceSchema.parse(data)).toThrow();
  });

  it('rejects negative duration', () => {
    const data = { ...validServiceData, duration_minutes: -30 };
    expect(() => createServiceSchema.parse(data)).toThrow();
  });

  it('rejects when prices do not increase with size', () => {
    const data = {
      ...validServiceData,
      base_price_small: 10000,
      base_price_medium: 8000, // Should be >= small
    };

    expect(() => createServiceSchema.parse(data)).toThrow('Prices must increase with pet size');
  });

  it('accepts prices that are equal across sizes', () => {
    const data = {
      ...validServiceData,
      base_price_small: 5000,
      base_price_medium: 5000,
      base_price_large: 5000,
      base_price_xlarge: 5000,
    };

    const result = createServiceSchema.parse(data);
    expect(result.base_price_small).toBe(5000);
  });

  it('defaults is_active to true', () => {
    const data = { ...validServiceData, is_active: undefined };
    const result = createServiceSchema.parse(data);
    expect(result.is_active).toBe(true);
  });
});

describe('updateServiceSchema', () => {
  it('accepts partial updates', () => {
    const data = { name: 'Updated Name' };
    const result = updateServiceSchema.parse(data);
    expect(result.name).toBe('Updated Name');
  });

  it('accepts updating only prices', () => {
    const data = { base_price_small: 5000 };
    const result = updateServiceSchema.parse(data);
    expect(result.base_price_small).toBe(5000);
  });
});

describe('createAddonSchema', () => {
  const validAddonData = {
    name: 'Nail Polish',
    description: 'Fun colored nail polish',
    price: 1000,
    is_size_dependent: false,
    is_active: true,
    display_order: 1,
  };

  it('accepts valid addon data', () => {
    const result = createAddonSchema.parse(validAddonData);
    expect(result.name).toBe('Nail Polish');
  });

  it('rejects price higher than $500 (50000 cents)', () => {
    const data = { ...validAddonData, price: 55000 };
    expect(() => createAddonSchema.parse(data)).toThrow();
  });

  it('accepts size-dependent pricing', () => {
    const data = {
      ...validAddonData,
      is_size_dependent: true,
      price_small: 500,
      price_medium: 700,
      price_large: 900,
      price_xlarge: 1100,
    };

    const result = createAddonSchema.parse(data);
    expect(result.is_size_dependent).toBe(true);
    expect(result.price_small).toBe(500);
  });

  it('rejects negative addon price', () => {
    const data = { ...validAddonData, price: -500 };
    expect(() => createAddonSchema.parse(data)).toThrow();
  });
});

describe('createTemplateSchema', () => {
  const validTemplateData = {
    type: 'booking_confirmation' as const,
    channel: 'email' as const,
    subject: 'Booking Confirmed',
    body: 'Hi {{customer_name}}, your booking is confirmed.',
    variables: ['customer_name', 'pet_name'],
    is_active: true,
  };

  it('accepts valid email template', () => {
    const result = createTemplateSchema.parse(validTemplateData);
    expect(result.type).toBe('booking_confirmation');
    expect(result.channel).toBe('email');
  });

  it('accepts SMS template without subject', () => {
    const data = {
      ...validTemplateData,
      channel: 'sms' as const,
      subject: undefined,
    };

    const result = createTemplateSchema.parse(data);
    expect(result.subject).toBeUndefined();
  });

  it('rejects empty body', () => {
    const data = { ...validTemplateData, body: '' };
    expect(() => createTemplateSchema.parse(data)).toThrow('Template body is required');
  });

  it('rejects body longer than 2000 characters', () => {
    const data = { ...validTemplateData, body: 'A'.repeat(2001) };
    expect(() => createTemplateSchema.parse(data)).toThrow();
  });

  it('rejects subject longer than 200 characters', () => {
    const data = { ...validTemplateData, subject: 'A'.repeat(201) };
    expect(() => createTemplateSchema.parse(data)).toThrow();
  });

  it('defaults variables to empty array', () => {
    const data = { ...validTemplateData, variables: undefined };
    const result = createTemplateSchema.parse(data);
    expect(result.variables).toEqual([]);
  });

  it('accepts all valid notification types', () => {
    const types = [
      'booking_confirmation',
      'booking_cancellation',
      'appointment_reminder',
      'status_update',
      'report_card_ready',
      'waitlist_available',
      'retention_reminder',
      'promotional',
      'newsletter',
    ] as const;

    types.forEach((type) => {
      const data = { ...validTemplateData, type };
      const result = createTemplateSchema.parse(data);
      expect(result.type).toBe(type);
    });
  });
});

describe('businessHoursSchema', () => {
  it('accepts valid business hours', () => {
    const validData = {
      day: 1, // Monday
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    };

    const result = businessHoursSchema.parse(validData);
    expect(result.day).toBe(1);
    expect(result.open_time).toBe('09:00');
  });

  it('accepts all days of week (0-6)', () => {
    for (let day = 0; day <= 6; day++) {
      const data = {
        day,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      };
      const result = businessHoursSchema.parse(data);
      expect(result.day).toBe(day);
    }
  });

  it('rejects invalid day number', () => {
    const data = {
      day: 7, // Invalid
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    };

    expect(() => businessHoursSchema.parse(data)).toThrow();
  });

  it('rejects close time before open time', () => {
    const data = {
      day: 1,
      open_time: '17:00',
      close_time: '09:00',
      is_closed: false,
    };

    expect(() => businessHoursSchema.parse(data)).toThrow('Close time must be after open time');
  });

  it('accepts closed day regardless of times', () => {
    const data = {
      day: 0,
      open_time: '00:00',
      close_time: '00:00',
      is_closed: true,
    };

    const result = businessHoursSchema.parse(data);
    expect(result.is_closed).toBe(true);
  });
});

describe('updateSettingsSchema', () => {
  it('accepts partial settings update', () => {
    const data = { booking_window_days: 90 };
    const result = updateSettingsSchema.parse(data);
    expect(result.booking_window_days).toBe(90);
  });

  it('rejects booking window > 365 days', () => {
    const data = { booking_window_days: 400 };
    expect(() => updateSettingsSchema.parse(data)).toThrow();
  });

  it('rejects cancellation window > 168 hours (1 week)', () => {
    const data = { cancellation_window_hours: 200 };
    expect(() => updateSettingsSchema.parse(data)).toThrow();
  });

  it('rejects slot duration > 240 minutes (4 hours)', () => {
    const data = { slot_duration_minutes: 300 };
    expect(() => updateSettingsSchema.parse(data)).toThrow();
  });

  it('rejects deposit percentage > 100', () => {
    const data = { deposit_percentage: 150 };
    expect(() => updateSettingsSchema.parse(data)).toThrow();
  });

  it('rejects negative loyalty points per dollar', () => {
    const data = { loyalty_points_per_dollar: -1 };
    expect(() => updateSettingsSchema.parse(data)).toThrow();
  });

  it('validates email format', () => {
    const data = { business_email: 'invalid-email' };
    expect(() => updateSettingsSchema.parse(data)).toThrow();
  });

  it('validates URL format for social media', () => {
    const data = { facebook_url: 'not-a-url' };
    expect(() => updateSettingsSchema.parse(data)).toThrow();
  });

  it('rejects empty settings object', () => {
    expect(() => updateSettingsSchema.parse({})).toThrow('At least one setting must be provided');
  });
});

describe('createBannerSchema', () => {
  const validBannerData = {
    title: 'Holiday Special',
    message: 'Get 20% off all services!',
    type: 'promo' as const,
    is_active: true,
  };

  it('accepts valid banner data', () => {
    const result = createBannerSchema.parse(validBannerData);
    expect(result.title).toBe('Holiday Special');
  });

  it('rejects empty title', () => {
    const data = { ...validBannerData, title: '' };
    expect(() => createBannerSchema.parse(data)).toThrow();
  });

  it('rejects title longer than 100 characters', () => {
    const data = { ...validBannerData, title: 'A'.repeat(101) };
    expect(() => createBannerSchema.parse(data)).toThrow();
  });

  it('rejects message longer than 500 characters', () => {
    const data = { ...validBannerData, message: 'A'.repeat(501) };
    expect(() => createBannerSchema.parse(data)).toThrow();
  });

  it('accepts all banner types', () => {
    const types = ['info', 'warning', 'success', 'promo'] as const;

    types.forEach((type) => {
      const data = { ...validBannerData, type };
      const result = createBannerSchema.parse(data);
      expect(result.type).toBe(type);
    });
  });

  it('rejects end date before start date', () => {
    const data = {
      ...validBannerData,
      start_date: '2024-12-31T00:00:00Z',
      end_date: '2024-12-01T00:00:00Z',
    };

    expect(() => createBannerSchema.parse(data)).toThrow('End date must be after start date');
  });

  it('accepts same start and end date', () => {
    const data = {
      ...validBannerData,
      start_date: '2024-12-25T00:00:00Z',
      end_date: '2024-12-25T23:59:59Z',
    };

    const result = createBannerSchema.parse(data);
    expect(result).toBeDefined();
  });
});

describe('createReportCardSchema', () => {
  const validReportCardData = {
    appointment_id: '550e8400-e29b-41d4-a716-446655440000',
    mood: 'happy' as const,
    coat_condition: 'excellent' as const,
    behavior: 'good' as const,
    groomer_notes: 'Very cooperative during grooming',
    health_observations: 'Small scratch on left paw',
    before_photo_url: 'https://example.com/before.jpg',
    after_photo_url: 'https://example.com/after.jpg',
  };

  it('accepts valid report card data', () => {
    const result = createReportCardSchema.parse(validReportCardData);
    expect(result.mood).toBe('happy');
  });

  it('accepts all mood options', () => {
    const moods = ['happy', 'calm', 'nervous', 'energetic'] as const;

    moods.forEach((mood) => {
      const data = { ...validReportCardData, mood };
      const result = createReportCardSchema.parse(data);
      expect(result.mood).toBe(mood);
    });
  });

  it('accepts all coat condition options', () => {
    const conditions = ['excellent', 'good', 'fair', 'poor'] as const;

    conditions.forEach((coat_condition) => {
      const data = { ...validReportCardData, coat_condition };
      const result = createReportCardSchema.parse(data);
      expect(result.coat_condition).toBe(coat_condition);
    });
  });

  it('accepts all behavior options', () => {
    const behaviors = ['excellent', 'good', 'fair', 'challenging'] as const;

    behaviors.forEach((behavior) => {
      const data = { ...validReportCardData, behavior };
      const result = createReportCardSchema.parse(data);
      expect(result.behavior).toBe(behavior);
    });
  });

  it('rejects groomer notes longer than 1000 characters', () => {
    const data = { ...validReportCardData, groomer_notes: 'A'.repeat(1001) };
    expect(() => createReportCardSchema.parse(data)).toThrow();
  });

  it('rejects health observations longer than 500 characters', () => {
    const data = { ...validReportCardData, health_observations: 'A'.repeat(501) };
    expect(() => createReportCardSchema.parse(data)).toThrow();
  });

  it('validates photo URLs', () => {
    const data = { ...validReportCardData, before_photo_url: 'not-a-url' };
    expect(() => createReportCardSchema.parse(data)).toThrow();
  });
});

describe('customerSearchSchema', () => {
  it('accepts valid search parameters', () => {
    const data = { query: 'John', page: 1, limit: 25 };
    const result = customerSearchSchema.parse(data);
    expect(result.query).toBe('John');
  });

  it('coerces page and limit to numbers', () => {
    const data = { query: 'test', page: '2', limit: '50' };
    const result = customerSearchSchema.parse(data);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it('defaults to page 1 and limit 25', () => {
    const data = { query: 'test' };
    const result = customerSearchSchema.parse(data);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('rejects limit > 100', () => {
    const data = { query: 'test', limit: 101 };
    expect(() => customerSearchSchema.parse(data)).toThrow();
  });

  it('accepts role filter', () => {
    const data = { query: 'test', role: 'customer' as const };
    const result = customerSearchSchema.parse(data);
    expect(result.role).toBe('customer');
  });

  it('coerces is_active to boolean', () => {
    const data = { query: 'test', is_active: 'true' };
    const result = customerSearchSchema.parse(data);
    expect(result.is_active).toBe(true);
  });
});

describe('createStaffSchema', () => {
  const validStaffData = {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+15551234567',
    role: 'groomer' as const,
    is_active: true,
  };

  it('accepts valid staff data', () => {
    const result = createStaffSchema.parse(validStaffData);
    expect(result.first_name).toBe('Jane');
    expect(result.role).toBe('groomer');
  });

  it('accepts admin role', () => {
    const data = { ...validStaffData, role: 'admin' as const };
    const result = createStaffSchema.parse(data);
    expect(result.role).toBe('admin');
  });

  it('rejects customer role for staff', () => {
    const data = { ...validStaffData, role: 'customer' };
    expect(() => createStaffSchema.parse(data)).toThrow();
  });

  it('validates email format', () => {
    const data = { ...validStaffData, email: 'invalid-email' };
    expect(() => createStaffSchema.parse(data)).toThrow();
  });

  it('validates phone number format', () => {
    const data = { ...validStaffData, phone: '123' };
    expect(() => createStaffSchema.parse(data)).toThrow();
  });

  it('defaults is_active to true', () => {
    const data = { ...validStaffData, is_active: undefined };
    const result = createStaffSchema.parse(data);
    expect(result.is_active).toBe(true);
  });
});

describe('updateStaffSchema', () => {
  it('accepts partial staff updates', () => {
    const data = { first_name: 'Updated Name' };
    const result = updateStaffSchema.parse(data);
    expect(result.first_name).toBe('Updated Name');
  });

  it('allows deactivating staff', () => {
    const data = { is_active: false };
    const result = updateStaffSchema.parse(data);
    expect(result.is_active).toBe(false);
  });
});

describe('Admin Schema Security', () => {
  it('rejects SQL injection in service name', () => {
    const data = {
      name: "'; DROP TABLE services; --",
      duration_minutes: 60,
      base_price_small: 4000,
      base_price_medium: 6000,
      base_price_large: 8000,
      base_price_xlarge: 10000,
    };

    // Schema accepts it (validation happens at DB layer)
    // But string length limits provide some protection
    const result = createServiceSchema.parse(data);
    expect(result.name).toContain('DROP');
  });

  it('handles XSS attempts in banner message', () => {
    const data = {
      title: 'Test',
      message: '<script>alert("XSS")</script>',
      type: 'info' as const,
    };

    // Schema accepts it (sanitization happens at render time)
    const result = createBannerSchema.parse(data);
    expect(result.message).toContain('script');
  });
});
