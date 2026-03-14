import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CITY_SLUGS, CITY_CONFIGS } from '@/data/cities';
import type { CitySlug } from '@/data/cities';
import { CITY_CONTENT } from '@/data/city-content';
import { SERVICE_CONFIGS } from '@/data/services';
import { getBusinessInfo } from '@/lib/site-content';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CityLandingPage } from '@/components/marketing/CityLandingPage';

export const revalidate = 900;

export function generateStaticParams() {
  return CITY_SLUGS.map((slug) => ({ city: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const config = CITY_CONFIGS[city as CitySlug];
  if (!config) return {};
  return {
    title: `Dog Grooming in ${config.name}, CA | Puppy Day`,
    description: config.metaDescription,
    alternates: { canonical: `https://thepuppyday.com/dog-grooming/${city}` },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const config = CITY_CONFIGS[city as CitySlug];
  if (!config) notFound();

  const cityContent = CITY_CONTENT[city as CitySlug];
  if (!cityContent) notFound();

  const [businessInfo, supabase] = await Promise.all([
    getBusinessInfo(),
    createServerSupabaseClient(),
  ]);

  const { data: servicesData } = await (supabase as any)
    .from('services')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('display_order');

  const services = ((servicesData as Array<{ id: string; name: string; slug: string }>) || []).map(
    (s) => {
      const match = Object.entries(SERVICE_CONFIGS).find(
        ([, cfg]) => cfg.dbServiceName === s.name
      );
      return {
        name: match ? match[1].displayName : s.name,
        slug: match ? match[0] : s.name.toLowerCase().replace(/\s+/g, '-'),
      };
    }
  );

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'PetGroomer',
    name: businessInfo.name,
    url: `https://thepuppyday.com/dog-grooming/${city}`,
    telephone: businessInfo.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessInfo.address,
      addressLocality: businessInfo.city,
      addressRegion: businessInfo.state,
      postalCode: businessInfo.zip,
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: config.name,
      containedInPlace: { '@type': 'State', name: 'California' },
    },
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '16',
    },
  };

  return (
    <div>
      <SchemaOrg schema={schema} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Areas We Serve', href: '/dog-grooming' },
            { label: config.name },
          ]}
        />
      </div>
      <CityLandingPage
        cityConfig={config}
        cityContent={cityContent}
        services={services}
        businessInfo={businessInfo}
      />
    </div>
  );
}
