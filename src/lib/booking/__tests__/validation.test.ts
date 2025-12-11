/**
 * Unit tests for booking validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  guestInfoSchema,
  petFormSchema,
  bookingNotesSchema,
  appointmentCreationSchema,
  formatPhoneNumber,
  normalizePhoneNumber,
  isValidEmail,
  isValidPhone,
  type GuestInfoFormData,
  type PetFormData,
  type BookingNotesData,
  type AppointmentCreationData,
} from '../validation';

describe('validation utilities', () => {
  describe('guestInfoSchema', () => {
    const validGuestInfo: GuestInfoFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
    };

    it('should validate correct guest information', () => {
      const result = guestInfoSchema.safeParse(validGuestInfo);
      expect(result.success).toBe(true);
    });

    describe('firstName validation', () => {
      it('should reject empty first name', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          firstName: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('First name is required');
        }
      });

      it('should reject first name longer than 50 characters', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          firstName: 'A'.repeat(51),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('First name is too long');
        }
      });

      it('should accept first name at maximum length (50 chars)', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          firstName: 'A'.repeat(50),
        });
        expect(result.success).toBe(true);
      });

      it('should accept single character first name', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          firstName: 'J',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('lastName validation', () => {
      it('should reject empty last name', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          lastName: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Last name is required');
        }
      });

      it('should reject last name longer than 50 characters', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          lastName: 'B'.repeat(51),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Last name is too long');
        }
      });

      it('should accept last name at maximum length (50 chars)', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          lastName: 'B'.repeat(50),
        });
        expect(result.success).toBe(true);
      });
    });

    describe('email validation', () => {
      it('should reject empty email', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          email: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Email is required');
        }
      });

      it('should reject invalid email format', () => {
        const invalidEmails = [
          'notanemail',
          'missing@domain',
          '@nodomain.com',
          'no@domain',
          'spaces in@email.com',
        ];

        invalidEmails.forEach((email) => {
          const result = guestInfoSchema.safeParse({
            ...validGuestInfo,
            email,
          });
          expect(result.success).toBe(false);
        });
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'john@example.com',
          'john.doe@example.com',
          'john+tag@example.co.uk',
          'john_doe123@test-domain.com',
        ];

        validEmails.forEach((email) => {
          const result = guestInfoSchema.safeParse({
            ...validGuestInfo,
            email,
          });
          expect(result.success).toBe(true);
        });
      });
    });

    describe('phone validation', () => {
      it('should reject phone shorter than 10 characters', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          phone: '123456789',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Please enter a valid phone number'
          );
        }
      });

      it('should reject phone longer than 20 characters', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          phone: '1'.repeat(21),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Phone number is too long');
        }
      });

      it('should accept various valid phone formats', () => {
        const validPhones = [
          '5551234567',
          '(555) 123-4567',
          '555-123-4567',
          '+1 555 123 4567',
          '1 (555) 123-4567',
        ];

        validPhones.forEach((phone) => {
          const result = guestInfoSchema.safeParse({
            ...validGuestInfo,
            phone,
          });
          expect(result.success).toBe(true);
        });
      });

      it('should reject phone with invalid characters', () => {
        const invalidPhones = ['555-123-ABCD', 'phone number', '555.123.4567abc'];

        invalidPhones.forEach((phone) => {
          const result = guestInfoSchema.safeParse({
            ...validGuestInfo,
            phone,
          });
          expect(result.success).toBe(false);
        });
      });

      it('should accept phone at minimum length (10 chars)', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          phone: '5551234567',
        });
        expect(result.success).toBe(true);
      });

      it('should accept phone at maximum length (20 chars)', () => {
        const result = guestInfoSchema.safeParse({
          ...validGuestInfo,
          phone: '+1 (555) 123-456789',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('petFormSchema', () => {
    const validPetInfo: PetFormData = {
      name: 'Buddy',
      size: 'medium',
      breed_id: 'breed-123',
      weight: 25,
      notes: 'Good dog',
    };

    it('should validate correct pet information', () => {
      const result = petFormSchema.safeParse(validPetInfo);
      expect(result.success).toBe(true);
    });

    describe('name validation', () => {
      it('should reject empty pet name', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          name: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Pet name is required');
        }
      });

      it('should reject pet name longer than 50 characters', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          name: 'A'.repeat(51),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Pet name is too long');
        }
      });

      it('should accept pet name at maximum length', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          name: 'A'.repeat(50),
        });
        expect(result.success).toBe(true);
      });
    });

    describe('size validation', () => {
      it('should accept all valid sizes', () => {
        const validSizes = ['small', 'medium', 'large', 'xlarge'] as const;

        validSizes.forEach((size) => {
          const result = petFormSchema.safeParse({
            ...validPetInfo,
            size,
          });
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid size', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          size: 'invalid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please select a size');
        }
      });
    });

    describe('breed_id validation', () => {
      it('should accept optional breed_id', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          breed_id: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid breed_id', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          breed_id: 'breed-uuid-123',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('breed_custom validation', () => {
      it('should accept optional breed_custom', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          breed_custom: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid breed_custom', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          breed_custom: 'Golden Retriever Mix',
        });
        expect(result.success).toBe(true);
      });

      it('should reject breed_custom longer than 100 characters', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          breed_custom: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Breed name is too long');
        }
      });
    });

    describe('weight validation', () => {
      it('should accept optional weight', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          weight: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should accept null weight', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          weight: null,
        });
        expect(result.success).toBe(true);
      });

      it('should accept positive weight', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          weight: 25.5,
        });
        expect(result.success).toBe(true);
      });

      it('should reject negative weight', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          weight: -5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Weight must be positive');
        }
      });

      it('should reject zero weight', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          weight: 0,
        });
        expect(result.success).toBe(false);
      });

      it('should reject weight over 300 lbs', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          weight: 301,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Weight seems too high');
        }
      });

      it('should accept weight at maximum (300 lbs)', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          weight: 300,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('notes validation', () => {
      it('should accept optional notes', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          notes: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid notes', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          notes: 'This is a good dog with special needs',
        });
        expect(result.success).toBe(true);
      });

      it('should reject notes longer than 500 characters', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          notes: 'A'.repeat(501),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Notes are too long');
        }
      });

      it('should accept notes at maximum length', () => {
        const result = petFormSchema.safeParse({
          ...validPetInfo,
          notes: 'A'.repeat(500),
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('bookingNotesSchema', () => {
    it('should validate correct booking notes', () => {
      const result = bookingNotesSchema.safeParse({
        notes: 'Please be gentle, nervous dog',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional notes', () => {
      const result = bookingNotesSchema.safeParse({
        notes: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = bookingNotesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject notes longer than 500 characters', () => {
      const result = bookingNotesSchema.safeParse({
        notes: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Notes are too long');
      }
    });
  });

  describe('appointmentCreationSchema', () => {
    const validAppointment: AppointmentCreationData = {
      customer_id: '123e4567-e89b-12d3-a456-426614174000',
      pet_id: '223e4567-e89b-12d3-a456-426614174000',
      service_id: '323e4567-e89b-12d3-a456-426614174000',
      scheduled_at: '2024-01-15T10:00:00',
      duration_minutes: 60,
      total_price: 50,
    };

    it('should validate correct appointment data', () => {
      const result = appointmentCreationSchema.safeParse(validAppointment);
      expect(result.success).toBe(true);
    });

    describe('UUID validation', () => {
      it('should reject invalid customer_id UUID', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          customer_id: 'not-a-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid customer ID');
        }
      });

      it('should reject invalid pet_id UUID', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          pet_id: 'not-a-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid pet ID');
        }
      });

      it('should reject invalid service_id UUID', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          service_id: 'not-a-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid service ID');
        }
      });

      it('should reject invalid groomer_id UUID', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          groomer_id: 'not-a-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid groomer ID');
        }
      });

      it('should accept optional null groomer_id', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          groomer_id: null,
        });
        expect(result.success).toBe(true);
      });

      it('should accept optional undefined groomer_id', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          groomer_id: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid groomer_id UUID', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          groomer_id: '423e4567-e89b-12d3-a456-426614174000',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('scheduled_at validation', () => {
      it('should reject empty scheduled_at', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          scheduled_at: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Scheduled time is required');
        }
      });

      it('should accept valid ISO date string', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          scheduled_at: '2024-12-25T14:30:00Z',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('duration_minutes validation', () => {
      it('should reject negative duration', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          duration_minutes: -30,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Duration must be positive');
        }
      });

      it('should reject zero duration', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          duration_minutes: 0,
        });
        expect(result.success).toBe(false);
      });

      it('should accept positive duration', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          duration_minutes: 90,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('total_price validation', () => {
      it('should accept zero price', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          total_price: 0,
        });
        expect(result.success).toBe(true);
      });

      it('should accept positive price', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          total_price: 99.99,
        });
        expect(result.success).toBe(true);
      });

      it('should reject negative price', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          total_price: -50,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Total price must be non-negative'
          );
        }
      });
    });

    describe('notes validation', () => {
      it('should accept optional notes', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          notes: 'Special instructions',
        });
        expect(result.success).toBe(true);
      });

      it('should accept null notes', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          notes: null,
        });
        expect(result.success).toBe(true);
      });

      it('should accept undefined notes', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          notes: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should reject notes longer than 500 characters', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          notes: 'A'.repeat(501),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Notes are too long');
        }
      });
    });

    describe('addon_ids validation', () => {
      it('should accept optional addon_ids array', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          addon_ids: [
            '523e4567-e89b-12d3-a456-426614174000',
            '623e4567-e89b-12d3-a456-426614174000',
          ],
        });
        expect(result.success).toBe(true);
      });

      it('should accept empty addon_ids array', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          addon_ids: [],
        });
        expect(result.success).toBe(true);
      });

      it('should accept undefined addon_ids', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          addon_ids: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID in addon_ids', () => {
        const result = appointmentCreationSchema.safeParse({
          ...validAppointment,
          addon_ids: ['not-a-uuid'],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid addon ID');
        }
      });
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit US phone number', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('should format already formatted phone number', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('should format phone with dashes', () => {
      expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
    });

    it('should format 11-digit phone with country code', () => {
      expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
    });

    it('should format phone with +1 prefix', () => {
      expect(formatPhoneNumber('+15551234567')).toBe('+1 (555) 123-4567');
    });

    it('should return as-is for non-standard formats', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
      expect(formatPhoneNumber('123456789')).toBe('123456789');
    });

    it('should handle phone with spaces and special characters', () => {
      expect(formatPhoneNumber('555 123 4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
    });

    it('should strip non-numeric characters before formatting', () => {
      expect(formatPhoneNumber('(555).123.4567')).toBe('(555) 123-4567');
    });
  });

  describe('normalizePhoneNumber', () => {
    it('should remove all non-numeric characters except +', () => {
      expect(normalizePhoneNumber('(555) 123-4567')).toBe('5551234567');
    });

    it('should preserve + prefix', () => {
      expect(normalizePhoneNumber('+1 (555) 123-4567')).toBe('+15551234567');
    });

    it('should remove spaces', () => {
      expect(normalizePhoneNumber('555 123 4567')).toBe('5551234567');
    });

    it('should remove dashes', () => {
      expect(normalizePhoneNumber('555-123-4567')).toBe('5551234567');
    });

    it('should remove parentheses', () => {
      expect(normalizePhoneNumber('(555)1234567')).toBe('5551234567');
    });

    it('should handle already normalized numbers', () => {
      expect(normalizePhoneNumber('5551234567')).toBe('5551234567');
    });

    it('should remove dots', () => {
      expect(normalizePhoneNumber('555.123.4567')).toBe('5551234567');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('john@example.com')).toBe(true);
    });

    it('should return true for email with subdomain', () => {
      expect(isValidEmail('john@mail.example.com')).toBe(true);
    });

    it('should return true for email with + sign', () => {
      expect(isValidEmail('john+tag@example.com')).toBe(true);
    });

    it('should return true for email with dots', () => {
      expect(isValidEmail('john.doe@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(isValidEmail('notanemail')).toBe(false);
    });

    it('should return false for email missing @', () => {
      expect(isValidEmail('johndoe.com')).toBe(false);
    });

    it('should return false for email missing domain', () => {
      expect(isValidEmail('john@')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should return false for email with spaces', () => {
      expect(isValidEmail('john doe@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid 10-digit phone', () => {
      expect(isValidPhone('5551234567')).toBe(true);
    });

    it('should return true for formatted phone', () => {
      expect(isValidPhone('(555) 123-4567')).toBe(true);
    });

    it('should return true for phone with dashes', () => {
      expect(isValidPhone('555-123-4567')).toBe(true);
    });

    it('should return true for phone with country code', () => {
      expect(isValidPhone('+1 555 123 4567')).toBe(true);
    });

    it('should return false for phone too short', () => {
      expect(isValidPhone('123456789')).toBe(false);
    });

    it('should return false for phone too long', () => {
      expect(isValidPhone('1'.repeat(21))).toBe(false);
    });

    it('should return false for phone with letters', () => {
      expect(isValidPhone('555-CALL-NOW')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidPhone('')).toBe(false);
    });

    it('should return true for phone at minimum length (10)', () => {
      expect(isValidPhone('1234567890')).toBe(true);
    });

    it('should return true for phone at maximum length (20)', () => {
      expect(isValidPhone('+1 (555) 123-456789')).toBe(true);
    });
  });
});
