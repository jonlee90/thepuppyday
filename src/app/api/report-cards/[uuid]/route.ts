/**
 * Public Report Card API Route
 * GET /api/report-cards/[uuid]
 *
 * Fetches a report card by UUID and increments view tracking.
 * This route is public (no authentication required) for shareable links.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { PublicReportCard } from '@/types/report-card';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    uuid: string;
  }>;
}

/**
 * GET /api/report-cards/[uuid]
 *
 * Retrieves a public report card by its UUID and tracks view statistics.
 *
 * Response Codes:
 * - 200: Report card found and returned
 * - 404: Report card not found
 * - 410: Report card expired
 * - 500: Server error
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { uuid } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch report card with all joined data
    const { data: reportCard, error: fetchError } = await (supabase as any)
      .from('report_cards')
      .select(`
        id,
        appointment_id,
        mood,
        coat_condition,
        behavior,
        health_observations,
        groomer_notes,
        before_photo_url,
        after_photo_url,
        view_count,
        last_viewed_at,
        sent_at,
        expires_at,
        created_at,
        appointments!inner(
          id,
          scheduled_at,
          service_id,
          pet_id,
          services!inner(
            name
          ),
          pets!inner(
            name
          )
        )
      `)
      .eq('id', uuid)
      .eq('is_draft', false) // Only return non-draft report cards
      .single();

    if (fetchError || !reportCard) {
      return NextResponse.json(
        { error: 'Report card not found' },
        { status: 404 }
      );
    }

    // Check if report card is expired
    if (reportCard.expires_at) {
      const expiryDate = new Date(reportCard.expires_at);
      const now = new Date();

      if (expiryDate < now) {
        return NextResponse.json(
          {
            error: 'Report card has expired',
            expired_at: reportCard.expires_at
          },
          { status: 410 }
        );
      }
    }

    // Increment view count using the database function
    // This is done asynchronously and we don't wait for it to complete
    // to avoid blocking the response
    (supabase as any).rpc('increment_report_card_views', {
      report_card_uuid: uuid
    }).then(({ error }: any) => {
      if (error) {
        console.error('Failed to increment view count:', error);
      }
    });

    // Extract appointment data safely
    const appointment = reportCard.appointments as any;
    const service = appointment?.services;
    const pet = appointment?.pets;

    // Transform to public-facing format (no sensitive customer data)
    const publicReportCard: PublicReportCard = {
      id: reportCard.id,
      appointment_date: appointment?.scheduled_at || '',
      pet_name: pet?.name || 'Unknown',
      service_name: service?.name || 'Unknown Service',
      mood: reportCard.mood,
      coat_condition: reportCard.coat_condition,
      behavior: reportCard.behavior,
      health_observations: reportCard.health_observations || [],
      groomer_notes: reportCard.groomer_notes,
      before_photo_url: reportCard.before_photo_url,
      after_photo_url: reportCard.after_photo_url,
      created_at: reportCard.created_at,
    };

    return NextResponse.json(publicReportCard, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error fetching report card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
