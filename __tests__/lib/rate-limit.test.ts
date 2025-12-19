/**
 * Tests for Rate Limiting Utility
 * Task 0177: Banner click tracking endpoint
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, getClientIp, resetRateLimitStore } from '@/lib/rate-limit';

describe('Rate Limiting Utility', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
    resetRateLimitStore(); // Clear rate limit store between tests
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-key', {
        limit: 10,
        windowMs: 60000,
      });

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should allow requests within limit', () => {
      const options = { limit: 5, windowMs: 60000 };

      // Make 5 requests (at limit)
      for (let i = 1; i <= 5; i++) {
        const result = checkRateLimit('test-key', options);
        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(i);
      }
    });

    it('should block requests exceeding limit', () => {
      const options = { limit: 3, windowMs: 60000 };

      // First 3 requests should be allowed
      checkRateLimit('test-key', options);
      checkRateLimit('test-key', options);
      checkRateLimit('test-key', options);

      // 4th request should be blocked
      const result = checkRateLimit('test-key', options);
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(4);
    });

    it('should reset after time window expires', () => {
      const options = { limit: 2, windowMs: 60000 };

      // Make 2 requests
      checkRateLimit('test-key', options);
      checkRateLimit('test-key', options);

      // 3rd request should be blocked
      let result = checkRateLimit('test-key', options);
      expect(result.allowed).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(61000);

      // Should be allowed again (new window)
      result = checkRateLimit('test-key', options);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);
    });

    it('should track different keys independently', () => {
      const options = { limit: 2, windowMs: 60000 };

      // Make 2 requests with key1
      checkRateLimit('key1', options);
      checkRateLimit('key1', options);

      // key1 should be at limit
      let result = checkRateLimit('key1', options);
      expect(result.allowed).toBe(false);

      // key2 should still be allowed
      result = checkRateLimit('key2', options);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);
    });

    it('should return correct reset time', () => {
      const now = Date.now();
      const windowMs = 60000;

      const result = checkRateLimit('test-key', {
        limit: 10,
        windowMs,
      });

      // Reset time should be approximately now + windowMs
      expect(result.resetTime).toBeGreaterThanOrEqual(now + windowMs - 100);
      expect(result.resetTime).toBeLessThanOrEqual(now + windowMs + 100);
    });

    it('should preserve reset time within window', () => {
      const options = { limit: 10, windowMs: 60000 };

      const result1 = checkRateLimit('test-key', options);

      // Advance time by 10 seconds
      vi.advanceTimersByTime(10000);

      const result2 = checkRateLimit('test-key', options);

      // Reset time should be the same for both requests
      expect(result2.resetTime).toBe(result1.resetTime);
    });

    it('should handle high request rates', () => {
      const options = { limit: 100, windowMs: 60000 };

      // Make 100 rapid requests
      for (let i = 1; i <= 100; i++) {
        const result = checkRateLimit('test-key', options);
        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(i);
      }

      // 101st should be blocked
      const result = checkRateLimit('test-key', options);
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(101);
    });

    it('should handle zero limit', () => {
      // Edge case: limit of 0 means first request creates window, but is over limit
      // The check is count <= limit, so 1 <= 0 is false
      const options = { limit: 0, windowMs: 60000 };

      const result1 = checkRateLimit('test-key', options);
      // First request creates the window but exceeds limit (1 > 0)
      expect(result1.allowed).toBe(false);
      expect(result1.currentCount).toBe(1);

      const result2 = checkRateLimit('test-key', options);
      // Second request also exceeds limit
      expect(result2.allowed).toBe(false);
      expect(result2.currentCount).toBe(2);
    });

    it('should handle very short time windows', () => {
      const options = { limit: 2, windowMs: 100 };

      checkRateLimit('test-key', options);
      checkRateLimit('test-key', options);

      // Should be at limit
      let result = checkRateLimit('test-key', options);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      vi.advanceTimersByTime(101);

      // Should be allowed again
      result = checkRateLimit('test-key', options);
      expect(result.allowed).toBe(true);
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should handle multiple IPs in x-forwarded-for (take first)', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should extract IP from x-real-ip header when x-forwarded-for not present', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '203.0.113.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
          'x-real-ip': '203.0.113.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should return "unknown" when no IP headers present', () => {
      const request = new Request('http://localhost');

      const ip = getClientIp(request);
      expect(ip).toBe('unknown');
    });

    it('should trim whitespace from x-forwarded-for IPs', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '  192.168.1.100  , 10.0.0.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should handle IPv6 addresses', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });
  });

  describe('Memory Cleanup', () => {
    it('should clean up expired entries periodically', () => {
      const options = { limit: 10, windowMs: 60000 };

      // Create entries for multiple keys
      checkRateLimit('key1', options);
      checkRateLimit('key2', options);
      checkRateLimit('key3', options);

      // Advance time past window expiry
      vi.advanceTimersByTime(61000);

      // Trigger cleanup (runs every 5 minutes)
      vi.advanceTimersByTime(5 * 60 * 1000);

      // New requests should start fresh (indicating cleanup occurred)
      const result = checkRateLimit('key1', options);
      expect(result.currentCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large limits', () => {
      const result = checkRateLimit('test-key', {
        limit: 1000000,
        windowMs: 60000,
      });

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1000000);
    });

    it('should handle very long time windows', () => {
      const oneDay = 24 * 60 * 60 * 1000;
      const result = checkRateLimit('test-key', {
        limit: 100,
        windowMs: oneDay,
      });

      expect(result.allowed).toBe(true);
      expect(result.resetTime).toBeGreaterThan(Date.now() + oneDay - 1000);
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'user:192.168.1.1:banner-click';
      const result = checkRateLimit(specialKey, {
        limit: 10,
        windowMs: 60000,
      });

      expect(result.allowed).toBe(true);
    });

    it('should handle concurrent requests to same key', () => {
      const options = { limit: 10, windowMs: 60000 };

      // Simulate 5 concurrent requests
      const results = [
        checkRateLimit('test-key', options),
        checkRateLimit('test-key', options),
        checkRateLimit('test-key', options),
        checkRateLimit('test-key', options),
        checkRateLimit('test-key', options),
      ];

      // All should be allowed
      results.forEach((result) => {
        expect(result.allowed).toBe(true);
      });

      // Final count should be 5
      expect(results[results.length - 1].currentCount).toBe(5);
    });
  });
});
