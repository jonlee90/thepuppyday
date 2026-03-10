import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CTABooking } from '@/components/common/CTABooking';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { AboutSection } from '@/components/marketing/AboutSection';
import { getBusinessInfo } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'About Puppy Day - Family-Run Dog Grooming in La Mirada',
  description:
    'Learn about Puppy Day, a family-run dog grooming salon in La Mirada, CA. We use warm water and premium hypoallergenic products for every session.',
  alternates: { canonical: 'https://thepuppyday.com/about' },
};

export const revalidate = 900;

export default async function AboutPage() {
  const businessInfo = await getBusinessInfo();

  return (
    <div>
      <SchemaOrg
        schema={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Puppy Day',
          description: 'Family-run dog grooming salon in La Mirada, CA',
          url: 'https://thepuppyday.com/about',
          mainEntity: {
            '@type': 'LocalBusiness',
            name: businessInfo.name,
            telephone: businessInfo.phone,
            address: {
              '@type': 'PostalAddress',
              streetAddress: businessInfo.address,
              addressLocality: businessInfo.city,
              addressRegion: businessInfo.state,
              postalCode: businessInfo.zip,
              addressCountry: 'US',
            },
          },
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]}
        />
      </div>

      <AboutSection
        title="About Puppy Day"
        description="At The Puppy Day, we're a family-run grooming salon that believes every dog deserves to feel comfortable and look their best. Our La Mirada studio was designed to feel like a second home for your pup — we use warm water and premium hypoallergenic products during every session."
      />

      <CTABooking phone={businessInfo.phone} />
    </div>
  );
}
