/**
 * Calendar Import Preview Endpoint
 * POST /api/admin/calendar/import/preview
 * Task 0030: Preview calendar events for import
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getActiveConnection } from '@/lib/calendar/connection';
import { createGoogleCalendarClient } from '@/lib/calendar/google-client';
import { parseCalendarEvent } from '@/lib/calendar/import/parser';
import { validateEventForImport } from '@/lib/calendar/import/validation';
import { findDuplicateAppointment } from '@/lib/calendar/import/duplicate-detection';
import { importPreviewRequestSchema } from '@/types/calendar';
import type { ParsedEventData } from '@/lib/calendar/import/parser';
import type { ValidationResult } from '@/lib/calendar/import/validation';
import type { DuplicateMatch } from '@/lib/calendar/import/duplicate-detection';

/**
 * Import preview event
 */
interface ImportPreviewEvent {
  google_event_id: string;
  title: string;
  start: string;
  end: string;
  parsed_data: ParsedEventData;
  validation: ValidationResult;
  duplicate_match: DuplicateMatch | null;
  importable: boolean;
}

/**
 * Import preview response
 */
interface ImportPreviewResponse {
  success: boolean;
  events: ImportPreviewEvent[];
  summary: {
    total: number;
    importable: number;
    duplicates: number;
    invalid: number;
  };
}

/**
 * Maximum events to preview
 */
const MAX_PREVIEW_EVENTS = 100;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Import Preview] Admin user:', adminUser.email);

    // Parse request body
    const body = await request.json();

    // Validate request
    const validationResult = importPreviewRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[Import Preview] Invalid request:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, calendarId } = validationResult.data;

    console.log('[Import Preview] Date range:', { dateFrom, dateTo, calendarId });

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, adminUser.id);
    if (!connection) {
      console.error('[Import Preview] No active calendar connection');
      return NextResponse.json(
        { error: 'No active calendar connection found' },
        { status: 404 }
      );
    }

    console.log('[Import Preview] Using connection:', connection.id);

    // Create Google Calendar client
    const calendarClient = createGoogleCalendarClient(
      supabase,
      connection.id,
      calendarId || connection.calendar_id
    );

    // Fetch events from Google Calendar
    console.log('[Import Preview] Fetching events from Google Calendar...');
    const googleEvents = await calendarClient.listEvents({
      timeMin: new Date(dateFrom).toISOString(),
      timeMax: new Date(dateTo).toISOString(),
      maxResults: MAX_PREVIEW_EVENTS,
    });

    console.log(`[Import Preview] Fetched ${googleEvents.length} events`);

    // Check if any events are already imported
    const googleEventIds = googleEvents.map(e => e.id).filter(Boolean) as string[];
    const { data: existingMappings } = await supabase
      .from('calendar_event_mappings')
      .select('google_event_id')
      .in('google_event_id', googleEventIds);

    const alreadyImportedIds = new Set(
      existingMappings?.map(m => m.google_event_id) || []
    );

    console.log(`[Import Preview] ${alreadyImportedIds.size} events already imported`);

    // Process each event
    const previewEvents: ImportPreviewEvent[] = [];
    let importableCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    for (const googleEvent of googleEvents) {
      if (!googleEvent.id) continue;

      // Skip already imported events
      if (alreadyImportedIds.has(googleEvent.id)) {
        console.log(`[Import Preview] Skipping already imported event: ${googleEvent.id}`);
        continue;
      }

      try {
        // Parse event
        const parsedData = parseCalendarEvent(googleEvent);

        // Validate event
        const validation = validateEventForImport(parsedData);

        // Check for duplicates (only if valid)
        let duplicateMatch: DuplicateMatch | null = null;
        if (validation.valid) {
          duplicateMatch = await findDuplicateAppointment(supabase, parsedData);
        }

        // Determine if event is importable
        // Event is importable if:
        // 1. It passes validation
        // 2. Either no duplicate found OR duplicate confidence is low (<60)
        const importable = validation.valid && (!duplicateMatch || duplicateMatch.confidence < 60);

        if (importable) {
          importableCount++;
        } else if (duplicateMatch && duplicateMatch.confidence >= 60) {
          duplicateCount++;
        } else {
          invalidCount++;
        }

        previewEvents.push({
          google_event_id: googleEvent.id,
          title: parsedData.title,
          start: parsedData.start,
          end: parsedData.end,
          parsed_data: parsedData,
          validation,
          duplicate_match: duplicateMatch,
          importable,
        });

        console.log(
          `[Import Preview] Processed event ${googleEvent.id}: ` +
          `valid=${validation.valid}, duplicate=${!!duplicateMatch}, importable=${importable}`
        );
      } catch (error) {
        console.error(`[Import Preview] Error processing event ${googleEvent.id}:`, error);

        // Add event with validation error
        previewEvents.push({
          google_event_id: googleEvent.id,
          title: googleEvent.summary || 'Untitled',
          start: googleEvent.start?.dateTime || googleEvent.start?.date || '',
          end: googleEvent.end?.dateTime || googleEvent.end?.date || '',
          parsed_data: {
            title: googleEvent.summary || '',
            start: googleEvent.start?.dateTime || googleEvent.start?.date || '',
            end: googleEvent.end?.dateTime || googleEvent.end?.date || '',
            customer: {},
          },
          validation: {
            valid: false,
            errors: [`Failed to process event: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: [],
          },
          duplicate_match: null,
          importable: false,
        });

        invalidCount++;
      }
    }

    const response: ImportPreviewResponse = {
      success: true,
      events: previewEvents,
      summary: {
        total: previewEvents.length,
        importable: importableCount,
        duplicates: duplicateCount,
        invalid: invalidCount,
      },
    };

    console.log('[Import Preview] Preview generated:', response.summary);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Import Preview] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to preview calendar events',
        details: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
