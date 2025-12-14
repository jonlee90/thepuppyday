/**
 * Reviews API Route
 * POST /api/reviews
 *
 * Creates a new review with duplicate prevention.
 * Routes 4-5 star reviews to Google, 1-3 stars to private feedback.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { ReviewRating, ReviewDestination } from '@/types/review';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reviews
 *
 * Creates a new review for a report card.
 *
 * Request Body:
 * - reportCardId: string (required)
 * - rating: 1-5 (required)
 * - feedback: string (optional)
 * - destination: 'google' | 'private' (required)
 *
 * Response Codes:
 * - 200: Review created successfully
 * - 400: Bad request (invalid data or duplicate review)
 * - 404: Report card not found
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Parse request body
    const body = await request.json();
    const {
      reportCardId,
      rating,
      feedback,
      destination,
    } = body;

    // Validate required fields
    if (!reportCardId || !rating || !destination) {
      return NextResponse.json(
        { error: 'Missing required fields: reportCardId, rating, destination' },
        { status: 400 }
      );
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate destination
    if (destination !== 'google' && destination !== 'private') {
      return NextResponse.json(
        { error: 'Destination must be either "google" or "private"' },
        { status: 400 }
      );
    }

    // Fetch report card to get customer_id and appointment_id
    const { data: reportCard, error: reportCardError } = await (supabase as any)
      .from('report_cards')
      .select(`
        id,
        appointment_id,
        appointments!inner(
          customer_id
        )
      `)
      .eq('id', reportCardId)
      .single();

    if (reportCardError || !reportCard) {
      return NextResponse.json(
        { error: 'Report card not found' },
        { status: 404 }
      );
    }

    // Extract customer_id from the joined appointment data
    const appointment = reportCard.appointments as any;
    const customerId = appointment?.customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Unable to determine customer from report card' },
        { status: 404 }
      );
    }

    // Check for duplicate review (UNIQUE constraint on report_card_id)
    const { data: existingReview } = await (supabase as any)
      .from('reviews')
      .select('id')
      .eq('report_card_id', reportCardId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this report card' },
        { status: 400 }
      );
    }

    // Create the review
    const { data: review, error: insertError } = await (supabase as any)
      .from('reviews')
      .insert({
        report_card_id: reportCardId,
        user_id: customerId,
        appointment_id: reportCard.appointment_id,
        rating: rating as ReviewRating,
        feedback: feedback || null,
        destination: destination as ReviewDestination,
        is_public: false, // Admin can change this later
      })
      .select('id, destination')
      .single();

    if (insertError || !review) {
      console.error('Error creating review:', insertError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // If rating is 1-3, flag the appointment for admin follow-up
    if (rating <= 3) {
      // Create a customer flag for low rating
      await (supabase as any)
        .from('customer_flags')
        .insert({
          user_id: customerId,
          flag_type: 'low_rating',
          notes: `Customer gave ${rating}-star review. Feedback: ${feedback || 'No feedback provided'}`,
          flagged_by: customerId, // Self-flagged from review
          is_active: true,
        });
    }

    // Build success response
    const message = destination === 'google'
      ? 'Thank you for your review! Please share your experience on Google.'
      : 'Thank you for your feedback. We will review it and get back to you soon.';

    return NextResponse.json(
      {
        review_id: review.id,
        destination: review.destination,
        message,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
