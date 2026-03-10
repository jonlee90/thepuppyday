import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CTABooking } from '@/components/common/CTABooking';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';
import { getBusinessInfo } from '@/lib/site-content';

export const revalidate = 900;

export const metadata: Metadata = {
  title: 'Customer Reviews - 5-Star Dog Grooming',
  description:
    'Read customer reviews of Puppy Day dog grooming in La Mirada, CA. Rated 5.0 stars on Yelp with 16 reviews. See why pet parents love us.',
  alternates: { canonical: 'https://thepuppyday.com/reviews' },
};

export default async function ReviewsPage() {
  const businessInfo = await getBusinessInfo();

  return (
    <div>
      <SchemaOrg
        schema={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: businessInfo.name,
          url: 'https://thepuppyday.com',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '5.0',
            reviewCount: '16',
            bestRating: '5',
            worstRating: '1',
          },
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Reviews' }]}
        />
      </div>

      <TestimonialsSection />

      {/* Encourage reviews section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-semibold text-[#434E54] mb-3">
              Love Your Experience?
            </h2>
            <p className="text-[#6B7280] mb-6">
              We&apos;d love to hear about your visit! Share your experience on
              Yelp and help other pet parents find us.
            </p>
            <a
              href="https://www.yelp.com/biz/puppy-day-la-mirada"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D32323] text-white font-semibold rounded-xl hover:bg-[#af1d1d] transition-colors duration-200"
            >
              Write a Review on Yelp
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <CTABooking phone={businessInfo.phone} />
    </div>
  );
}
