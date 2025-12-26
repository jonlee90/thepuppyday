/**
 * Unit tests for Google OAuth client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import {
  createOAuth2Client,
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeTokens,
  createAuthenticatedClient,
  validateOAuthConfig,
  GOOGLE_CALENDAR_SCOPES,
} from '../oauth';

// Mock the googleapis module
vi.mock('googleapis', () => {
  const mockOAuth2Client = {
    generateAuthUrl: vi.fn(),
    getToken: vi.fn(),
    setCredentials: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeCredentials: vi.fn(),
  };

  return {
    google: {
      auth: {
        OAuth2: vi.fn(() => mockOAuth2Client),
      },
    },
  };
});

// Import mocked google object
import { google } from 'googleapis';

describe('Google OAuth Client', () => {
  const originalEnv = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  beforeEach(() => {
    // Set test environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env.GOOGLE_CLIENT_ID = originalEnv.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = originalEnv.GOOGLE_CLIENT_SECRET;
    process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL;
  });

  describe('GOOGLE_CALENDAR_SCOPES', () => {
    it('should include calendar.events scope', () => {
      expect(GOOGLE_CALENDAR_SCOPES).toContain(
        'https://www.googleapis.com/auth/calendar.events'
      );
    });
  });

  describe('createOAuth2Client', () => {
    it('should create OAuth2 client with correct parameters', () => {
      createOAuth2Client();

      expect(google.auth.OAuth2).toHaveBeenCalledWith(
        'test-client-id',
        'test-client-secret',
        'https://test.example.com/api/admin/calendar/auth/callback'
      );
    });

    it('should throw error if GOOGLE_CLIENT_ID is not set', () => {
      delete process.env.GOOGLE_CLIENT_ID;

      expect(() => createOAuth2Client()).toThrow(
        'GOOGLE_CLIENT_ID environment variable is not set'
      );
    });

    it('should throw error if GOOGLE_CLIENT_SECRET is not set', () => {
      delete process.env.GOOGLE_CLIENT_SECRET;

      expect(() => createOAuth2Client()).toThrow(
        'GOOGLE_CLIENT_SECRET environment variable is not set'
      );
    });

    it('should throw error if NEXT_PUBLIC_APP_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      expect(() => createOAuth2Client()).toThrow(
        'NEXT_PUBLIC_APP_URL environment variable is not set'
      );
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate auth URL with correct parameters', () => {
      const mockGenerateAuthUrl = vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?...');
      const mockClient = {
        generateAuthUrl: mockGenerateAuthUrl,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      const authUrl = generateAuthUrl('admin-user-123');

      expect(mockGenerateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        prompt: 'consent',
        scope: GOOGLE_CALENDAR_SCOPES,
        state: 'admin-user-123',
      });
      expect(authUrl).toBe('https://accounts.google.com/o/oauth2/v2/auth?...');
    });

    it('should use admin user ID as state parameter', () => {
      const mockGenerateAuthUrl = vi.fn().mockReturnValue('https://auth.url');
      const mockClient = {
        generateAuthUrl: mockGenerateAuthUrl,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      generateAuthUrl('user-abc-xyz');

      expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'user-abc-xyz',
        })
      );
    });
  });

  describe('exchangeCodeForTokens', () => {
    const mockTokens = {
      access_token: 'ya29.test-access-token',
      refresh_token: '1//test-refresh-token',
      expiry_date: Date.now() + 3600000,
      token_type: 'Bearer',
      scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    };

    it('should exchange authorization code for tokens', async () => {
      const mockGetToken = vi.fn().mockResolvedValue({ tokens: mockTokens });
      const mockClient = {
        getToken: mockGetToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      const result = await exchangeCodeForTokens('auth-code-123');

      expect(mockGetToken).toHaveBeenCalledWith('auth-code-123');
      expect(result).toEqual(mockTokens);
    });

    it('should throw error for empty code', async () => {
      await expect(exchangeCodeForTokens('')).rejects.toThrow(
        'Authorization code is required'
      );
    });

    it('should throw error if no access token received', async () => {
      const mockGetToken = vi.fn().mockResolvedValue({
        tokens: { ...mockTokens, access_token: undefined },
      });
      const mockClient = {
        getToken: mockGetToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      await expect(exchangeCodeForTokens('code')).rejects.toThrow(
        'No access token received from Google'
      );
    });

    it('should throw error if no refresh token received', async () => {
      const mockGetToken = vi.fn().mockResolvedValue({
        tokens: { ...mockTokens, refresh_token: undefined },
      });
      const mockClient = {
        getToken: mockGetToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      await expect(exchangeCodeForTokens('code')).rejects.toThrow(
        'No refresh token received from Google'
      );
    });

    it('should throw error if no expiry date received', async () => {
      const mockGetToken = vi.fn().mockResolvedValue({
        tokens: { ...mockTokens, expiry_date: undefined },
      });
      const mockClient = {
        getToken: mockGetToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      await expect(exchangeCodeForTokens('code')).rejects.toThrow(
        'No expiry date received from Google'
      );
    });

    it('should handle API errors', async () => {
      const mockGetToken = vi.fn().mockRejectedValue(new Error('API error'));
      const mockClient = {
        getToken: mockGetToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      await expect(exchangeCodeForTokens('code')).rejects.toThrow(
        'Failed to exchange authorization code: API error'
      );
    });
  });

  describe('refreshAccessToken', () => {
    const mockCredentials = {
      access_token: 'ya29.new-access-token',
      refresh_token: '1//test-refresh-token',
      expiry_date: Date.now() + 3600000,
      token_type: 'Bearer',
      scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    };

    it('should refresh access token successfully', async () => {
      const mockSetCredentials = vi.fn();
      const mockRefreshAccessToken = vi.fn().mockResolvedValue({
        credentials: mockCredentials,
      });
      const mockClient = {
        setCredentials: mockSetCredentials,
        refreshAccessToken: mockRefreshAccessToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      const result = await refreshAccessToken('1//test-refresh');

      expect(mockSetCredentials).toHaveBeenCalledWith({
        refresh_token: '1//test-refresh',
      });
      expect(mockRefreshAccessToken).toHaveBeenCalled();
      expect(result.access_token).toBe('ya29.new-access-token');
    });

    it('should throw error for empty refresh token', async () => {
      await expect(refreshAccessToken('')).rejects.toThrow(
        'Refresh token is required'
      );
    });

    it('should throw error if no access token received', async () => {
      const mockRefreshAccessToken = vi.fn().mockResolvedValue({
        credentials: { ...mockCredentials, access_token: undefined },
      });
      const mockClient = {
        setCredentials: vi.fn(),
        refreshAccessToken: mockRefreshAccessToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      await expect(refreshAccessToken('token')).rejects.toThrow(
        'No access token received from Google'
      );
    });

    it('should handle invalid_grant error', async () => {
      const error = new Error('invalid_grant');
      const mockRefreshAccessToken = vi.fn().mockRejectedValue(error);
      const mockClient = {
        setCredentials: vi.fn(),
        refreshAccessToken: mockRefreshAccessToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      await expect(refreshAccessToken('token')).rejects.toThrow(
        'Refresh token is invalid or revoked'
      );
    });

    it('should use existing refresh token if new one not provided', async () => {
      const mockRefreshAccessToken = vi.fn().mockResolvedValue({
        credentials: {
          ...mockCredentials,
          refresh_token: undefined,
        },
      });
      const mockClient = {
        setCredentials: vi.fn(),
        refreshAccessToken: mockRefreshAccessToken,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      const result = await refreshAccessToken('1//existing-token');

      expect(result.refresh_token).toBe('1//existing-token');
    });
  });

  describe('revokeTokens', () => {
    it('should revoke tokens successfully', async () => {
      const mockSetCredentials = vi.fn();
      const mockRevokeCredentials = vi.fn().mockResolvedValue(undefined);
      const mockClient = {
        setCredentials: mockSetCredentials,
        revokeCredentials: mockRevokeCredentials,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      const result = await revokeTokens('ya29.access-token');

      expect(mockSetCredentials).toHaveBeenCalledWith({
        access_token: 'ya29.access-token',
      });
      expect(mockRevokeCredentials).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error for empty access token', async () => {
      await expect(revokeTokens('')).rejects.toThrow(
        'Access token is required for revocation'
      );
    });

    it('should return true if token is already invalid', async () => {
      const error = new Error('invalid_token');
      const mockRevokeCredentials = vi.fn().mockRejectedValue(error);
      const mockClient = {
        setCredentials: vi.fn(),
        revokeCredentials: mockRevokeCredentials,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      const result = await revokeTokens('token');

      expect(result).toBe(true);
    });

    it('should throw error for other revocation failures', async () => {
      const error = new Error('Network error');
      const mockRevokeCredentials = vi.fn().mockRejectedValue(error);
      const mockClient = {
        setCredentials: vi.fn(),
        revokeCredentials: mockRevokeCredentials,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      await expect(revokeTokens('token')).rejects.toThrow(
        'Failed to revoke tokens: Network error'
      );
    });
  });

  describe('createAuthenticatedClient', () => {
    it('should create authenticated client with tokens', () => {
      const mockSetCredentials = vi.fn();
      const mockClient = {
        setCredentials: mockSetCredentials,
      };
      (google.auth.OAuth2 as Mock).mockReturnValue(mockClient);

      const tokens = {
        access_token: 'ya29.test',
        refresh_token: '1//test',
        expiry_date: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: GOOGLE_CALENDAR_SCOPES.join(' '),
      };

      const client = createAuthenticatedClient(tokens);

      expect(mockSetCredentials).toHaveBeenCalledWith({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
      });
      expect(client).toBeDefined();
    });
  });

  describe('validateOAuthConfig', () => {
    it('should not throw error when OAuth is properly configured', () => {
      expect(() => validateOAuthConfig()).not.toThrow();
    });

    it('should throw error when GOOGLE_CLIENT_ID is not set', () => {
      delete process.env.GOOGLE_CLIENT_ID;

      expect(() => validateOAuthConfig()).toThrow(
        'OAuth configuration validation failed'
      );
    });

    it('should throw error when GOOGLE_CLIENT_SECRET is not set', () => {
      delete process.env.GOOGLE_CLIENT_SECRET;

      expect(() => validateOAuthConfig()).toThrow(
        'OAuth configuration validation failed'
      );
    });

    it('should throw error when NEXT_PUBLIC_APP_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      expect(() => validateOAuthConfig()).toThrow(
        'OAuth configuration validation failed'
      );
    });
  });
});
