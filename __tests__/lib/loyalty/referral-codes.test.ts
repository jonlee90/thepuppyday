/**
 * Tests for Referral Code Generation Utility
 * Task 0199: Referral codes API and utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateReferralCode, isValidReferralCodeFormat } from '@/lib/loyalty/referral-codes';

// ============================================================================
// MOCKS
// ============================================================================

const { mockCreateServerSupabaseClient } = vi.hoisted(() => ({
  mockCreateServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

// ============================================================================
// TESTS
// ============================================================================

describe('isValidReferralCodeFormat', () => {
  it('should accept valid 6-character uppercase alphanumeric codes', () => {
    expect(isValidReferralCodeFormat('ABC123')).toBe(true);
    expect(isValidReferralCodeFormat('XYZ789')).toBe(true);
    expect(isValidReferralCodeFormat('A1B2C3')).toBe(true);
    expect(isValidReferralCodeFormat('123456')).toBe(true);
    expect(isValidReferralCodeFormat('ABCDEF')).toBe(true);
  });

  it('should reject lowercase letters', () => {
    expect(isValidReferralCodeFormat('abc123')).toBe(false);
    expect(isValidReferralCodeFormat('Abc123')).toBe(false);
    expect(isValidReferralCodeFormat('abcdef')).toBe(false);
  });

  it('should reject special characters', () => {
    expect(isValidReferralCodeFormat('ABC-123')).toBe(false);
    expect(isValidReferralCodeFormat('ABC_123')).toBe(false);
    expect(isValidReferralCodeFormat('ABC 123')).toBe(false);
    expect(isValidReferralCodeFormat('ABC!23')).toBe(false);
  });

  it('should reject incorrect lengths', () => {
    expect(isValidReferralCodeFormat('ABC12')).toBe(false); // Too short
    expect(isValidReferralCodeFormat('ABC1234')).toBe(false); // Too long
    expect(isValidReferralCodeFormat('A')).toBe(false);
    expect(isValidReferralCodeFormat('')).toBe(false);
    expect(isValidReferralCodeFormat('ABCDEFGHIJ')).toBe(false);
  });

  it('should reject null and undefined', () => {
    // @ts-expect-error Testing invalid input
    expect(isValidReferralCodeFormat(null)).toBe(false);
    // @ts-expect-error Testing invalid input
    expect(isValidReferralCodeFormat(undefined)).toBe(false);
  });
});

describe('generateReferralCode', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
  });

  it('should generate a 6-character uppercase alphanumeric code', async () => {
    // Mock database check - code doesn't exist
    mockSupabase.single.mockResolvedValue({ data: null, error: null });

    const code = await generateReferralCode(mockSupabase);

    expect(code).toHaveLength(6);
    expect(isValidReferralCodeFormat(code)).toBe(true);
  });

  it('should only use uppercase letters and numbers', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null });

    const code = await generateReferralCode(mockSupabase);

    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should check database for uniqueness', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null });

    await generateReferralCode(mockSupabase);

    expect(mockSupabase.from).toHaveBeenCalledWith('referral_codes');
    expect(mockSupabase.select).toHaveBeenCalledWith('id');
    expect(mockSupabase.eq).toHaveBeenCalled();
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should retry if code already exists', async () => {
    // First call: code exists
    // Second call: code doesn't exist
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const code = await generateReferralCode(mockSupabase);

    expect(code).toHaveLength(6);
    expect(mockSupabase.single).toHaveBeenCalledTimes(2);
  });

  it('should retry up to 10 times before throwing error', async () => {
    // All 10 attempts return existing code
    mockSupabase.single.mockResolvedValue({ data: { id: 'existing-id' }, error: null });

    await expect(generateReferralCode(mockSupabase)).rejects.toThrow(
      'Failed to generate unique referral code after 10 attempts'
    );

    expect(mockSupabase.single).toHaveBeenCalledTimes(10);
  });

  it('should generate different codes on subsequent calls', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null });

    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const code = await generateReferralCode(mockSupabase);
      codes.add(code);
    }

    // With 100 random 6-character codes from 36 possible chars,
    // we expect high uniqueness (collision is very unlikely)
    expect(codes.size).toBeGreaterThan(90);
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.single.mockRejectedValue(new Error('Database connection failed'));

    await expect(generateReferralCode(mockSupabase)).rejects.toThrow('Database connection failed');
  });

  it('should check the correct table and column', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null });

    const code = await generateReferralCode(mockSupabase);

    expect(mockSupabase.from).toHaveBeenCalledWith('referral_codes');
    expect(mockSupabase.select).toHaveBeenCalledWith('id');
    expect(mockSupabase.eq).toHaveBeenCalledWith('code', code);
  });
});
