/**
 * Integration tests for Manual Job Trigger Endpoints
 * Task 0115 Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as remindersTrigger } from '@/app/api/admin/notifications/jobs/reminders/trigger/route';
import { POST as retentionTrigger } from '@/app/api/admin/notifications/jobs/retention/trigger/route';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  getNotificationService: vi.fn(),
}));

const { createServerSupabaseClient } = await import('@/lib/supabase/server');
const { requireAdmin } = await import('@/lib/admin/auth');
const { getNotificationService } = await import('@/lib/notifications');

describe('Manual Job Trigger Endpoints', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNotificationService: any;

  beforeEach(() => {
    vi.clearAllMocks();

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
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    };

    mockNotificationService = {
      send: vi.fn(() => Promise.resolve({ success: true, messageId: 'test-msg-id' })),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'admin-1', role: 'admin' } as any,
      role: 'admin',
    });
    vi.mocked(getNotificationService).mockReturnValue(mockNotificationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('Reminders Trigger', () => {
    describe('Environment Restrictions', () => {
      it('should reject requests in production mode', async () => {
        vi.stubEnv('NODE_ENV', 'production');

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/reminders/trigger', {
          method: 'POST',
        });

        const response = await remindersTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toContain('development mode');
      });

      it('should accept requests in development mode', async () => {
        vi.stubEnv('NODE_ENV', 'development');

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/reminders/trigger', {
          method: 'POST',
        });

        const response = await remindersTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Authentication', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
      });

      it('should reject unauthenticated requests', async () => {
        vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/reminders/trigger', {
          method: 'POST',
        });

        const response = await remindersTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain('Unauthorized');
      });

      it('should accept authenticated admin requests', async () => {
        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/reminders/trigger', {
          method: 'POST',
        });

        const response = await remindersTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(requireAdmin).toHaveBeenCalledTimes(1);
      });
    });

    describe('Job Execution', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
      });

      it('should trigger reminder job successfully', async () => {
        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/reminders/trigger', {
          method: 'POST',
        });

        const response = await remindersTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.processed).toBeDefined();
        expect(data.sent).toBeDefined();
        expect(data.failed).toBeDefined();
        expect(data.skipped).toBeDefined();
        expect(data.timestamp).toBeDefined();
      });

      it('should process and send reminders for eligible appointments', async () => {
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
              phone: '+15555555555',
            },
            pet: { name: 'Max' },
            service: { name: 'Basic Grooming' },
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

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/reminders/trigger', {
          method: 'POST',
        });

        const response = await remindersTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.processed).toBe(1);
        expect(data.sent).toBe(1);
        expect(mockNotificationService.send).toHaveBeenCalledTimes(1);
      });

      it('should handle errors gracefully', async () => {
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

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/reminders/trigger', {
          method: 'POST',
        });

        const response = await remindersTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Database error');
      });
    });
  });

  describe('Retention Trigger', () => {
    describe('Environment Restrictions', () => {
      it('should reject requests in production mode', async () => {
        vi.stubEnv('NODE_ENV', 'production');

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/retention/trigger', {
          method: 'POST',
        });

        const response = await retentionTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toContain('development mode');
      });

      it('should accept requests in development mode', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/retention/trigger', {
          method: 'POST',
        });

        const response = await retentionTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Authentication', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
      });

      it('should reject unauthenticated requests', async () => {
        vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/retention/trigger', {
          method: 'POST',
        });

        const response = await retentionTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain('Unauthorized');
      });

      it('should accept authenticated admin requests', async () => {
        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/retention/trigger', {
          method: 'POST',
        });

        const response = await retentionTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(requireAdmin).toHaveBeenCalledTimes(1);
      });
    });

    describe('Job Execution', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
      });

      it('should trigger retention job successfully', async () => {
        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/retention/trigger', {
          method: 'POST',
        });

        const response = await retentionTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.processed).toBeDefined();
        expect(data.sent).toBeDefined();
        expect(data.failed).toBeDefined();
        expect(data.skipped).toBeDefined();
        expect(data.timestamp).toBeDefined();
      });

      it('should process and send reminders for overdue pets', async () => {
        const now = new Date();
        const oldApptDate = new Date(now.getTime() - 10 * 7 * 24 * 60 * 60 * 1000); // 10 weeks ago

        const mockPets = [
          {
            id: 'pet-1',
            name: 'Max',
            owner_id: 'owner-1',
            breed_id: 'breed-1',
            owner: {
              id: 'owner-1',
              first_name: 'John',
              email: 'john@example.com',
              phone: '+15555555555',
              preferences: {},
            },
            breed: {
              id: 'breed-1',
              name: 'Poodle',
              grooming_frequency_weeks: 6,
            },
          },
        ];

        const mockLastAppt = {
          id: 'appt-1',
          scheduled_at: oldApptDate.toISOString(),
          service: { name: 'Basic Grooming' },
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'pets') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({ data: mockPets, error: null })),
                })),
              })),
            };
          }
          if (table === 'appointments') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn(() => ({
                        maybeSingle: vi.fn(() => Promise.resolve({ data: mockLastAppt, error: null })),
                      })),
                    })),
                  })),
                })),
              })),
            };
          }
          // For notifications_log
          return {
            select: vi.fn(() => ({
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
          };
        });

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/retention/trigger', {
          method: 'POST',
        });

        const response = await retentionTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.processed).toBe(1);
        expect(data.sent).toBe(1);
        expect(mockNotificationService.send).toHaveBeenCalledTimes(2); // Email + SMS
      });

      it('should handle errors gracefully', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
            })),
          })),
        });

        const request = new NextRequest('http://localhost/api/admin/notifications/jobs/retention/trigger', {
          method: 'POST',
        });

        const response = await retentionTrigger(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Database error');
      });
    });
  });
});
