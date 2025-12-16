/**
 * Admin Report Card Send/Resend API Route
 * POST /api/admin/report-cards/[id]/send
 *
 * Allows admins to manually send or resend report cards to customers.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/admin/report-cards/[id]/send
 *
 * Manually send or resend a report card notification.
 *
 * Request Body:
 * - action: 'send' | 'resend'
 *
 * Response Codes:
 * - 200: Report card sent successfully
 * - 400: Invalid request (draft, dont_send flag, etc.)
 * - 403: Unauthorized (not admin)
 * - 404: Report card not found
 * - 500: Server error
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check admin authorization
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: reportCardId } = await params;
    const body = await request.json();
    const { action } = body;

    // Validate action
    if (!action || !['send', 'resend'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "send" or "resend".' },
        { status: 400 }
      );
    }

    // Fetch report card
    const { data: reportCard, error: fetchError } = await (supabase as any)
      .from('report_cards')
      .select('id, appointment_id, is_draft, dont_send, sent_at')
      .eq('id', reportCardId)
      .single();

    if (fetchError || !reportCard) {
      return NextResponse.json(
        { error: 'Report card not found' },
        { status: 404 }
      );
    }

    // Validate report card state
    if (reportCard.is_draft) {
      return NextResponse.json(
        { error: 'Cannot send draft report cards. Finish editing first.' },
        { status: 400 }
      );
    }

    if (reportCard.dont_send) {
      return NextResponse.json(
        {
          error:
            'Sending is disabled for this report card. Update preferences to enable.',
        },
        { status: 400 }
      );
    }

    // For 'send' action, verify it hasn't been sent before
    if (action === 'send' && reportCard.sent_at) {
      return NextResponse.json(
        { error: 'Report card has already been sent. Use "resend" instead.' },
        { status: 400 }
      );
    }

    // For 'resend' action, verify it has been sent before
    if (action === 'resend' && !reportCard.sent_at) {
      return NextResponse.json(
        { error: 'Report card has not been sent yet. Use "send" instead.' },
        { status: 400 }
      );
    }

    // Send the report card notification using new trigger (Task 0109)
    try {
      // Fetch appointment with customer and pet details
      const { data: appointment, error: appointmentError } = await (supabase as any)
        .from('appointments')
        .select(
          `
          *,
          customer:users!customer_id(id, first_name, last_name, email, phone),
          pet:pets!pet_id(id, name)
        `
        )
        .eq('id', reportCard.appointment_id)
        .single();

      if (appointmentError || !appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      // Get report card images
      const { data: fullReportCard } = await (supabase as any)
        .from('report_cards')
        .select('before_photo_url, after_photo_url')
        .eq('id', reportCard.id)
        .single();

      const { triggerReportCardCompletion } = await import(
        '@/lib/notifications/triggers'
      );

      const result = await triggerReportCardCompletion(supabase, {
        reportCardId: reportCard.id,
        appointmentId: reportCard.appointment_id,
        customerId: appointment.customer.id,
        customerEmail: appointment.customer.email,
        customerPhone: appointment.customer.phone,
        petName: appointment.pet.name,
        beforeImageUrl: fullReportCard?.before_photo_url,
        afterImageUrl: fullReportCard?.after_photo_url,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.errors.length > 0
              ? result.errors.join(', ')
              : 'Failed to send report card',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `Report card ${action === 'resend' ? 'resent' : 'sent'} successfully`,
          sms_sent: result.smsSent,
          email_sent: result.emailSent,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('[Report Card Send] Error sending notification:', error);
      return NextResponse.json(
        { error: 'Failed to send report card notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending report card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
