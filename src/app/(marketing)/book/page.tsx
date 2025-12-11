import { Suspense } from 'react';
import { BookingWizard } from '@/components/booking';

interface BookPageProps {
  searchParams: Promise<{ service?: string }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const preSelectedServiceId = params.service;

  return (
    <Suspense fallback={<BookingPageSkeleton />}>
      <BookingWizard preSelectedServiceId={preSelectedServiceId} />
    </Suspense>
  );
}

function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-base-200 animate-pulse">
      <div className="bg-base-100 border-b border-base-300 h-16" />
      <div className="bg-base-100 border-b border-base-300 h-20" />
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 bg-base-300 rounded-xl" />
      </div>
    </div>
  );
}

// Metadata
export const metadata = {
  title: 'Book Appointment | Puppy Day',
  description: 'Book your dog grooming appointment at Puppy Day in La Mirada, CA',
};
