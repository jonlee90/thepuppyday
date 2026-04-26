/**
 * Appointment Completed Webhook
 * Task 0021: Triggered when appointment status changes to "completed"
 * POST /api/webhooks/appointment-completed
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { scheduleReportCardNotification } from '@/lib/admin/report-card-scheduler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Parse request body
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
        { status: 400 }
      );
    }

    console.log('[Webhook] Appointment completed:', appointmentId);

    // Verify appointment exists and is completed
    const appointmentResult = await (supabase as any)
      .from('appointments')
      .select('id, status')
      .eq('id', appointmentId)
      .single();

    if (appointmentResult.error || !appointmentResult.data) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointmentResult.data.status !== 'completed') {
      return NextResponse.json(
        { error: 'Appointment is not completed' },
        { status: 400 }
      );
    }

    // Find associated report card
    const reportCardResult = await (supabase as any)
      .from('report_cards')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single();

    if (reportCardResult.error || !reportCardResult.data) {
      console.log('[Webhook] No report card found for appointment:', appointmentId);
      return NextResponse.json(
        { message: 'No report card found for this appointment' },
        { status: 200 }
      );
    }

    const reportCardId = reportCardResult.data.id;

    // Schedule report card notification asynchronously without blocking the
    // webhook response. Wrap in self-contained try/catch so any rejection
    // (or synchronous throw in the async chain) cannot escape and crash the
    // Node process.
    (async () => {
      try {
        const result = await scheduleReportCardNotification(supabase, reportCardId, appointmentId);
        console.log('[Webhook] Notification scheduled:', {
          reportCardId,
          success: result.success,
          emailSent: result.emailSent,
          smsSent: result.smsSent,
          errors: result.errors,
        });
      } catch (error) {
        console.error('[Webhook] Error scheduling notification:', error);
      }
    })();

    return NextResponse.json(
      {
        success: true,
        message: 'Report card notification scheduled',
        reportCardId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Webhook] Error processing appointment-completed webhook:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
