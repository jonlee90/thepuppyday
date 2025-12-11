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
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7] animate-pulse">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 h-16" />
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 h-20" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="h-96 bg-white rounded-2xl shadow-lg" />
      </div>
    </div>
  );
}

// Metadata
export const metadata = {
  title: 'Book Appointment | Puppy Day',
  description: 'Book your dog grooming appointment at Puppy Day in La Mirada, CA',
};
