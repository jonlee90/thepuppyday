'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface GoogleReviewRedirectProps {
  reportCardId: string;
  rating: number;
  onComplete?: () => void;
}

/**
 * GoogleReviewRedirect - Thank you message and Google review redirect for 4-5 star ratings
 * Saves rating to database before redirecting to Google Business review page
 */
export function GoogleReviewRedirect({
  reportCardId,
  rating,
  onComplete,
}: GoogleReviewRedirectProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRedirect = async () => {
    try {
      setIsSubmitting(true);

      // Save review rating to database
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportCardId,
          rating,
          destination: 'google',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save review');
      }

      // Open Google Review page in new tab
      // TODO: Configure NEXT_PUBLIC_GOOGLE_PLACE_ID in environment variables
      // Find Place ID: https://developers.google.com/maps/documentation/places/web-service/place-id
      const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || 'PLACE_ID_HERE';
      const googleUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
      window.open(googleUrl, '_blank', 'noopener,noreferrer');

      onComplete?.();
    } catch (error) {
      console.error('Error saving review:', error);
      // Still allow redirect even if API fails (graceful degradation)
      const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || 'PLACE_ID_HERE';
      const googleUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
      window.open(googleUrl, '_blank', 'noopener,noreferrer');
      onComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 text-center"
    >
      <p className="text-lg font-semibold text-[#434E54]">
        We&apos;re so glad you had a great experience! 🎉
      </p>
      <p className="text-[#6B7280]">
        Would you mind sharing your experience on Google? It helps other pet
        parents find us!
      </p>

      <button
        onClick={handleRedirect}
        disabled={isSubmitting}
        className="btn btn-primary btn-lg gap-2"
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner loading-sm" />
            <span>Opening Google...</span>
          </>
        ) : (
          <>
            <span>Leave a Google Review</span>
            <ExternalLink className="w-5 h-5" />
          </>
        )}
      </button>

      <div>
        <button onClick={onComplete} className="link link-primary text-sm">
          Maybe later
        </button>
      </div>
    </motion.div>
  );
}
