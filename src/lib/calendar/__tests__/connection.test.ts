/**
 * Unit tests for calendar connection service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import {
  getActiveConnection,
  getConnectionById,
  createConnection,
  updateConnectionMetadata,
  updateLastSync,
  deleteConnection,
  deactivateConnection,
  updateWebhookInfo,
  clearWebhookInfo,
  getAllConnections,
  hasActiveConnection,
} from '../connection';
import type { GoogleOAuthTokens, CalendarConnection } from '@/types/calendar';

// Mock dependencies
vi.mock('../token-manager', () => ({
  prepareTokensForStorage: vi.fn((tokens) => ({
    access_token: `encrypted_${tokens.access_token}`,
    refresh_token: `encrypted_${tokens.refresh_token}`,
    token_expiry: new Date(tokens.expiry_date).toISOString(),
  })),
}));

vi.mock('../oauth', () => ({
  revokeTokens: vi.fn().mockResolvedValue(true),
}));

vi.mock('../encryption', () => ({
  decryptToken: vi.fn((token) => token.replace('encrypted_', '')),
}));

import { revokeTokens } from '../oauth';

describe('Calendar Connection Service', () => {
  const mockAdminId = 'admin-123-uuid';
  const mockConnectionId = 'connection-456-uuid';

  const mockTokens: GoogleOAuthTokens = {
    access_token: 'ya29.test-access',
    refresh_token: '1//test-refresh',
    expiry_date: Date.now() + 3600000,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/calendar.events',
  };

  const mockConnection: CalendarConnection = {
    id: mockConnectionId,
    admin_id: mockAdminId,
    access_token: 'encrypted_ya29.test-access',
    refresh_token: 'encrypted_1//test-refresh',
    token_expiry: new Date(mockTokens.expiry_date).toISOString(),
    calendar_id: 'primary',
    calendar_email: 'admin@example.com',
    webhook_channel_id: null,
    webhook_resource_id: null,
    webhook_expiration: null,
    is_active: true,
    last_sync_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create base mock structure
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    };
  });

  describe('getActiveConnection', () => {
    it('should return active connection for admin', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      const result = await getActiveConnection(mockSupabase, mockAdminId);

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_connections');
      expect(result).toEqual(mockConnection);
    });

    it('should return null if no active connection exists', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await getActiveConnection(mockSupabase, mockAdminId);

      expect(result).toBeNull();
    });

    it('should throw error for database failures', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      await expect(
        getActiveConnection(mockSupabase, mockAdminId)
      ).rejects.toThrow('Failed to fetch calendar connection');
    });
  });

  describe('getConnectionById', () => {
    it('should return connection by ID', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      const result = await getConnectionById(mockSupabase, mockConnectionId);

      expect(result).toEqual(mockConnection);
    });

    it('should return null if connection not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await getConnectionById(mockSupabase, mockConnectionId);

      expect(result).toBeNull();
    });
  });

  describe('createConnection', () => {
    it('should create new calendar connection', async () => {
      // Mock getActiveConnection to return null (no existing connection)
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: mockConnection, error: null });

      const result = await createConnection(
        mockSupabase,
        mockAdminId,
        mockTokens,
        'admin@example.com',
        'primary'
      );

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          admin_id: mockAdminId,
          calendar_email: 'admin@example.com',
          calendar_id: 'primary',
          is_active: true,
        })
      );
      expect(result).toEqual(mockConnection);
    });

    it('should throw error if connection already exists', async () => {
      // Mock getActiveConnection to return existing connection
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      await expect(
        createConnection(
          mockSupabase,
          mockAdminId,
          mockTokens,
          'admin@example.com'
        )
      ).rejects.toThrow('Calendar connection already exists');
    });

    it('should use default calendar ID if not provided', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: mockConnection, error: null });

      await createConnection(
        mockSupabase,
        mockAdminId,
        mockTokens,
        'admin@example.com'
      );

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          calendar_id: 'primary',
        })
      );
    });
  });

  describe('updateConnectionMetadata', () => {
    it('should update connection metadata', async () => {
      const updates = {
        calendar_id: 'work-calendar',
        calendar_email: 'work@example.com',
      };

      mockSupabase.single.mockResolvedValue({
        data: { ...mockConnection, ...updates },
        error: null,
      });

      const result = await updateConnectionMetadata(
        mockSupabase,
        mockConnectionId,
        updates
      );

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining(updates)
      );
      expect(result.calendar_id).toBe('work-calendar');
    });

    it('should include updated_at timestamp', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      await updateConnectionMetadata(mockSupabase, mockConnectionId, {
        calendar_id: 'new-cal',
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('updateLastSync', () => {
    it('should update last sync timestamp', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      await updateLastSync(mockSupabase, mockConnectionId);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          last_sync_at: expect.any(String),
        })
      );
    });

    it('should not throw error on failure (non-critical update)', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        updateLastSync(mockSupabase, mockConnectionId)
      ).resolves.not.toThrow();
    });
  });

  describe('deleteConnection', () => {
    it('should delete connection and revoke tokens', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      mockSupabase.delete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await deleteConnection(mockSupabase, mockConnectionId);

      expect(revokeTokens).toHaveBeenCalled();
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('should skip token revocation if requested', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      mockSupabase.delete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await deleteConnection(mockSupabase, mockConnectionId, false);

      expect(revokeTokens).not.toHaveBeenCalled();
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('should throw error if connection not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        deleteConnection(mockSupabase, mockConnectionId)
      ).rejects.toThrow('Calendar connection not found');
    });

    it('should continue deletion even if token revocation fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      (revokeTokens as Mock).mockRejectedValue(new Error('Revoke failed'));

      mockSupabase.delete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await expect(
        deleteConnection(mockSupabase, mockConnectionId)
      ).resolves.not.toThrow();

      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });

  describe('deactivateConnection', () => {
    it('should mark connection as inactive', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      mockSupabase.update = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await deactivateConnection(mockSupabase, mockConnectionId);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
        })
      );
    });
  });

  describe('updateWebhookInfo', () => {
    it('should update webhook channel information', async () => {
      const webhookInfo = {
        channelId: 'channel-123',
        resourceId: 'resource-456',
        expiration: '2025-01-02T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      await updateWebhookInfo(
        mockSupabase,
        mockConnectionId,
        webhookInfo.channelId,
        webhookInfo.resourceId,
        webhookInfo.expiration
      );

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook_channel_id: webhookInfo.channelId,
          webhook_resource_id: webhookInfo.resourceId,
          webhook_expiration: webhookInfo.expiration,
        })
      );
    });
  });

  describe('clearWebhookInfo', () => {
    it('should clear webhook information', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      await clearWebhookInfo(mockSupabase, mockConnectionId);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook_channel_id: null,
          webhook_resource_id: null,
          webhook_expiration: null,
        })
      );
    });

    it('should not throw error on failure (cleanup operation)', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        clearWebhookInfo(mockSupabase, mockConnectionId)
      ).resolves.not.toThrow();
    });
  });

  describe('getAllConnections', () => {
    it('should return all active connections by default', async () => {
      const connections = [mockConnection, { ...mockConnection, id: 'conn-2' }];

      mockSupabase.order = vi.fn().mockResolvedValue({
        data: connections,
        error: null,
      });

      const result = await getAllConnections(mockSupabase);

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(connections);
    });

    it('should return all connections if activeOnly is false', async () => {
      const connections = [
        mockConnection,
        { ...mockConnection, id: 'conn-2', is_active: false },
      ];

      mockSupabase.order = vi.fn().mockResolvedValue({
        data: connections,
        error: null,
      });

      const result = await getAllConnections(mockSupabase, false);

      expect(result).toEqual(connections);
    });

    it('should order by created_at descending', async () => {
      mockSupabase.order = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      await getAllConnections(mockSupabase);

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });
  });

  describe('hasActiveConnection', () => {
    it('should return true if active connection exists', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockConnection,
        error: null,
      });

      const result = await hasActiveConnection(mockSupabase, mockAdminId);

      expect(result).toBe(true);
    });

    it('should return false if no active connection exists', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await hasActiveConnection(mockSupabase, mockAdminId);

      expect(result).toBe(false);
    });
  });
});
