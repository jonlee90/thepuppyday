/**
 * CSV Validation API
 * POST /api/admin/appointments/import/validate
 *
 * Validates CSV file without importing - provides preview and error report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { CSVProcessor, RowValidator, DuplicateDetector } from '@/lib/admin/appointments/csv-processor';
import type { CSVValidationResponse } from '@/types/admin-appointments';

export const dynamic = 'force-dynamic';

/**
 * POST handler for CSV validation (preview mode)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Initialize processors
    const csvProcessor = new CSVProcessor();
    const rowValidator = new RowValidator(supabase);
    const duplicateDetector = new DuplicateDetector(supabase);

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
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // 2. Validate rows
    const validatedRows = await rowValidator.validateRows(rows);

    const validRows = validatedRows.filter((r) => r.isValid);
    const invalidRows = validatedRows.filter((r) => !r.isValid);

    // 3. Detect duplicates (only for valid rows)
    const duplicates = await duplicateDetector.detectDuplicates(
      rows.filter((_, index) => validatedRows[index].isValid)
    );

    // 4. Prepare preview (first 5 rows)
    const preview = validatedRows.slice(0, 5);

    // 5. Collect all errors
    const errors = invalidRows.flatMap((row) => row.errors);

    // 6. Prepare response
    const response: CSVValidationResponse = {
      valid: invalidRows.length === 0,
      total_rows: rows.length,
      valid_rows: validRows.length,
      invalid_rows: invalidRows.length,
      duplicates_found: duplicates.length,
      preview,
      errors,
      duplicates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in CSV validation API:', error);

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
