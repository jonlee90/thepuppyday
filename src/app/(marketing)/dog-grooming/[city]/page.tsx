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

  const [servicesRes, reviewsRes, settingsRes] = await Promise.all([
    (supabase as any)
      .from('services')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('display_order'),
    (supabase as any)
      .from('reviews')
      .select('rating')
      .eq('is_public', true)
      .not('rating', 'is', null),
    (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'business_hours')
      .single(),
  ]);

  const servicesData = servicesRes.data;

  const publicReviews = (reviewsRes.data as Array<{ rating: number }>) || [];
  const reviewStats = publicReviews.length > 0
    ? {
        count: publicReviews.length,
        average: publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length,
      }
    : null;

  const businessHours = settingsRes.data?.value || {};

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
    '@type': 'LocalBusiness',
    additionalType: 'https://schema.org/PetGroomer',
    '@id': `https://thepuppyday.com/dog-grooming/${city}`,
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
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '33.9172',
      longitude: '-118.0120',
    },
    areaServed: {
      '@type': 'City',
      name: config.name,
      containedInPlace: { '@type': 'State', name: 'California' },
    },
    priceRange: '$$',
    ...(reviewStats ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewStats.average.toFixed(1),
        reviewCount: reviewStats.count,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Dog Grooming Services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          url: `https://thepuppyday.com/services/${s.slug}`,
        },
      })),
    },
    openingHoursSpecification: businessHours
      ? Object.entries(businessHours).map(([day, hours]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
          opens: (hours as { is_open?: boolean; open?: string; close?: string }).is_open ? (hours as { is_open?: boolean; open?: string; close?: string }).open : undefined,
          closes: (hours as { is_open?: boolean; open?: string; close?: string }).is_open ? (hours as { is_open?: boolean; open?: string; close?: string }).close : undefined,
        }))
      : [],
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
