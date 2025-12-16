/**
 * Unit tests for Retention Reminder Cron Job
 * Task 0113 Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cron/notifications/retention/route';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  getNotificationService: vi.fn(),
}));

const { createServerSupabaseClient } = await import('@/lib/supabase/server');
const { getNotificationService } = await import('@/lib/notifications');

describe('Retention Reminders Cron Job', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNotificationService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client with chainable methods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createMockChain = (finalData: any) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve(finalData)),
              })),
            })),
          })),
          gte: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve(finalData)),
            })),
          })),
        })),
      })),
    });

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'pets') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          };
        }
        return createMockChain({ data: null, error: null });
      }),
    };

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
      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      process.env.CRON_SECRET = 'test-secret';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept requests with valid cron secret', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/retention', {
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
      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

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
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    });

    it('should return success with zero processed when no pets found', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(0);
      expect(data.sent).toBe(0);
      expect(data.failed).toBe(0);
      expect(data.skipped).toBe(0);
    });

    it('should skip pets without owners', async () => {
      const mockPets = [
        {
          id: 'pet-1',
          name: 'Max',
          owner_id: 'owner-1',
          breed_id: 'breed-1',
          owner: null, // No owner
          breed: {
            id: 'breed-1',
            name: 'Poodle',
            grooming_frequency_weeks: 6,
          },
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockPets, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(1);
      expect(data.skipped).toBe(1);
      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });

    it('should skip pets whose owners opted out of marketing', async () => {
      const mockPets = [
        {
          id: 'pet-1',
          name: 'Max',
          owner_id: 'owner-1',
          breed_id: 'breed-1',
          owner: {
            id: 'owner-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+15555555555',
            preferences: { marketing_opt_out: true },
          },
          breed: {
            id: 'breed-1',
            name: 'Poodle',
            grooming_frequency_weeks: 6,
          },
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockPets, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(1);
      expect(data.skipped).toBe(1);
      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });

    it('should skip pets without previous appointments', async () => {
      const mockPets = [
        {
          id: 'pet-1',
          name: 'Max',
          owner_id: 'owner-1',
          breed_id: 'breed-1',
          owner: {
            id: 'owner-1',
            first_name: 'John',
            last_name: 'Doe',
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
        // For appointments table - return no appointments
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
                  })),
                })),
              })),
            })),
          })),
        };
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(1);
      expect(data.skipped).toBe(1);
    });

    it('should skip pets not yet overdue for grooming', async () => {
      const now = new Date();
      const recentApptDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000); // 4 weeks ago

      const mockPets = [
        {
          id: 'pet-1',
          name: 'Max',
          owner_id: 'owner-1',
          breed_id: 'breed-1',
          owner: {
            id: 'owner-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+15555555555',
            preferences: {},
          },
          breed: {
            id: 'breed-1',
            name: 'Poodle',
            grooming_frequency_weeks: 8, // Not overdue yet (4 weeks < 8 weeks)
          },
        },
      ];

      const mockLastAppt = {
        id: 'appt-1',
        scheduled_at: recentApptDate.toISOString(),
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
        // For appointments table
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
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(1);
      expect(data.skipped).toBe(1);
    });

    it('should send email and SMS for overdue pets', async () => {
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
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+15555555555',
            preferences: {},
          },
          breed: {
            id: 'breed-1',
            name: 'Poodle',
            grooming_frequency_weeks: 6, // Overdue (10 weeks > 6 weeks)
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
        // For notifications_log - no recent reminders
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

      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(1);
      expect(data.sent).toBe(1);
      expect(mockNotificationService.send).toHaveBeenCalledTimes(2); // Email + SMS
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'retention_reminder',
          channel: 'email',
          recipient: 'john@example.com',
          userId: 'owner-1',
        })
      );
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'retention_reminder',
          channel: 'sms',
          recipient: '+15555555555',
          userId: 'owner-1',
        })
      );
    });

    it('should handle database query errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/retention');

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

      const request = new NextRequest('http://localhost/api/cron/notifications/retention', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
