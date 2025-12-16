/**
 * Tests for Admin Notification Log Detail API
 * Task 0130: GET /api/admin/notifications/log/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/notifications/log/[id]/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');

describe('Admin Notification Log Detail API', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient as any);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  describe('Success Cases', () => {
    it('should return full log details with customer info', async () => {
      const logId = '123e4567-e89b-12d3-a456-426614174001';
      const customerId = '223e4567-e89b-12d3-a456-426614174001';
      const templateId = '323e4567-e89b-12d3-a456-426614174001';

      const mockLog = {
        id: logId,
        customer_id: customerId,
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        subject: 'Booking Confirmed',
        content: 'Your booking has been confirmed.',
        status: 'sent',
        error_message: null,
        sent_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T09:55:00Z',
        is_test: false,
        template_id: templateId,
        template_data: { customer_name: 'John Doe', pet_name: 'Max' },
        message_id: 'msg-123',
        retry_count: 0,
        retry_after: null,
        users: { first_name: 'John', last_name: 'Doe' },
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/notifications/log/${logId}`);
      const params = Promise.resolve({ id: logId });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.log).toMatchObject({
        id: logId,
        customer_id: customerId,
        customer_name: 'John Doe',
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        subject: 'Booking Confirmed',
        content: 'Your booking has been confirmed.',
        status: 'sent',
        error_message: null,
        sent_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T09:55:00Z',
        is_test: false,
        template_id: templateId,
        template_data: { customer_name: 'John Doe', pet_name: 'Max' },
        message_id: 'msg-123',
        retry_count: 0,
        retry_after: null,
      });
    });

    it('should handle log without customer (system notification)', async () => {
      const logId = '423e4567-e89b-12d3-a456-426614174002';
      const templateId = '523e4567-e89b-12d3-a456-426614174002';

      const mockLog = {
        id: logId,
        customer_id: null,
        type: 'system_alert',
        channel: 'email',
        recipient: 'admin@example.com',
        subject: 'System Alert',
        content: 'System alert message.',
        status: 'sent',
        error_message: null,
        sent_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T09:55:00Z',
        is_test: false,
        template_id: templateId,
        template_data: null,
        message_id: 'msg-456',
        retry_count: 0,
        retry_after: null,
        users: null,
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/notifications/log/${logId}`);
      const params = Promise.resolve({ id: logId });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.log.customer_id).toBeNull();
      expect(data.log.customer_name).toBeNull();
    });

    it('should include retry information for failed notifications', async () => {
      const logId = '623e4567-e89b-12d3-a456-426614174003';
      const customerId = '723e4567-e89b-12d3-a456-426614174003';
      const templateId = '823e4567-e89b-12d3-a456-426614174003';

      const mockLog = {
        id: logId,
        customer_id: customerId,
        type: 'appointment_reminder',
        channel: 'sms',
        recipient: '+15551234567',
        subject: null,
        content: 'Reminder: Your appointment is tomorrow.',
        status: 'failed',
        error_message: 'Rate limit exceeded',
        sent_at: null,
        created_at: '2024-01-15T09:55:00Z',
        is_test: false,
        template_id: templateId,
        template_data: { appointment_date: '2024-01-16' },
        message_id: null,
        retry_count: 2,
        retry_after: '2024-01-15T10:30:00Z',
        users: { first_name: 'Jane', last_name: 'Smith' },
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/notifications/log/${logId}`);
      const params = Promise.resolve({ id: logId });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.log.status).toBe('failed');
      expect(data.log.error_message).toBe('Rate limit exceeded');
      expect(data.log.retry_count).toBe(2);
      expect(data.log.retry_after).toBe('2024-01-15T10:30:00Z');
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/notifications/log/invalid-id');
      const params = Promise.resolve({ id: 'invalid-id' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid log ID format');
    });

    it('should reject non-UUID strings', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log/not-a-uuid'
      );
      const params = Promise.resolve({ id: 'not-a-uuid' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid log ID format');
    });
  });

  describe('Not Found', () => {
    it('should return 404 if log entry not found', async () => {
      const validUuid = '923e4567-e89b-12d3-a456-426614174004';

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${validUuid}`
      );
      const params = Promise.resolve({ id: validUuid });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Notification log entry not found');
    });
  });

  describe('Authorization', () => {
    it('should require admin authentication', async () => {
      const validUuid = 'a23e4567-e89b-12d3-a456-426614174005';

      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${validUuid}`
      );
      const params = Promise.resolve({ id: validUuid });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Database Errors', () => {
    it('should handle database errors gracefully', async () => {
      const validUuid = 'b23e4567-e89b-12d3-a456-426614174006';

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockRejectedValue(new Error('Database connection error')),
        }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${validUuid}`
      );
      const params = Promise.resolve({ id: validUuid });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });
  });
});
