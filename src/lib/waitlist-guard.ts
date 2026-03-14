/**
 * Waitlist feature guard for API routes
 * Returns a 404 response when waitlist feature is disabled
 */

import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export function waitlistDisabledResponse() {
  if (!config.features.waitlistEnabled) {
    return NextResponse.json(
      { error: 'Waitlist feature is not enabled' },
      { status: 404 }
    );
  }
  return null;
}
