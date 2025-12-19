/**
 * Referral Code Generation Utility
 * Task 0199: Referral codes API and utility
 *
 * Provides utilities for generating unique 6-character alphanumeric referral codes
 * and validating referral code formats.
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';

/**
 * Generates a unique 6-character alphanumeric referral code
 * Format: ABC123 (uppercase letters and numbers only)
 *
 * @param supabase - Supabase client instance
 * @returns Promise resolving to a unique 6-character referral code
 * @throws Error if unable to generate unique code after 10 attempts
 *
 * @example
 * const code = await generateReferralCode(supabase);
 * console.log(code); // "XYZ789"
 */
export async function generateReferralCode(supabase: AppSupabaseClient): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 6;

  // Try up to 10 times to generate a unique code
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('referral_codes')
      .select('id')
      .eq('code', code)
      .single();

    if (!data) {
      console.log(`[Referral Codes] Generated unique code: ${code} on attempt ${attempt + 1}`);
      return code; // Code is unique
    }

    console.log(`[Referral Codes] Code ${code} already exists, retrying...`);
  }

  throw new Error('Failed to generate unique referral code after 10 attempts');
}

/**
 * Validates referral code format
 *
 * @param code - Referral code string to validate
 * @returns true if code matches expected format (6 uppercase alphanumeric chars)
 *
 * @example
 * isValidReferralCodeFormat("ABC123"); // true
 * isValidReferralCodeFormat("abc123"); // false (lowercase)
 * isValidReferralCodeFormat("ABCD12"); // true
 * isValidReferralCodeFormat("ABC-123"); // false (special char)
 * isValidReferralCodeFormat("ABC12"); // false (too short)
 */
export function isValidReferralCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
