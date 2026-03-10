/**
 * Dynamic service detail page
 * Generates static pages for all 7 service slugs with dynamic pricing
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SERVICE_SLUGS, SERVICE_CONFIGS, getServiceBySlug } from '@/data/services';
import { getServiceContent } from '@/data/service-content';
import { getServicePageData } from '@/lib/services/getServicePageData';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { ServiceDetailPage } from '@/components/marketing/ServiceDetailPage';

export const revalidate = 900;

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = getServiceBySlug(slug);
  if (!config) return {};

  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: {
      canonical: `https://thepuppyday.com/services/${slug}`,
    },
    keywords: [config.primaryKeyword, 'dog grooming La Mirada', config.displayName.toLowerCase()],
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getServicePageData(slug);
  if (!data) notFound();

  const content = getServiceContent(slug);
  if (!content) notFound();

  const { config, prices, addon, beforeAfterPairs, businessInfo } = data;

  // Build Service JSON-LD schema
  const serviceSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: config.displayName,
    description: config.metaDescription,
    url: `https://thepuppyday.com/services/${slug}`,
    provider: {
      '@type': 'LocalBusiness',
      name: businessInfo.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: businessInfo.address,
        addressLocality: businessInfo.city,
        addressRegion: businessInfo.state,
        postalCode: businessInfo.zip,
        addressCountry: 'US',
      },
    },
    areaServed: {
      '@type': 'City',
      name: 'La Mirada',
      containedInPlace: {
        '@type': 'State',
        name: 'California',
      },
    },
  };

  // Add pricing to schema
  if (addon) {
    serviceSchema.offers = {
      '@type': 'Offer',
      price: addon.price,
      priceCurrency: 'USD',
    };
  } else if (prices.length > 0) {
    const priceValues = prices.map((p) => p.price);
    serviceSchema.offers = {
      '@type': 'AggregateOffer',
      lowPrice: Math.min(...priceValues),
      highPrice: Math.max(...priceValues),
      priceCurrency: 'USD',
    };
  }

  // Build related services data
  const relatedServices = content.relatedServiceSlugs
    .map((rs) => {
      const rsConfig = SERVICE_CONFIGS[rs];
      return rsConfig ? { slug: rs, displayName: rsConfig.displayName } : null;
    })
    .filter((rs): rs is { slug: string; displayName: string } => rs !== null);

  return (
    <div>
      <SchemaOrg schema={serviceSchema} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: config.displayName },
          ]}
        />
      </div>

      <ServiceDetailPage
        config={config}
        content={content}
        prices={prices}
        addon={addon}
        beforeAfterPairs={beforeAfterPairs}
        relatedServices={relatedServices}
        phone={businessInfo.phone}
      />
    </div>
  );
}
