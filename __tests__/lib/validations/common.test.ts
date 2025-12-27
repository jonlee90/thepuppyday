/**
 * Unit tests for common validation schemas
 * Task 0278: Test Zod validation schemas with edge cases
 */

import {
  emailSchema,
  phoneSchema,
  uuidSchema,
  dateSchema,
  futureDateSchema,
  timeSchema,
  urlSchema,
  positiveIntSchema,
  nonNegativeIntSchema,
  paginationSchema,
  searchSchema,
  dateRangeSchema,
  petSizeSchema,
  userRoleSchema,
  appointmentStatusSchema,
  paymentStatusSchema,
  imageFileSchema,
  moneySchema,
  notificationTypeSchema,
  notificationChannelSchema,
} from '@/lib/validations';

describe('emailSchema', () => {
  it('accepts valid email addresses', () => {
    expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
    expect(emailSchema.parse('user+tag@domain.co.uk')).toBe('user+tag@domain.co.uk');
    expect(emailSchema.parse('First.Last@example.com')).toBe('first.last@example.com'); // lowercase
  });

  it('rejects invalid email formats', () => {
    expect(() => emailSchema.parse('invalid')).toThrow();
    expect(() => emailSchema.parse('missing@domain')).toThrow();
    expect(() => emailSchema.parse('@nodomain.com')).toThrow();
    expect(() => emailSchema.parse('no-at-sign.com')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => emailSchema.parse('')).toThrow('Email is required');
  });

  it('converts to lowercase', () => {
    expect(emailSchema.parse('TEST@EXAMPLE.COM')).toBe('test@example.com');
  });
});

describe('phoneSchema', () => {
  it('accepts valid phone numbers', () => {
    expect(phoneSchema.parse('+15551234567')).toBe('+15551234567');
    expect(phoneSchema.parse('+442012345678')).toBe('+442012345678');
  });

  it('accepts phone with formatting characters', () => {
    expect(phoneSchema.parse('+1 (555) 123-4567')).toBeDefined();
    expect(phoneSchema.parse('+1-555-123-4567')).toBeDefined();
  });

  it('accepts undefined/optional', () => {
    expect(phoneSchema.parse(undefined)).toBeUndefined();
    expect(phoneSchema.parse('')).toBe('');
  });

  it('rejects invalid phone numbers', () => {
    expect(() => phoneSchema.parse('123')).toThrow(); // Too short
    expect(() => phoneSchema.parse('abc')).toThrow(); // Non-numeric
  });
});

describe('uuidSchema', () => {
  it('accepts valid UUIDs', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(uuidSchema.parse(validUuid)).toBe(validUuid);
  });

  it('rejects invalid UUID formats', () => {
    expect(() => uuidSchema.parse('not-a-uuid')).toThrow('Invalid ID format');
    expect(() => uuidSchema.parse('12345')).toThrow();
    expect(() => uuidSchema.parse('')).toThrow();
  });
});

describe('dateSchema', () => {
  it('accepts valid date format YYYY-MM-DD', () => {
    expect(dateSchema.parse('2024-12-25')).toBe('2024-12-25');
    expect(dateSchema.parse('2024-01-01')).toBe('2024-01-01');
  });

  it('rejects invalid date formats', () => {
    expect(() => dateSchema.parse('12/25/2024')).toThrow(); // Wrong format
    expect(() => dateSchema.parse('2024-1-1')).toThrow(); // Missing leading zeros
    expect(() => dateSchema.parse('not-a-date')).toThrow();
  });
});

describe('futureDateSchema', () => {
  it('accepts future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];

    expect(futureDateSchema.parse(dateString)).toBe(dateString);
  });

  it('accepts today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(futureDateSchema.parse(today)).toBe(today);
  });

  it('rejects past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const dateString = pastDate.toISOString().split('T')[0];

    expect(() => futureDateSchema.parse(dateString)).toThrow('Date cannot be in the past');
  });
});

describe('timeSchema', () => {
  it('accepts valid time format HH:MM', () => {
    expect(timeSchema.parse('09:00')).toBe('09:00');
    expect(timeSchema.parse('23:59')).toBe('23:59');
    expect(timeSchema.parse('00:00')).toBe('00:00');
  });

  it('rejects invalid time formats', () => {
    expect(() => timeSchema.parse('9:00')).toThrow(); // Missing leading zero
    expect(() => timeSchema.parse('25:00')).toThrow(); // Invalid hour
    expect(() => timeSchema.parse('12:60')).toThrow(); // Invalid minute
    expect(() => timeSchema.parse('12:5')).toThrow(); // Missing leading zero
  });
});

describe('urlSchema', () => {
  it('accepts valid URLs', () => {
    expect(urlSchema.parse('https://example.com')).toBe('https://example.com');
    expect(urlSchema.parse('http://example.com/path?query=value')).toBeDefined();
  });

  it('rejects invalid URLs', () => {
    expect(() => urlSchema.parse('not-a-url')).toThrow('Please enter a valid URL');
    expect(() => urlSchema.parse('example.com')).toThrow(); // Missing protocol
  });
});

describe('positiveIntSchema', () => {
  it('accepts positive integers', () => {
    expect(positiveIntSchema.parse(1)).toBe(1);
    expect(positiveIntSchema.parse(100)).toBe(100);
  });

  it('rejects zero', () => {
    expect(() => positiveIntSchema.parse(0)).toThrow('Must be greater than zero');
  });

  it('rejects negative numbers', () => {
    expect(() => positiveIntSchema.parse(-1)).toThrow();
  });

  it('rejects decimals', () => {
    expect(() => positiveIntSchema.parse(1.5)).toThrow('Must be a whole number');
  });
});

describe('nonNegativeIntSchema', () => {
  it('accepts zero', () => {
    expect(nonNegativeIntSchema.parse(0)).toBe(0);
  });

  it('accepts positive integers', () => {
    expect(nonNegativeIntSchema.parse(10)).toBe(10);
  });

  it('rejects negative numbers', () => {
    expect(() => nonNegativeIntSchema.parse(-1)).toThrow('Must be zero or greater');
  });

  it('rejects decimals', () => {
    expect(() => nonNegativeIntSchema.parse(1.5)).toThrow('Must be a whole number');
  });
});

describe('paginationSchema', () => {
  it('accepts valid pagination parameters', () => {
    const result = paginationSchema.parse({ page: 1, limit: 25 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('coerces string numbers to integers', () => {
    const result = paginationSchema.parse({ page: '2', limit: '50' });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it('applies defaults when not provided', () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('rejects page less than 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });

  it('rejects limit greater than 100', () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });
});

describe('searchSchema', () => {
  it('accepts valid search parameters', () => {
    const result = searchSchema.parse({ query: 'test', page: 1, limit: 10 });
    expect(result.query).toBe('test');
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('rejects empty query', () => {
    expect(() => searchSchema.parse({ query: '' })).toThrow();
  });

  it('rejects query longer than 200 characters', () => {
    const longQuery = 'a'.repeat(201);
    expect(() => searchSchema.parse({ query: longQuery })).toThrow();
  });
});

describe('dateRangeSchema', () => {
  it('accepts valid date range', () => {
    const result = dateRangeSchema.parse({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBe('2024-01-31');
  });

  it('accepts same start and end date', () => {
    const result = dateRangeSchema.parse({
      startDate: '2024-01-01',
      endDate: '2024-01-01',
    });
    expect(result).toBeDefined();
  });

  it('rejects end date before start date', () => {
    expect(() =>
      dateRangeSchema.parse({
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      })
    ).toThrow('End date must be after start date');
  });
});

describe('petSizeSchema', () => {
  it('accepts valid pet sizes', () => {
    expect(petSizeSchema.parse('small')).toBe('small');
    expect(petSizeSchema.parse('medium')).toBe('medium');
    expect(petSizeSchema.parse('large')).toBe('large');
    expect(petSizeSchema.parse('xlarge')).toBe('xlarge');
  });

  it('rejects invalid sizes', () => {
    expect(() => petSizeSchema.parse('tiny')).toThrow();
    expect(() => petSizeSchema.parse('huge')).toThrow();
  });
});

describe('userRoleSchema', () => {
  it('accepts valid roles', () => {
    expect(userRoleSchema.parse('customer')).toBe('customer');
    expect(userRoleSchema.parse('groomer')).toBe('groomer');
    expect(userRoleSchema.parse('admin')).toBe('admin');
  });

  it('rejects invalid roles', () => {
    expect(() => userRoleSchema.parse('superuser')).toThrow();
    expect(() => userRoleSchema.parse('owner')).toThrow();
  });
});

describe('appointmentStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(appointmentStatusSchema.parse('pending')).toBe('pending');
    expect(appointmentStatusSchema.parse('confirmed')).toBe('confirmed');
    expect(appointmentStatusSchema.parse('completed')).toBe('completed');
    expect(appointmentStatusSchema.parse('cancelled')).toBe('cancelled');
    expect(appointmentStatusSchema.parse('no_show')).toBe('no_show');
  });

  it('rejects invalid statuses', () => {
    expect(() => appointmentStatusSchema.parse('scheduled')).toThrow();
    expect(() => appointmentStatusSchema.parse('active')).toThrow();
  });
});

describe('paymentStatusSchema', () => {
  it('accepts valid payment statuses', () => {
    expect(paymentStatusSchema.parse('pending')).toBe('pending');
    expect(paymentStatusSchema.parse('processing')).toBe('processing');
    expect(paymentStatusSchema.parse('completed')).toBe('completed');
    expect(paymentStatusSchema.parse('failed')).toBe('failed');
    expect(paymentStatusSchema.parse('refunded')).toBe('refunded');
  });

  it('rejects invalid statuses', () => {
    expect(() => paymentStatusSchema.parse('approved')).toThrow();
  });
});

describe('imageFileSchema', () => {
  it('accepts valid image files', () => {
    const jpegFile = { name: 'photo.jpg', size: 1024 * 1024, type: 'image/jpeg' };
    const pngFile = { name: 'photo.png', size: 2048 * 1024, type: 'image/png' };
    const webpFile = { name: 'photo.webp', size: 512 * 1024, type: 'image/webp' };

    expect(imageFileSchema.parse(jpegFile)).toEqual(jpegFile);
    expect(imageFileSchema.parse(pngFile)).toEqual(pngFile);
    expect(imageFileSchema.parse(webpFile)).toEqual(webpFile);
  });

  it('rejects files larger than 5MB', () => {
    const largeFile = { name: 'large.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg' };
    expect(() => imageFileSchema.parse(largeFile)).toThrow('File size must be less than 5MB');
  });

  it('rejects invalid file types', () => {
    const pdfFile = { name: 'doc.pdf', size: 1024, type: 'application/pdf' };
    expect(() => imageFileSchema.parse(pdfFile)).toThrow();
  });
});

describe('moneySchema', () => {
  it('accepts valid money amounts in cents', () => {
    expect(moneySchema.parse(0)).toBe(0);
    expect(moneySchema.parse(1000)).toBe(1000); // $10.00
    expect(moneySchema.parse(5999)).toBe(5999); // $59.99
  });

  it('rejects negative amounts', () => {
    expect(() => moneySchema.parse(-100)).toThrow('Amount cannot be negative');
  });

  it('rejects decimals', () => {
    expect(() => moneySchema.parse(10.5)).toThrow('Amount must be a whole number');
  });
});

describe('notificationTypeSchema', () => {
  it('accepts valid notification types', () => {
    expect(notificationTypeSchema.parse('booking_confirmation')).toBe('booking_confirmation');
    expect(notificationTypeSchema.parse('appointment_reminder')).toBe('appointment_reminder');
    expect(notificationTypeSchema.parse('report_card_ready')).toBe('report_card_ready');
  });

  it('rejects invalid types', () => {
    expect(() => notificationTypeSchema.parse('custom_notification')).toThrow();
  });
});

describe('notificationChannelSchema', () => {
  it('accepts valid channels', () => {
    expect(notificationChannelSchema.parse('email')).toBe('email');
    expect(notificationChannelSchema.parse('sms')).toBe('sms');
  });

  it('rejects invalid channels', () => {
    expect(() => notificationChannelSchema.parse('push')).toThrow();
  });
});
