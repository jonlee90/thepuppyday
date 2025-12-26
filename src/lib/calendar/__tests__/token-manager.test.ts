/**
 * Unit tests for token manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import {
  isTokenExpired,
  storeTokens,
  retrieveTokens,
  getValidAccessToken,
  refreshTokens,
  prepareTokensForStorage,
  isTokenExpiryValid,
} from '../token-manager';
import type { GoogleOAuthTokens } from '@/types/calendar';

// Mock encryption functions
vi.mock('../encryption', () => ({
  encryptToken: vi.fn((token: string) => `encrypted_${token}`),
  decryptToken: vi.fn((encrypted: string) => encrypted.replace('encrypted_', '')),
}));

// Mock OAuth functions
vi.mock('../oauth', () => ({
  refreshAccessToken: vi.fn(),
}));

import { refreshAccessToken } from '../oauth';

describe('Token Manager', () => {
  const mockConnectionId = 'test-connection-id';
  const mockTokens: GoogleOAuthTokens = {
    access_token: 'ya29.test-access-token',
    refresh_token: '1//test-refresh-token',
    expiry_date: Date.now() + 3600000, // 1 hour from now
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/calendar.events',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
    };
  });

  describe('isTokenExpired', () => {
    it('should return false for token that expires in the future', () => {
      const futureExpiry = Date.now() + 3600000; // 1 hour from now
      expect(isTokenExpired(futureExpiry)).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastExpiry = Date.now() - 3600000; // 1 hour ago
      expect(isTokenExpired(pastExpiry)).toBe(true);
    });

    it('should return true for token expiring within buffer time (5 minutes)', () => {
      const nearExpiry = Date.now() + 4 * 60 * 1000; // 4 minutes from now
      expect(isTokenExpired(nearExpiry)).toBe(true);
    });

    it('should return false for token expiring beyond buffer time', () => {
      const safeExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      expect(isTokenExpired(safeExpiry)).toBe(false);
    });
  });

  describe('storeTokens', () => {
    it('should encrypt and store tokens successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      await storeTokens(mockSupabase, mockConnectionId, mockTokens);

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_connections');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          access_token: 'encrypted_ya29.test-access-token',
          refresh_token: 'encrypted_1//test-refresh-token',
          token_expiry: expect.any(String),
        })
      );
    });

    it('should throw error if database update fails', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        storeTokens(mockSupabase, mockConnectionId, mockTokens)
      ).rejects.toThrow('Failed to store tokens');
    });
  });

  describe('retrieveTokens', () => {
    it('should retrieve and decrypt tokens successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              access_token: 'encrypted_ya29.test-access-token',
              refresh_token: 'encrypted_1//test-refresh-token',
              token_expiry: new Date(mockTokens.expiry_date).toISOString(),
            },
            error: null,
          }),
        }),
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await retrieveTokens(mockSupabase, mockConnectionId);

      expect(result.access_token).toBe('ya29.test-access-token');
      expect(result.refresh_token).toBe('1//test-refresh-token');
      expect(result.expiry_date).toBe(mockTokens.expiry_date);
    });

    it('should throw error if connection not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      await expect(
        retrieveTokens(mockSupabase, mockConnectionId)
      ).rejects.toThrow('Calendar connection not found');
    });

    it('should throw error if database query fails', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      await expect(
        retrieveTokens(mockSupabase, mockConnectionId)
      ).rejects.toThrow('Failed to retrieve tokens');
    });
  });

  describe('getValidAccessToken', () => {
    it('should return existing token if not expired', async () => {
      const futureExpiry = Date.now() + 3600000; // 1 hour from now
      const validTokens = { ...mockTokens, expiry_date: futureExpiry };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              access_token: 'encrypted_ya29.test-access-token',
              refresh_token: 'encrypted_1//test-refresh-token',
              token_expiry: new Date(validTokens.expiry_date).toISOString(),
            },
            error: null,
          }),
        }),
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await getValidAccessToken(mockSupabase, mockConnectionId);

      expect(result).toBe('ya29.test-access-token');
      expect(refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should refresh token if expired', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiry_date: Date.now() - 3600000, // 1 hour ago
      };

      const newTokens = {
        ...mockTokens,
        access_token: 'ya29.new-access-token',
        expiry_date: Date.now() + 3600000,
      };

      // Mock retrieve tokens
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              access_token: 'encrypted_ya29.test-access-token',
              refresh_token: 'encrypted_1//test-refresh-token',
              token_expiry: new Date(expiredTokens.expiry_date).toISOString(),
            },
            error: null,
          }),
        }),
      });

      // Mock store tokens
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      (refreshAccessToken as Mock).mockResolvedValue(newTokens);

      const result = await getValidAccessToken(mockSupabase, mockConnectionId);

      expect(refreshAccessToken).toHaveBeenCalledWith('1//test-refresh-token');
      expect(result).toBe('ya29.new-access-token');
    });

    it('should mark connection inactive if refresh token is invalid', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiry_date: Date.now() - 3600000,
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              access_token: 'encrypted_ya29.test-access-token',
              refresh_token: 'encrypted_1//test-refresh-token',
              token_expiry: new Date(expiredTokens.expiry_date).toISOString(),
            },
            error: null,
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      (refreshAccessToken as Mock).mockRejectedValue(
        new Error('Refresh token is invalid or revoked')
      );

      await expect(
        getValidAccessToken(mockSupabase, mockConnectionId)
      ).rejects.toThrow('Calendar connection is invalid');

      // Verify connection was marked inactive
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
        })
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const newTokens = {
        ...mockTokens,
        access_token: 'ya29.new-access-token',
        expiry_date: Date.now() + 3600000,
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              access_token: 'encrypted_ya29.test-access-token',
              refresh_token: 'encrypted_1//test-refresh-token',
              token_expiry: new Date(mockTokens.expiry_date).toISOString(),
            },
            error: null,
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      (refreshAccessToken as Mock).mockResolvedValue(newTokens);

      const result = await refreshTokens(mockSupabase, mockConnectionId);

      expect(result).toEqual(newTokens);
      expect(refreshAccessToken).toHaveBeenCalledWith('1//test-refresh-token');
    });

    it('should mark connection inactive if refresh fails with invalid_grant', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              access_token: 'encrypted_ya29.test-access-token',
              refresh_token: 'encrypted_1//test-refresh-token',
              token_expiry: new Date(mockTokens.expiry_date).toISOString(),
            },
            error: null,
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      (refreshAccessToken as Mock).mockRejectedValue(
        new Error('invalid_grant')
      );

      await expect(
        refreshTokens(mockSupabase, mockConnectionId)
      ).rejects.toThrow('Refresh token is invalid');
    });
  });

  describe('prepareTokensForStorage', () => {
    it('should encrypt tokens and format for database', () => {
      const result = prepareTokensForStorage(mockTokens);

      expect(result.access_token).toBe('encrypted_ya29.test-access-token');
      expect(result.refresh_token).toBe('encrypted_1//test-refresh-token');
      expect(result.token_expiry).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
    });
  });

  describe('isTokenExpiryValid', () => {
    it('should return true for future expiry', () => {
      const futureExpiry = Date.now() + 3600000;
      expect(isTokenExpiryValid(futureExpiry)).toBe(true);
    });

    it('should return false for past expiry', () => {
      const pastExpiry = Date.now() - 3600000;
      expect(isTokenExpiryValid(pastExpiry)).toBe(false);
    });

    it('should return false for expiry within 1 minute', () => {
      const nearExpiry = Date.now() + 30000; // 30 seconds
      expect(isTokenExpiryValid(nearExpiry)).toBe(false);
    });

    it('should return true for expiry beyond 1 minute', () => {
      const safeExpiry = Date.now() + 120000; // 2 minutes
      expect(isTokenExpiryValid(safeExpiry)).toBe(true);
    });
  });
});
