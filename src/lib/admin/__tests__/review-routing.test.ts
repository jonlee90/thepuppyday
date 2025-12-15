/**
 * Unit tests for review routing logic
 * Task 0076: Test review routing (4-5 stars → Google, 1-3 stars → private)
 */

import { describe, it, expect } from 'vitest';
import type { ReviewRating, ReviewDestination } from '@/types/review';

describe('review-routing', () => {
  /**
   * Determine review destination based on rating
   * 4-5 stars → Google Reviews
   * 1-3 stars → Private feedback
   */
  function determineReviewDestination(rating: ReviewRating): ReviewDestination {
    return rating >= 4 ? 'google' : 'private';
  }

  describe('rating to destination mapping', () => {
    it('should route 5-star review to Google', () => {
      const rating: ReviewRating = 5;
      const destination = determineReviewDestination(rating);

      expect(destination).toBe('google');
    });

    it('should route 4-star review to Google', () => {
      const rating: ReviewRating = 4;
      const destination = determineReviewDestination(rating);

      expect(destination).toBe('google');
    });

    it('should route 3-star review to private feedback', () => {
      const rating: ReviewRating = 3;
      const destination = determineReviewDestination(rating);

      expect(destination).toBe('private');
    });

    it('should route 2-star review to private feedback', () => {
      const rating: ReviewRating = 2;
      const destination = determineReviewDestination(rating);

      expect(destination).toBe('private');
    });

    it('should route 1-star review to private feedback', () => {
      const rating: ReviewRating = 1;
      const destination = determineReviewDestination(rating);

      expect(destination).toBe('private');
    });
  });

  describe('public visibility logic', () => {
    it('should set is_public to true for Google reviews', () => {
      const rating: ReviewRating = 5;
      const destination = determineReviewDestination(rating);
      const is_public = destination === 'google';

      expect(is_public).toBe(true);
    });

    it('should set is_public to true for 4-star reviews', () => {
      const rating: ReviewRating = 4;
      const destination = determineReviewDestination(rating);
      const is_public = destination === 'google';

      expect(is_public).toBe(true);
    });

    it('should set is_public to false for private feedback', () => {
      const rating: ReviewRating = 3;
      const destination = determineReviewDestination(rating);
      const is_public = destination === 'google';

      expect(is_public).toBe(false);
    });

    it('should set is_public to false for 1-star reviews', () => {
      const rating: ReviewRating = 1;
      const destination = determineReviewDestination(rating);
      const is_public = destination === 'google';

      expect(is_public).toBe(false);
    });
  });

  describe('Google review URL generation', () => {
    it('should include Google review URL for 5-star reviews', () => {
      const rating: ReviewRating = 5;
      const destination = determineReviewDestination(rating);
      const google_review_url = destination === 'google'
        ? 'https://search.google.com/local/writereview?placeid=PLACE_ID'
        : null;

      expect(google_review_url).not.toBeNull();
      expect(google_review_url).toContain('google.com');
    });

    it('should include Google review URL for 4-star reviews', () => {
      const rating: ReviewRating = 4;
      const destination = determineReviewDestination(rating);
      const google_review_url = destination === 'google'
        ? 'https://search.google.com/local/writereview?placeid=PLACE_ID'
        : null;

      expect(google_review_url).not.toBeNull();
    });

    it('should not include Google review URL for 3-star reviews', () => {
      const rating: ReviewRating = 3;
      const destination = determineReviewDestination(rating);
      const google_review_url = destination === 'google'
        ? 'https://search.google.com/local/writereview?placeid=PLACE_ID'
        : null;

      expect(google_review_url).toBeNull();
    });

    it('should not include Google review URL for low ratings', () => {
      const rating: ReviewRating = 1;
      const destination = determineReviewDestination(rating);
      const google_review_url = destination === 'google'
        ? 'https://search.google.com/local/writereview?placeid=PLACE_ID'
        : null;

      expect(google_review_url).toBeNull();
    });
  });

  describe('review submission response', () => {
    it('should return Google destination for 5-star review', () => {
      const rating: ReviewRating = 5;
      const destination = determineReviewDestination(rating);

      const response = {
        review_id: 'review-123',
        destination,
        google_review_url: destination === 'google'
          ? 'https://search.google.com/local/writereview?placeid=PLACE_ID'
          : undefined,
        message: destination === 'google'
          ? 'Thank you for your feedback! Please share your experience on Google.'
          : 'Thank you for your feedback. We appreciate your input.',
      };

      expect(response.destination).toBe('google');
      expect(response.google_review_url).toBeDefined();
      expect(response.message).toContain('Google');
    });

    it('should return private destination for 3-star review', () => {
      const rating: ReviewRating = 3;
      const destination = determineReviewDestination(rating);

      const response = {
        review_id: 'review-123',
        destination,
        google_review_url: destination === 'google'
          ? 'https://search.google.com/local/writereview?placeid=PLACE_ID'
          : undefined,
        message: destination === 'google'
          ? 'Thank you for your feedback! Please share your experience on Google.'
          : 'Thank you for your feedback. We appreciate your input.',
      };

      expect(response.destination).toBe('private');
      expect(response.google_review_url).toBeUndefined();
      expect(response.message).not.toContain('Google');
    });
  });

  describe('rating distribution', () => {
    it('should correctly categorize ratings for statistics', () => {
      const reviews = [
        { rating: 5 as ReviewRating },
        { rating: 5 as ReviewRating },
        { rating: 4 as ReviewRating },
        { rating: 3 as ReviewRating },
        { rating: 2 as ReviewRating },
      ];

      const distribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      reviews.forEach((review) => {
        distribution[review.rating]++;
      });

      expect(distribution[5]).toBe(2);
      expect(distribution[4]).toBe(1);
      expect(distribution[3]).toBe(1);
      expect(distribution[2]).toBe(1);
      expect(distribution[1]).toBe(0);
    });

    it('should calculate Google vs private counts correctly', () => {
      const reviews = [
        { rating: 5 as ReviewRating },
        { rating: 4 as ReviewRating },
        { rating: 4 as ReviewRating },
        { rating: 3 as ReviewRating },
        { rating: 2 as ReviewRating },
      ];

      let google_reviews = 0;
      let private_feedback = 0;

      reviews.forEach((review) => {
        const destination = determineReviewDestination(review.rating);
        if (destination === 'google') {
          google_reviews++;
        } else {
          private_feedback++;
        }
      });

      expect(google_reviews).toBe(3); // 5, 4, 4
      expect(private_feedback).toBe(2); // 3, 2
    });
  });

  describe('average rating calculation', () => {
    it('should calculate average rating correctly', () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
      ];

      const sum = reviews.reduce((total, review) => total + review.rating, 0);
      const average = sum / reviews.length;

      expect(average).toBe(4.25);
    });

    it('should handle single review', () => {
      const reviews = [{ rating: 5 }];

      const sum = reviews.reduce((total, review) => total + review.rating, 0);
      const average = sum / reviews.length;

      expect(average).toBe(5);
    });

    it('should handle all 5-star reviews', () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
      ];

      const sum = reviews.reduce((total, review) => total + review.rating, 0);
      const average = sum / reviews.length;

      expect(average).toBe(5);
    });

    it('should round average to 2 decimal places', () => {
      const reviews = [
        { rating: 5 },
        { rating: 3 },
        { rating: 4 },
      ];

      const sum = reviews.reduce((total, review) => total + review.rating, 0);
      const average = Math.round((sum / reviews.length) * 100) / 100;

      expect(average).toBe(4);
    });
  });

  describe('response rate calculation', () => {
    it('should calculate response rate correctly', () => {
      const reviews = [
        { responded_at: '2024-01-15' },
        { responded_at: null },
        { responded_at: '2024-01-16' },
        { responded_at: null },
      ];

      const responded_count = reviews.filter((r) => r.responded_at !== null).length;
      const response_rate = (responded_count / reviews.length) * 100;

      expect(response_rate).toBe(50);
    });

    it('should return 100% when all reviews are responded', () => {
      const reviews = [
        { responded_at: '2024-01-15' },
        { responded_at: '2024-01-16' },
      ];

      const responded_count = reviews.filter((r) => r.responded_at !== null).length;
      const response_rate = (responded_count / reviews.length) * 100;

      expect(response_rate).toBe(100);
    });

    it('should return 0% when no reviews are responded', () => {
      const reviews = [
        { responded_at: null },
        { responded_at: null },
      ];

      const responded_count = reviews.filter((r) => r.responded_at !== null).length;
      const response_rate = (responded_count / reviews.length) * 100;

      expect(response_rate).toBe(0);
    });
  });
});
