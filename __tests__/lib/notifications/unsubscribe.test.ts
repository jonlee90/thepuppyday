/**
 * Unit tests for unsubscribe token utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateUnsubscribeToken,
  validateUnsubscribeToken,
  generateUnsubscribeUrl,
  generateMarketingUnsubscribeUrl,
} from '@/lib/notifications/unsubscribe';

describe('generateUnsubscribeToken', () => {
  it('generates a valid token with correct structure', () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    // Token should have format: base64url.base64url
    const parts = token.split('.');
    expect(parts).toHaveLength(2);

    // Both parts should be base64url encoded
    expect(parts[0]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates different tokens for different users', () => {
    const token1 = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    const token2 = generateUnsubscribeToken({
      userId: 'user-456',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    expect(token1).not.toBe(token2);
  });

  it('generates different tokens for different notification types', () => {
    const token1 = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    const token2 = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'retention_reminder',
      channel: 'email',
    });

    expect(token1).not.toBe(token2);
  });

  it('generates different tokens for different channels', () => {
    const token1 = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    const token2 = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'sms',
    });

    expect(token1).not.toBe(token2);
  });
});

describe('validateUnsubscribeToken', () => {
  it('validates a freshly generated token', () => {
    const payload = {
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email' as const,
    };

    const token = generateUnsubscribeToken(payload);
    const validated = validateUnsubscribeToken(token);

    expect(validated).toBeTruthy();
    expect(validated?.userId).toBe(payload.userId);
    expect(validated?.notificationType).toBe(payload.notificationType);
    expect(validated?.channel).toBe(payload.channel);
    expect(validated?.expiresAt).toBeGreaterThan(Date.now());
  });

  it('rejects token with invalid format', () => {
    const result = validateUnsubscribeToken('invalid-token');
    expect(result).toBeNull();
  });

  it('rejects token with missing parts', () => {
    const result = validateUnsubscribeToken('only-one-part');
    expect(result).toBeNull();
  });

  it('rejects token with too many parts', () => {
    const result = validateUnsubscribeToken('part1.part2.part3');
    expect(result).toBeNull();
  });

  it('rejects token with invalid signature', () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    // Tamper with signature
    const parts = token.split('.');
    const tamperedToken = `${parts[0]}.invalid-signature`;

    const result = validateUnsubscribeToken(tamperedToken);
    expect(result).toBeNull();
  });

  it('rejects token with tampered payload', () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    // Tamper with payload
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        userId: 'user-456',
        notificationType: 'appointment_reminder',
        channel: 'email',
        expiresAt: Date.now() + 1000000,
      })
    ).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${parts[1]}`;

    const result = validateUnsubscribeToken(tamperedToken);
    expect(result).toBeNull();
  });

  it('rejects expired token', () => {
    // Create a token that expires immediately
    const payload = {
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email' as const,
    };

    const token = generateUnsubscribeToken(payload);

    // Mock Date.now to simulate time passing
    const originalDateNow = Date.now;
    const futureTime = Date.now() + 31 * 24 * 60 * 60 * 1000; // 31 days from now
    vi.spyOn(Date, 'now').mockReturnValue(futureTime);

    const result = validateUnsubscribeToken(token);

    // Restore Date.now
    Date.now = originalDateNow;

    expect(result).toBeNull();
  });

  it('rejects token with missing userId', () => {
    // Manually create invalid payload
    const invalidPayload = {
      notificationType: 'appointment_reminder',
      channel: 'email',
      expiresAt: Date.now() + 1000000,
    };

    const payloadBase64 = Buffer.from(JSON.stringify(invalidPayload)).toString('base64url');
    const token = `${payloadBase64}.fake-signature`;

    const result = validateUnsubscribeToken(token);
    expect(result).toBeNull();
  });

  it('rejects token with invalid JSON payload', () => {
    const invalidPayload = 'not-json';
    const payloadBase64 = Buffer.from(invalidPayload).toString('base64url');
    const token = `${payloadBase64}.fake-signature`;

    const result = validateUnsubscribeToken(token);
    expect(result).toBeNull();
  });
});

describe('generateUnsubscribeUrl', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterEach(() => {
    if (originalAppUrl) {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  it('generates URL with correct base path', () => {
    const url = generateUnsubscribeUrl('user-123', 'appointment_reminder', 'email');

    expect(url).toContain('https://example.com/api/unsubscribe?token=');
  });

  it('generates URL with encoded token', () => {
    const url = generateUnsubscribeUrl('user-123', 'appointment_reminder', 'email');
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');

    expect(token).toBeTruthy();
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it('generates different URLs for different users', () => {
    const url1 = generateUnsubscribeUrl('user-123', 'appointment_reminder', 'email');
    const url2 = generateUnsubscribeUrl('user-456', 'appointment_reminder', 'email');

    expect(url1).not.toBe(url2);
  });

  it('uses localhost when NEXT_PUBLIC_APP_URL not set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    const url = generateUnsubscribeUrl('user-123', 'appointment_reminder', 'email');

    expect(url).toContain('http://localhost:3000/api/unsubscribe?token=');
  });
});

describe('generateMarketingUnsubscribeUrl', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterEach(() => {
    if (originalAppUrl) {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  it('generates URL with marketing notification type', () => {
    const url = generateMarketingUnsubscribeUrl('user-123');
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');

    expect(token).toBeTruthy();

    // Validate the token contains marketing type
    const validated = validateUnsubscribeToken(token!);
    expect(validated?.notificationType).toBe('marketing');
  });

  it('uses email as default channel', () => {
    const url = generateMarketingUnsubscribeUrl('user-123');
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');

    const validated = validateUnsubscribeToken(token!);
    expect(validated?.channel).toBe('email');
  });

  it('generates different URLs for different users', () => {
    const url1 = generateMarketingUnsubscribeUrl('user-123');
    const url2 = generateMarketingUnsubscribeUrl('user-456');

    expect(url1).not.toBe(url2);
  });
});
