/**
 * Phase 8: Unsubscribe Token Management
 * Utilities for generating and validating secure unsubscribe tokens
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { NotificationChannel } from '@/types/database';

/**
 * Token payload structure
 */
export interface UnsubscribeTokenPayload {
  userId: string;
  notificationType: string;
  channel: NotificationChannel;
  expiresAt: number; // Unix timestamp
}

/**
 * Token expiration time in milliseconds (30 days)
 */
const TOKEN_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Secret key for HMAC signing (in production, use environment variable)
 */
const getTokenSecret = (): string => {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      'UNSUBSCRIBE_TOKEN_SECRET must be set in environment variables. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }
  if (secret.length < 32) {
    throw new Error(
      'UNSUBSCRIBE_TOKEN_SECRET must be at least 32 characters long for security. ' +
      'Current length: ' + secret.length
    );
  }
  return secret;
};

/**
 * Generate a secure unsubscribe token
 * Format: base64url(payload).base64url(signature)
 */
export function generateUnsubscribeToken(payload: Omit<UnsubscribeTokenPayload, 'expiresAt'>): string {
  const expiresAt = Date.now() + TOKEN_EXPIRATION_MS;

  const fullPayload: UnsubscribeTokenPayload = {
    ...payload,
    expiresAt,
  };

  // Encode payload as base64url
  const payloadJson = JSON.stringify(fullPayload);
  const payloadBase64 = Buffer.from(payloadJson).toString('base64url');

  // Generate HMAC signature
  const signature = createHmac('sha256', getTokenSecret())
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Validate and decode an unsubscribe token
 * Returns payload if valid, null if invalid or expired
 */
export function validateUnsubscribeToken(token: string): UnsubscribeTokenPayload | null {
  try {
    // Split token into payload and signature
    const parts = token.split('.');
    if (parts.length !== 2) {
      console.warn('[Unsubscribe] Invalid token format');
      return null;
    }

    const [payloadBase64, providedSignature] = parts;

    // Verify signature using constant-time comparison
    const expectedSignature = createHmac('sha256', getTokenSecret())
      .update(payloadBase64)
      .digest('base64url');

    // Convert to buffers for constant-time comparison
    const providedBuffer = Buffer.from(providedSignature, 'base64url');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

    if (providedBuffer.length !== expectedBuffer.length) {
      console.warn('[Unsubscribe] Invalid signature length');
      return null;
    }

    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
      console.warn('[Unsubscribe] Invalid signature');
      return null;
    }

    // Decode payload
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: UnsubscribeTokenPayload = JSON.parse(payloadJson);

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      console.warn('[Unsubscribe] Token expired');
      return null;
    }

    // Validate payload structure
    if (!payload.userId || !payload.notificationType || !payload.channel) {
      console.warn('[Unsubscribe] Invalid payload structure');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[Unsubscribe] Error validating token:', error);
    return null;
  }
}

/**
 * Generate an unsubscribe URL for email templates
 */
export function generateUnsubscribeUrl(
  userId: string,
  notificationType: string,
  channel: NotificationChannel
): string {
  const token = generateUnsubscribeToken({
    userId,
    notificationType,
    channel,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Generate a general marketing unsubscribe URL
 */
export function generateMarketingUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken({
    userId,
    notificationType: 'marketing',
    channel: 'email', // Default, will disable all marketing
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}
