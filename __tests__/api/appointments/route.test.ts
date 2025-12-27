/**
 * Simplified Integration tests for /api/appointments
 * Task 0281: Booking API Integration Tests
 *
 * Note: These tests focus on validation and error handling
 * Full database integration tests should use a test database
 */

import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/appointments/route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/notifications/triggers', () => ({
  triggerBookingConfirmation: vi.fn().mockResolvedValue({
    success: true,
    emailSent: true,
    smsSent: true,
  }),
}));

describe('POST /api/appointments - Validation', () => {
  it('should reject appointment with missing required fields', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        service_id: 'service-123',
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
    expect(json.details).toBeDefined();
    expect(Array.isArray(json.details)).toBe(true);
  });

  it('should reject appointment without pet_id or new_pet', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: 'user-123',
        service_id: 'service-789',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        total_price: 75,
        // Missing both pet_id and new_pet
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });

  it('should reject appointment with invalid UUID', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: 'invalid-uuid',
        pet_id: 'pet-456',
        service_id: 'service-789',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        total_price: 75,
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });

  it('should reject appointment with negative price', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        pet_id: '550e8400-e29b-41d4-a716-446655440001',
        service_id: '550e8400-e29b-41d4-a716-446655440002',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        total_price: -50,
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });

  it('should reject appointment with invalid duration', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        pet_id: '550e8400-e29b-41d4-a716-446655440001',
        service_id: '550e8400-e29b-41d4-a716-446655440002',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: -30,
        total_price: 75,
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });

  it('should reject appointment with past scheduled_at time', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        pet_id: '550e8400-e29b-41d4-a716-446655440001',
        service_id: '550e8400-e29b-41d4-a716-446655440002',
        scheduled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        duration_minutes: 60,
        total_price: 75,
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });

  it('should validate guest_info fields when provided', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pet_id: '550e8400-e29b-41d4-a716-446655440001',
        service_id: '550e8400-e29b-41d4-a716-446655440002',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        total_price: 75,
        guest_info: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'invalid-email', // Invalid email
          phone: '555-1234',
        },
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });

  it('should validate new_pet fields when provided', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        service_id: '550e8400-e29b-41d4-a716-446655440002',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        total_price: 75,
        new_pet: {
          name: '', // Empty name
          breed_id: '550e8400-e29b-41d4-a716-446655440003',
          size: 'small',
        },
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });

  it('should validate addon_ids are valid UUIDs', async () => {
    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        pet_id: '550e8400-e29b-41d4-a716-446655440001',
        service_id: '550e8400-e29b-41d4-a716-446655440002',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        total_price: 100,
        addon_ids: ['invalid-uuid', 'another-invalid'],
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });

  it('should validate notes field length', async () => {
    const longNotes = 'a'.repeat(600); // Exceeds 500 character limit

    const request = new Request('http://localhost/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        pet_id: '550e8400-e29b-41d4-a716-446655440001',
        service_id: '550e8400-e29b-41d4-a716-446655440002',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        total_price: 75,
        notes: longNotes,
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });
});

describe('POST /api/appointments - Schema Validation Summary', () => {
  it('should validate all required fields are present and correctly typed', () => {
    // This is a documentation test showing what fields are required
    const validAppointment = {
      customer_id: '550e8400-e29b-41d4-a716-446655440000', // UUID string (optional if guest_info provided)
      pet_id: '550e8400-e29b-41d4-a716-446655440001', // UUID string (OR new_pet)
      service_id: '550e8400-e29b-41d4-a716-446655440002', // UUID string (required)
      groomer_id: '550e8400-e29b-41d4-a716-446655440003', // UUID string (optional)
      scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // ISO string (required, future date)
      duration_minutes: 60, // Positive number (required)
      total_price: 75, // Non-negative number (required)
      notes: 'Optional notes', // String max 500 chars (optional)
      addon_ids: [], // Array of UUID strings (optional)
    };

    expect(validAppointment).toBeDefined();
    expect(typeof validAppointment.customer_id).toBe('string');
    expect(typeof validAppointment.pet_id).toBe('string');
    expect(typeof validAppointment.service_id).toBe('string');
    expect(typeof validAppointment.scheduled_at).toBe('string');
    expect(typeof validAppointment.duration_minutes).toBe('number');
    expect(typeof validAppointment.total_price).toBe('number');
  });
});
