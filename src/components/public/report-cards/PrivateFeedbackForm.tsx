'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface PrivateFeedbackFormProps {
  reportCardId: string;
  rating: number;
  onSubmitSuccess?: () => void;
}

/**
 * PrivateFeedbackForm - Private feedback collection for 1-3 star ratings
 * Collects detailed feedback to help improve service quality
 */
export function PrivateFeedbackForm({
  reportCardId,
  rating,
  onSubmitSuccess,
}: PrivateFeedbackFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportCardId,
          rating,
          feedback: feedback.trim() || null,
          destination: 'private',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit feedback');
      }

      setSubmitted(true);
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4 py-6"
        >
          <CheckCircle2
            className="w-16 h-16 text-[#6BCB77]"
            strokeWidth={1.5}
          />
          <p className="text-lg font-semibold text-[#434E54] text-center">
            Thank you! Your feedback helps us serve you better.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-[#434E54]">
              Thank you for your honest feedback.
            </p>
            <p className="text-[#6B7280]">
              We&apos;d love to hear more about your experience so we can
              improve.
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-[#434E54]">
                Tell us what we could do better (optional)
              </span>
              <span className="label-text-alt text-[#6B7280]">
                {feedback.length} / 500
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full h-24 rounded-lg focus:border-[#434E54] focus:outline-none"
              placeholder="Share any details that would help us improve your next visit..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
              maxLength={500}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-block"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                <span>Submitting...</span>
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
