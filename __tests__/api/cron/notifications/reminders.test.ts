/**
 * Unit tests for Appointment Reminder Cron Job
 * Task 0112 Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cron/notifications/reminders/route';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  getNotificationService: vi.fn(),
}));

const { createServerSupabaseClient } = await import('@/lib/supabase/server');
const { getNotificationService } = await import('@/lib/notifications');

describe('Appointment Reminders Cron Job', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNotificationService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    };

    // Mock notification service
    mockNotificationService = {
      send: vi.fn(() => Promise.resolve({ success: true, messageId: 'test-msg-id' })),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(getNotificationService).mockReturnValue(mockNotificationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/reminders');

      // Set production mode
      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      process.env.CRON_SECRET = 'test-secret';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid cron secret', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/reminders', {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      });

      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      process.env.CRON_SECRET = 'test-secret';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept requests with valid cron secret', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/reminders', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      process.env.CRON_SECRET = 'test-secret';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should skip validation in mock mode', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/reminders');

      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Job Execution', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
    });

    it('should return success with zero processed when no appointments found', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/reminders');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(0);
      expect(data.sent).toBe(0);
      expect(data.failed).toBe(0);
      expect(data.skipped).toBe(0);
      expect(data.timestamp).toBeDefined();
    });

    it('should process appointments and send reminders', async () => {
      const now = new Date();
      const appointmentTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockAppointments = [
        {
          id: 'appt-1',
          customer_id: 'customer-1',
          scheduled_at: appointmentTime.toISOString(),
          status: 'confirmed',
          customer: {
            id: 'customer-1',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+15555555555',
          },
          pet: {
            id: 'pet-1',
            name: 'Max',
          },
          service: {
            id: 'service-1',
            name: 'Basic Grooming',
          },
        },
      ];

      // Mock appointment query
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockAppointments, error: null })),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/reminders');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(1);
      expect(data.sent).toBe(1);
      expect(data.failed).toBe(0);
      expect(mockNotificationService.send).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'appointment_reminder',
          channel: 'sms',
          recipient: '+15555555555',
          userId: 'customer-1',
        })
      );
    });

    it('should skip appointments without phone numbers', async () => {
      const now = new Date();
      const appointmentTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockAppointments = [
        {
          id: 'appt-1',
          customer_id: 'customer-1',
          scheduled_at: appointmentTime.toISOString(),
          status: 'confirmed',
          customer: {
            id: 'customer-1',
            first_name: 'John',
            last_name: 'Doe',
            phone: null, // No phone number
          },
          pet: {
            id: 'pet-1',
            name: 'Max',
          },
          service: {
            id: 'service-1',
            name: 'Basic Grooming',
          },
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockAppointments, error: null })),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/reminders');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(1);
      expect(data.sent).toBe(0);
      expect(data.skipped).toBe(1);
      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });

    it('should handle notification send failures gracefully', async () => {
      const now = new Date();
      const appointmentTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockAppointments = [
        {
          id: 'appt-1',
          customer_id: 'customer-1',
          scheduled_at: appointmentTime.toISOString(),
          status: 'confirmed',
          customer: {
            id: 'customer-1',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+15555555555',
          },
          pet: {
            id: 'pet-1',
            name: 'Max',
          },
          service: {
            id: 'service-1',
            name: 'Basic Grooming',
          },
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockAppointments, error: null })),
              })),
            })),
          })),
        })),
      });

      // Mock send failure
      mockNotificationService.send.mockResolvedValue({
        success: false,
        error: 'Provider error',
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/reminders');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(1);
      expect(data.sent).toBe(0);
      expect(data.failed).toBe(1);
    });

    it('should handle database query errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/reminders');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Database error');
    });
  });

  describe('POST Method', () => {
    it('should delegate to GET handler', async () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

      const request = new NextRequest('http://localhost/api/cron/notifications/reminders', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
