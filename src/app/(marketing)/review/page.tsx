import type { Metadata } from 'next';
import { ReviewForm } from './ReviewForm';

export const metadata: Metadata = {
  title: 'Rate Your Experience - Puppy Day',
  description: 'Share your grooming experience at Puppy Day in La Mirada, CA.',
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <ReviewForm />
    </div>
  );
}
