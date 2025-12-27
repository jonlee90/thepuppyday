/**
 * Service Account Connection API
 * POST /api/admin/calendar/auth/service-account
 *
 * Handles connecting Google Calendar via Service Account credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  validateServiceAccountCredentials,
  saveConnection,
  type ServiceAccountCredentials,
} from '@/lib/calendar/serviceAccount';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdmin();

    // Parse request body
    const body = await request.json();
    const { credentials: credentialsString, calendarId } = body;

    // Validate inputs
    if (!credentialsString || typeof credentialsString !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Service account credentials are required',
        },
        { status: 400 }
      );
    }

    if (!calendarId || typeof calendarId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Calendar ID is required',
        },
        { status: 400 }
      );
    }

    // Parse and validate credentials
    let credentials: ServiceAccountCredentials;
    try {
      credentials = JSON.parse(credentialsString);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON format in credentials',
        },
        { status: 400 }
      );
    }

    // Validate service account structure
    if (!validateServiceAccountCredentials(credentials)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid service account credentials. Please ensure you uploaded the correct JSON file from Google Cloud Console.',
        },
        { status: 400 }
      );
    }

    // Save connection (this also tests the connection)
    const result = await saveConnection(credentials, calendarId, adminUser.id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to connect to Google Calendar',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      connectionId: result.connectionId,
      message: 'Successfully connected to Google Calendar',
    });
  } catch (error) {
    console.error('Service account connection error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while connecting to Google Calendar',
      },
      { status: 500 }
    );
  }
}
