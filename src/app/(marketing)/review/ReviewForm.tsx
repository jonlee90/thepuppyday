'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star, ExternalLink, Heart, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

type SubmitState = 'idle' | 'submitting' | 'success';

interface SubmitResult {
  destination: 'google' | 'private';
  google_review_url: string | null;
  message: string;
}

export function ReviewForm() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointment');

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [result, setResult] = useState<SubmitResult | null>(null);

  if (!appointmentId) {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-md">
        <Heart className="w-12 h-12 text-[#D4A574] mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-[#434E54] mb-3">
          Thanks for Visiting!
        </h1>
        <p className="text-[#6B7280]">
          This review link appears to be invalid. If you&apos;d like to leave a review, please use the link from your grooming complete email.
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setSubmitState('submitting');

    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          rating,
          feedback: feedback.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setResult(data);
      setSubmitState('success');
      toast.success('Thank you for your review!');
    } catch (err) {
      console.error('[ReviewForm] Submit error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
      setSubmitState('idle');
    }
  }

  if (submitState === 'success' && result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-md"
      >
        <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-[#D4A574]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#434E54] mb-3">
          Thank You!
        </h2>
        <p className="text-[#6B7280] mb-6">{result.message}</p>

        {result.destination === 'google' && result.google_review_url && (
          <a
            href={result.google_review_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A574] text-white font-semibold rounded-xl hover:bg-[#c06b3a] transition-colors duration-200"
          >
            Share on Google
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </motion.div>
    );
  }

  const displayRating = hoveredRating || rating;

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-md">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-[#D4A574]" />
        </div>
        <h1 className="text-2xl font-semibold text-[#434E54] mb-2">
          How Was Your Visit?
        </h1>
        <p className="text-[#6B7280] text-sm">
          Your feedback helps us improve and helps other pet parents find us.
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-1 transition-transform hover:scale-110"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                star <= displayRating
                  ? 'text-[#D4A574] fill-[#D4A574]'
                  : 'text-[#E5E7EB]'
              }`}
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {rating > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Feedback Text */}
            <label
              htmlFor="feedback"
              className="block text-sm font-medium text-[#434E54] mb-1.5"
            >
              Tell us more <span className="text-[#6B7280] font-normal">(optional)</span>
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                rating >= 4
                  ? 'What did you love about your visit?'
                  : 'How can we do better next time?'
              }
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:border-transparent outline-none resize-none text-[#434E54] placeholder:text-[#434E54]/40 mb-4"
              maxLength={1000}
            />

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitState === 'submitting'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A574] text-white font-semibold rounded-xl hover:bg-[#c06b3a] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitState === 'submitting' ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Review
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
