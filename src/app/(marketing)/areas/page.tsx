import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CTABooking } from '@/components/common/CTABooking';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { getBusinessInfo } from '@/lib/site-content';
import { CITY_CONFIGS, CITY_SLUGS } from '@/data/cities';
import type { CitySlug } from '@/data/cities';

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Areas We Serve - Dog Grooming Near You | Puppy Day La Mirada',
    description:
      "Puppy Day serves La Mirada and surrounding cities including Norwalk, Buena Park, Whittier, Cerritos, and more. Book your dog's grooming appointment today.",
    alternates: { canonical: 'https://thepuppyday.com/areas' },
  };
}

export default async function AreasPage() {
  const businessInfo = await getBusinessInfo();

  return (
    <div>
      <SchemaOrg
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Dog Grooming Service Areas',
          description: 'Cities served by Puppy Day dog grooming salon based in La Mirada, CA',
          url: 'https://thepuppyday.com/areas',
          itemListElement: CITY_SLUGS.map((slug, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: CITY_CONFIGS[slug as CitySlug].name,
            url: `https://thepuppyday.com/areas/${slug}`,
          })),
        }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Areas We Serve' }]} />
      </div>

      <section className="py-16 md:py-20 bg-[#F8EEE5]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#434E54] text-center mb-4">
            Dog Grooming Services Near You
          </h1>
          <p className="text-[#6B7280] text-center text-lg max-w-2xl mx-auto mb-12">
            Based in La Mirada, CA — we proudly serve families throughout the surrounding communities.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {CITY_SLUGS.map((slug) => {
              const config = CITY_CONFIGS[slug as CitySlug];
              const isHome = slug === 'la-mirada';
              return (
                <Link
                  key={slug}
                  href={`/areas/${slug}`}
                  className={`relative block bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow ${isHome ? 'border-2 border-[#C67C4E]' : ''}`}
                >
                  {isHome ? (
                    <span className="absolute top-4 right-4 bg-[#C67C4E] text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Our Home Base
                    </span>
                  ) : null}
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-[#C67C4E]" />
                    <h2 className="text-lg font-semibold text-[#434E54]">{config.name}, CA</h2>
                  </div>
                  {isHome ? null : (
                    <div className="flex items-center gap-1 text-sm text-[#6B7280] mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{config.distance} from our salon</span>
                    </div>
                  )}
                  <p className="text-[#6B7280] text-sm leading-relaxed line-clamp-2">
                    {config.metaDescription.slice(0, 100)}...
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <CTABooking phone={businessInfo.phone} />
    </div>
  );
}
