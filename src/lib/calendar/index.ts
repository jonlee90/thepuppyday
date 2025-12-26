/**
 * Google Calendar Integration Module
 * Phase 1: Foundation - OAuth, Encryption, and Connection Management
 */

// Encryption utilities
export {
  encryptToken,
  decryptToken,
  generateEncryptionKey,
  validateEncryptionConfig,
} from './encryption';

// OAuth client
export {
  createOAuth2Client,
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeTokens,
  createAuthenticatedClient,
  validateOAuthConfig,
  GOOGLE_CALENDAR_SCOPES,
} from './oauth';

// Token manager
export {
  isTokenExpired,
  storeTokens,
  retrieveTokens,
  getValidAccessToken,
  refreshTokens,
  prepareTokensForStorage,
  isTokenExpiryValid,
} from './token-manager';

// Connection service
export {
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
} from './connection';
