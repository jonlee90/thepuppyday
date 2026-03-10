import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { ContactSection } from '@/components/marketing/ContactSection';
import { GoogleMapEmbed } from '@/components/common/GoogleMapEmbed';
import { getBusinessInfo } from '@/lib/site-content';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Contact Puppy Day - Dog Grooming in La Mirada, CA',
  description:
    'Contact Puppy Day for professional dog grooming in La Mirada, CA. Call (657) 252-2903 or visit us at 14936 Leffingwell Rd. Mon-Sat 9AM-5PM.',
  alternates: { canonical: 'https://thepuppyday.com/contact' },
};

export const revalidate = 900;

export default async function ContactPage() {
  const [businessInfo, supabase] = await Promise.all([
    getBusinessInfo(),
    createServerSupabaseClient(),
  ]);

  const { data: settings } = await (supabase as any)
    .from('settings')
    .select('value')
    .eq('key', 'business_hours')
    .single();

  const businessHours = settings?.value || {};
  const fullAddress = `${businessInfo.address}, ${businessInfo.city}, ${businessInfo.state} ${businessInfo.zip}`;

  return (
    <div>
      <SchemaOrg
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Puppy Day',
          description:
            'Contact information for Puppy Day dog grooming salon',
          url: 'https://thepuppyday.com/contact',
          mainEntity: {
            '@type': 'LocalBusiness',
            name: businessInfo.name,
            telephone: businessInfo.phone,
            email: businessInfo.email,
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
          items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
        />
      </div>

      <ContactSection
        phone={businessInfo.phone}
        email={businessInfo.email}
        address={fullAddress}
        businessHours={businessHours}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <GoogleMapEmbed
          query={fullAddress}
          className="max-w-3xl mx-auto shadow-md"
        />
      </div>
    </div>
  );
}
