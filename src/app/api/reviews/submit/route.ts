/**
 * Reviews Submit API Route
 * POST /api/reviews/submit
 *
 * Creates a review directly from an appointment (no report card required).
 * Used by the /review page linked from grooming complete emails.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { ReviewRating, ReviewDestination } from '@/types/review';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, rating, feedback } = body;

    if (!appointmentId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: appointmentId, rating' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceRoleClient();

    // Fetch appointment to get customer_id
    const { data: appointment, error: apptError } = await (serviceClient as any)
      .from('appointments')
      .select('id, customer_id')
      .eq('id', appointmentId)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check for existing review for this appointment
    const { data: existingReview } = await (serviceClient as any)
      .from('reviews')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this appointment' },
        { status: 400 }
      );
    }

    // Route based on rating: 4-5 stars → google, 1-3 → private
    const destination: ReviewDestination = rating >= 4 ? 'google' : 'private';

    // Check if a report card exists for this appointment
    const { data: reportCard } = await (serviceClient as any)
      .from('report_cards')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single();

    // Create the review
    const { data: review, error: insertError } = await (serviceClient as any)
      .from('reviews')
      .insert({
        report_card_id: reportCard?.id || null,
        user_id: appointment.customer_id,
        appointment_id: appointmentId,
        rating: rating as ReviewRating,
        feedback: feedback || null,
        destination,
        is_public: rating >= 4, // Auto-publish positive reviews
      })
      .select('id, destination')
      .single();

    if (insertError || !review) {
      console.error('[ReviewsSubmit] Error creating review:', insertError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Flag low ratings for admin follow-up
    if (rating <= 3) {
      await (serviceClient as any)
        .from('customer_flags')
        .insert({
          user_id: appointment.customer_id,
          flag_type: 'low_rating',
          notes: `Customer gave ${rating}-star review. Feedback: ${feedback || 'No feedback provided'}`,
          flagged_by: appointment.customer_id,
          is_active: true,
        });
    }

    const googleReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || 'https://g.page/r/CbbCwxWs-HjiEAE';

    return NextResponse.json({
      review_id: review.id,
      destination: review.destination,
      google_review_url: destination === 'google' ? googleReviewUrl : null,
      message: destination === 'google'
        ? 'Thank you! Would you also share your experience on Google?'
        : 'Thank you for your feedback!',
    });
  } catch (error) {
    console.error('[ReviewsSubmit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
