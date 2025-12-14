'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { StarRatingSelector } from './StarRatingSelector';
import { GoogleReviewRedirect } from './GoogleReviewRedirect';
import { PrivateFeedbackForm } from './PrivateFeedbackForm';

interface ReviewPromptProps {
  reportCardId: string;
  hasExistingReview: boolean;
  onSubmitSuccess?: () => void;
}

/**
 * ReviewPrompt - Main review orchestration component
 * Displays star rating selector and routes to appropriate feedback flow:
 * - 4-5 stars: Google Review redirect
 * - 1-3 stars: Private feedback form
 * - Already reviewed: Thank you message
 */
export function ReviewPrompt({
  reportCardId,
  hasExistingReview,
  onSubmitSuccess,
}: ReviewPromptProps) {
  const [rating, setRating] = useState(0);

  if (hasExistingReview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl shadow-md p-6 lg:p-8 max-w-2xl mx-auto my-12"
      >
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2
            className="w-16 h-16 text-[#6BCB77]"
            strokeWidth={1.5}
          />
          <p className="text-lg text-[#6B7280] text-center">
            Thank you for your feedback! We appreciate you taking the time to
            share your experience.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-md p-6 lg:p-8 max-w-2xl mx-auto my-12"
    >
      <h3 className="text-2xl lg:text-3xl font-bold text-[#434E54] text-center mb-6">
        How was your grooming experience?
      </h3>

      <StarRatingSelector value={rating} onChange={setRating} />

      <AnimatePresence mode="wait">
        {rating >= 4 && (
          <motion.div
            key="google"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 overflow-hidden"
          >
            <GoogleReviewRedirect
              reportCardId={reportCardId}
              rating={rating}
              onComplete={onSubmitSuccess}
            />
          </motion.div>
        )}

        {rating > 0 && rating <= 3 && (
          <motion.div
            key="private"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 overflow-hidden"
          >
            <PrivateFeedbackForm
              reportCardId={reportCardId}
              rating={rating}
              onSubmitSuccess={onSubmitSuccess}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
