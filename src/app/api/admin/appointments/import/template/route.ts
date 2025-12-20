/**
 * CSV Template Download API
 * GET /api/admin/appointments/import/template
 *
 * Returns a downloadable CSV template with headers and example rows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

/**
 * GET handler for downloading CSV template
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // CSV template with headers and example data
    const template = `customer_name,customer_email,customer_phone,pet_name,pet_breed,pet_size,pet_weight,service_name,date,time,addons,notes,payment_status,payment_method,amount_paid
Sarah Johnson,sarah@example.com,(657) 555-0123,Max,Golden Retriever,Large,55,Basic Grooming,2025-12-15,11:00 AM,Pawdicure,"Special grooming instructions",Pending,,
John Smith,john@example.com,(714) 555-0456,Bella,Poodle,Medium,25,Premium Grooming,2025-12-18,2:00 PM,"Teeth Brushing,Pawdicure",,Paid,Card,95.00
Emily Davis,emily@example.com,(562) 555-0789,Charlie,Labrador Retriever,Large,60,Basic Grooming,2025-12-20,9:30 AM,,,Deposit Paid,Cash,35.00`;

    // Return as downloadable CSV file
    return new NextResponse(template, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="appointment_import_template.csv"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error in template download API:', error);

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
