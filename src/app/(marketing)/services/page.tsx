/**
 * Services overview hub page
 * Lists all grooming services with dynamic pricing from Supabase
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Scissors, Sparkles, Check } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getBusinessInfo } from '@/lib/site-content';
import { SERVICE_SLUGS, SERVICE_CONFIGS } from '@/data/services';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CTABooking } from '@/components/common/CTABooking';

export const revalidate = 900;

export const metadata: Metadata = {
  title: 'Dog Grooming Services in La Mirada, CA',
  description:
    'Professional dog grooming services in La Mirada, CA. Bath, haircut, breed-specific styling, nail trimming, teeth brushing, deshedding & flea treatment. Book today!',
  alternates: {
    canonical: 'https://thepuppyday.com/services',
  },
  keywords: [
    'dog grooming services La Mirada',
    'pet grooming near me',
    'dog bath',
    'dog haircut',
    'breed specific grooming',
    'nail trimming dogs',
    'deshedding treatment',
  ],
};

const serviceIcons: Record<string, typeof Scissors> = {
  'dog-bath': Scissors,
  'dog-haircut': Sparkles,
  'breed-specific-styling': Sparkles,
  'nail-trimming': Check,
  'teeth-brushing': Check,
  deshedding: Check,
  'flea-tick-treatment': Check,
};

async function getServicesData() {
  const supabase = await createServerSupabaseClient();

  const [servicesRes, addonsRes, businessInfo] = await Promise.all([
    (supabase as any)
      .from('services')
      .select('*, prices:service_prices(*)')
      .eq('is_active', true)
      .order('display_order'),
    (supabase as any)
      .from('addons')
      .select('id, name, price, description')
      .eq('is_active', true)
      .order('display_order'),
    getBusinessInfo(),
  ]);

  return {
    services: servicesRes.data ?? [],
    addons: addonsRes.data ?? [],
    businessInfo,
  };
}

function getStartingPrice(
  slug: string,
  services: any[],
  addons: any[]
): number | null {
  const config = SERVICE_CONFIGS[slug as keyof typeof SERVICE_CONFIGS];
  if (!config) return null;

  if (config.pricingSource === 'service_prices') {
    const svc = services.find((s: any) =>
      s.name.toLowerCase().includes(config.dbServiceName!)
    );
    if (svc?.prices?.length > 0) {
      return Math.min(...svc.prices.map((p: any) => p.price));
    }
  } else if (config.addonName) {
    const addon = addons.find((a: any) => a.name === config.addonName);
    if (addon) return addon.price;
  }

  return null;
}

export default async function ServicesPage() {
  const { services, addons, businessInfo } = await getServicesData();

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Dog Grooming Services',
    itemListElement: SERVICE_SLUGS.map((slug, index) => {
      const config = SERVICE_CONFIGS[slug];
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: config.displayName,
        url: `https://thepuppyday.com/services/${slug}`,
      };
    }),
  };

  return (
    <div className="pb-8">
      <SchemaOrg schema={itemListSchema} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services' },
          ]}
        />
      </div>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Our Grooming Services"
            subtitle="Professional care tailored to your dog's breed, size, and coat type. Every session includes one-on-one attention in a calm, stress-free environment."
            className="mb-12"
          />

          {/* Main Services */}
          <h3 className="text-2xl font-bold text-[#434E54] mb-6">
            Full Grooming Packages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {SERVICE_SLUGS.filter(
              (slug) =>
                SERVICE_CONFIGS[slug].pricingSource === 'service_prices'
            ).map((slug) => {
              const config = SERVICE_CONFIGS[slug];
              const price = getStartingPrice(slug, services, addons);
              const Icon = serviceIcons[slug] ?? Scissors;
              return (
                <Link
                  key={slug}
                  href={`/services/${slug}`}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F8EEE5] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#434E54]" />
                    </div>
                    <h4 className="text-xl font-bold text-[#434E54]">
                      {config.displayName}
                    </h4>
                  </div>
                  <p className="text-[#6B7280] text-sm leading-relaxed mb-4 flex-grow">
                    {config.metaDescription.split('.')[0]}.
                  </p>
                  {price !== null ? (
                    <p className="text-lg font-semibold text-[#434E54]">
                      Starting from ${price}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* Add-on Services — pulled from database */}
          <h3 className="text-2xl font-bold text-[#434E54] mb-6">
            Add-On Services
          </h3>
          <p className="text-[#6B7280] mb-6">
            Enhance any grooming package or book as a standalone service.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {addons.map((addon: any) => {
              // Find matching SERVICE_CONFIG for detail page link (if exists)
              const matchingSlug = SERVICE_SLUGS.find(
                (slug) => SERVICE_CONFIGS[slug].addonName === addon.name
              );
              const Icon = matchingSlug
                ? (serviceIcons[matchingSlug] ?? Check)
                : Check;

              const cardContent = (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F8EEE5] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#434E54]" />
                    </div>
                    <h4 className="text-lg font-bold text-[#434E54]">
                      {addon.name}
                    </h4>
                  </div>
                  {addon.description ? (
                    <p className="text-[#6B7280] text-sm leading-relaxed mb-3 flex-grow">
                      {addon.description}
                    </p>
                  ) : (
                    <div className="flex-grow" />
                  )}
                  <p className="text-xl font-bold text-[#434E54]">
                    ${addon.price}
                  </p>
                </>
              );

              return matchingSlug ? (
                <Link
                  key={addon.id}
                  href={`/services/${matchingSlug}`}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={addon.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CTABooking phone={businessInfo.phone} />
    </div>
  );
}
