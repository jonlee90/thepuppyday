/**
 * Booking page - Multi-step booking wizard
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { BookingWizard } from '@/components/booking/BookingWizard';

export const metadata: Metadata = {
  title: 'Book an Appointment | The Puppy Day',
  description:
    'Book a professional grooming appointment for your furry friend. Choose from our range of services and find the perfect time slot.',
  openGraph: {
    title: 'Book an Appointment | The Puppy Day',
    description:
      'Book a professional grooming appointment for your furry friend. Choose from our range of services and find the perfect time slot.',
  },
};

interface BookingPageProps {
  searchParams: Promise<{ service?: string }>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const preSelectedServiceId = params.service || undefined;

  return (
    <main className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-base-content text-center">
            Book Your Appointment
          </h1>
          <p className="text-base-content/70 text-center mt-2 max-w-2xl mx-auto">
            Follow the steps below to schedule a grooming session for your furry friend
          </p>
        </div>
      </div>

      {/* Wizard */}
      <div className="py-6 sm:py-10">
        <Suspense fallback={<BookingWizardSkeleton />}>
          <BookingWizard preSelectedServiceId={preSelectedServiceId} />
        </Suspense>
      </div>
    </main>
  );
}

function BookingWizardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Progress skeleton */}
      <div className="mb-8">
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-base-300 animate-pulse" />
              <div className="hidden sm:block w-16 h-4 bg-base-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-base-100 rounded-xl border border-base-300 p-6">
            <div className="h-8 bg-base-300 rounded w-1/3 animate-pulse mb-4" />
            <div className="h-4 bg-base-300 rounded w-2/3 animate-pulse mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-base-300 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Price summary skeleton */}
        <div className="hidden lg:block">
          <div className="bg-base-100 rounded-xl border border-base-300 p-6 sticky top-24">
            <div className="h-6 bg-base-300 rounded w-1/2 animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-base-300 rounded w-1/3 animate-pulse" />
                  <div className="h-4 bg-base-300 rounded w-1/4 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="border-t border-base-300 mt-6 pt-4">
              <div className="flex justify-between">
                <div className="h-5 bg-base-300 rounded w-1/4 animate-pulse" />
                <div className="h-6 bg-base-300 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
