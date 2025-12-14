/**
 * Review types for The Puppy Day
 * Phase 6: Customer Reviews & Feedback Routing
 */

import type { BaseEntity, User, Appointment, ReportCard } from "./database";

/**
 * Review rating (1-5 stars)
 */
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

/**
 * Review routing destination based on rating
 * 4-5 stars → Google Reviews
 * 1-3 stars → Private feedback
 */
export type ReviewDestination = "google" | "private";

/**
 * Customer review entity
 * Linked to report card and appointment
 */
export interface Review extends BaseEntity {
  report_card_id: string;
  user_id: string;
  appointment_id: string;
  rating: ReviewRating;
  feedback: string | null;
  is_public: boolean;
  destination: ReviewDestination;
  google_review_url: string | null;
  responded_at: string | null;
  response_text: string | null;
  // Joined data
  report_card?: ReportCard;
  user?: User;
  appointment?: Appointment;
}

/**
 * Input for creating a new review
 */
export interface CreateReviewInput {
  report_card_id: string;
  user_id: string;
  appointment_id: string;
  rating: ReviewRating;
  feedback?: string;
}

/**
 * Input for updating a review (admin response)
 */
export interface UpdateReviewInput {
  response_text?: string;
  is_public?: boolean;
}

/**
 * Review with report card and appointment details
 * Used in admin panel for comprehensive view
 */
export interface ReviewWithReportCard extends Review {
  report_card: ReportCard;
  appointment: Appointment;
  customer_name: string;
  pet_name: string;
  service_name: string;
}

/**
 * Review statistics for analytics
 */
export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  google_reviews: number;
  private_feedback: number;
  response_rate: number;
}

/**
 * Review submission response
 * Includes routing information for frontend
 */
export interface ReviewSubmissionResponse {
  review_id: string;
  destination: ReviewDestination;
  google_review_url?: string;
  message: string;
}
