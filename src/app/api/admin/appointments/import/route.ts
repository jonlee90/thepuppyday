/**
 * CSV Import API
 * POST /api/admin/appointments/import
 *
 * Imports appointments from CSV file with batch processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  CSVProcessor,
  RowValidator,
  DuplicateDetector,
} from '@/lib/admin/appointments/csv-processor';
import { BatchProcessor } from '@/lib/admin/appointments/batch-processor';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large imports

/**
 * POST handler for CSV import
 */
export async function POST(request: NextRequest) {
  try {
    // Use regular client for authentication check
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    // Use service role client for data operations (bypasses RLS)
    // This is needed because admin creates pets/customers for other users
    const serviceClient = createServiceRoleClient() as SupabaseClient;

    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const duplicateStrategy = (formData.get('duplicate_strategy') as string) || 'skip';
    const sendNotifications = formData.get('send_notifications') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate duplicate strategy
    if (!['skip', 'overwrite'].includes(duplicateStrategy)) {
      return NextResponse.json(
        { error: 'Invalid duplicate_strategy. Must be "skip" or "overwrite"' },
        { status: 400 }
      );
    }

    // Initialize processors with service role client to bypass RLS
    const csvProcessor = new CSVProcessor();
    const rowValidator = new RowValidator(serviceClient);
    const duplicateDetector = new DuplicateDetector(serviceClient);
    const batchProcessor = new BatchProcessor(serviceClient);

    // 1. Parse CSV file
    let parseResult;
    try {
      parseResult = await csvProcessor.parseFile(file);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Failed to parse CSV file',
        },
        { status: 400 }
      );
    }

    const rows = parseResult.data;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // 2. Validate rows
    const validatedRows = await rowValidator.validateRows(rows);

    const validRows = validatedRows.filter((r) => r.isValid);
    const invalidRows = validatedRows.filter((r) => !r.isValid);

    // If there are invalid rows, return errors
    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: 'CSV contains validation errors',
          total_rows: rows.length,
          valid_rows: validRows.length,
          invalid_rows: invalidRows.length,
          errors: invalidRows.flatMap((row) =>
            row.errors.map((err) => ({
              row_number: row.rowNumber,
              field: err.field,
              message: err.message,
            }))
          ),
        },
        { status: 400 }
      );
    }

    // 3. Detect duplicates
    const duplicates = await duplicateDetector.detectDuplicates(rows);

    // 4. Process import with batch processor
    const result = await batchProcessor.processImport(
      rows,
      duplicates,
      {
        duplicateStrategy: duplicateStrategy as 'skip' | 'overwrite',
        sendNotifications,
        adminUserId: adminUser.id,
        onProgress: (processed, total) => {
          // Progress tracking (could be sent via websocket in real implementation)
          console.log(`Import progress: ${processed}/${total}`);
        },
      }
    );

    // 5. Return detailed result
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error in CSV import API:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
