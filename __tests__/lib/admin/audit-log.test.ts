/**
 * Tests for Settings Audit Log Utility
 * Task 0167: Audit logging for settings changes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logSettingsChange,
  getAuditLog,
  getAuditLogByKey,
  getRecentAuditLog,
  getAuditLogStats,
} from '@/lib/admin/audit-log';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
} as any;

describe('Settings Audit Log Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logSettingsChange', () => {
    it('should log a settings change with valid data', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      await logSettingsChange(
        mockSupabase,
        'admin-123',
        'site_content',
        'hero',
        { headline: 'Old Headline' },
        { headline: 'New Headline' }
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('settings_audit_log');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          admin_id: 'admin-123',
          setting_type: 'site_content',
          setting_key: 'hero',
          old_value: { headline: 'Old Headline' },
          new_value: { headline: 'New Headline' },
        })
      );
    });

    it('should not log when values are unchanged', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      await logSettingsChange(
        mockSupabase,
        'admin-123',
        'site_content',
        'hero',
        { headline: 'Same Headline' },
        { headline: 'Same Headline' }
      );

      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should handle null old value for new settings', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      await logSettingsChange(
        mockSupabase,
        'admin-123',
        'booking',
        'min_advance_hours',
        null,
        { value: 2 }
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          old_value: null,
          new_value: { value: 2 },
        })
      );
    });

    it('should handle errors gracefully (fire-and-forget)', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        error: new Error('Database error'),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Should not throw
      await expect(
        logSettingsChange(
          mockSupabase,
          'admin-123',
          'site_content',
          'hero',
          { headline: 'Old' },
          { headline: 'New' }
        )
      ).resolves.not.toThrow();
    });

    it('should serialize primitive values correctly', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      await logSettingsChange(
        mockSupabase,
        'admin-123',
        'booking',
        'min_advance_hours',
        24,
        48
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          old_value: { value: 24 },
          new_value: { value: 48 },
        })
      );
    });
  });

  describe('getAuditLog', () => {
    it('should fetch audit log with filters', async () => {
      const mockData = [
        {
          id: '1',
          admin_id: 'admin-123',
          setting_type: 'site_content',
          setting_key: 'hero',
          old_value: { headline: 'Old' },
          new_value: { headline: 'New' },
          created_at: '2024-01-01T00:00:00Z',
          admin: {
            id: 'admin-123',
            email: 'admin@test.com',
            first_name: 'Admin',
            last_name: 'User',
          },
        },
      ];

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await getAuditLog(mockSupabase, { limit: 50 });

      expect(mockSupabase.from).toHaveBeenCalledWith('settings_audit_log');
      expect(result).toHaveLength(1);
      expect(result[0].admin).toEqual({
        id: 'admin-123',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
      });
    });
  });

  describe('getAuditLogByKey', () => {
    it('should fetch audit log for specific setting key', async () => {
      const mockData = [
        {
          id: '1',
          admin_id: 'admin-123',
          setting_type: 'site_content',
          setting_key: 'hero',
          old_value: { headline: 'Old' },
          new_value: { headline: 'New' },
          created_at: '2024-01-01T00:00:00Z',
          admin: {
            id: 'admin-123',
            email: 'admin@test.com',
            first_name: 'Admin',
            last_name: 'User',
          },
        },
      ];

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await getAuditLogByKey(mockSupabase, 'hero', 50);

      expect(mockEq).toHaveBeenCalledWith('setting_key', 'hero');
      expect(result).toHaveLength(1);
    });
  });

  describe('getRecentAuditLog', () => {
    it('should fetch recent audit log entries', async () => {
      const mockData: any[] = [];
      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      await getRecentAuditLog(mockSupabase, 20);

      expect(mockLimit).toHaveBeenCalledWith(20);
    });
  });

  describe('getAuditLogStats', () => {
    it('should calculate audit log statistics', async () => {
      const mockData = [
        {
          admin_id: 'admin-123',
          setting_type: 'site_content',
        },
        {
          admin_id: 'admin-123',
          setting_type: 'booking',
        },
        {
          admin_id: 'admin-456',
          setting_type: 'site_content',
        },
      ];

      const mockLte = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
      const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      const stats = await getAuditLogStats(mockSupabase, dateFrom, dateTo);

      expect(stats.total_changes).toBe(3);
      expect(stats.by_setting_type).toEqual({
        site_content: 2,
        booking: 1,
      });
      expect(stats.by_admin).toEqual({
        'admin-123': 2,
        'admin-456': 1,
      });
    });
  });
});
