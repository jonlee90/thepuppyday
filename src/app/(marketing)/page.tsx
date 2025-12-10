/**
 * Marketing homepage - integrates all marketing components
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { HeroSection } from '@/components/marketing/hero-section';
import { PromoBanner } from '@/components/marketing/promo-banner';
import { ServiceGrid } from '@/components/marketing/service-grid';
import { BeforeAfterCarousel } from '@/components/marketing/before-after-carousel';
import { GalleryGrid } from '@/components/marketing/gallery-grid';
import { AboutSection } from '@/components/marketing/about-section';
import { ContactSection } from '@/components/marketing/contact-section';
import type {
  Service,
  PromoBanner as PromoBannerType,
  BeforeAfterPair,
  GalleryImage,
  SiteContent,
} from '@/types/database';

// SEO Metadata
export const metadata: Metadata = {
  title: 'The Puppy Day - Professional Pet Grooming in La Mirada, CA',
  description: 'Premium pet grooming services in La Mirada, CA. Expert care for your furry friends with basic grooming, spa treatments, and specialized puppy services. Book your appointment today!',
  keywords: [
    'pet grooming',
    'dog grooming',
    'La Mirada pet grooming',
    'professional pet care',
    'dog spa',
    'puppy grooming',
    'pet salon',
    'La Mirada CA',
  ],
  authors: [{ name: 'The Puppy Day' }],
  openGraph: {
    title: 'The Puppy Day - Professional Pet Grooming',
    description: 'Premium pet grooming services with expert care for your furry friends. Located in La Mirada, CA.',
    url: 'https://thepuppyday.com',
    siteName: 'The Puppy Day',
    images: [
      {
        url: 'https://placedog.net/1200/630?id=og',
        width: 1200,
        height: 630,
        alt: 'The Puppy Day - Professional Pet Grooming',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Puppy Day - Professional Pet Grooming',
    description: 'Premium pet grooming services with expert care for your furry friends.',
    images: ['https://placedog.net/1200/630?id=twitter'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

async function getMarketingData() {
  const supabase = await createServerSupabaseClient();

  const [
    servicesRes,
    bannersRes,
    beforeAfterRes,
    galleryRes,
    contentRes,
    settingsRes,
  ] = await Promise.all([
    (supabase as any).from('services').select('*').eq('is_active', true).order('display_order'),
    (supabase as any).from('promo_banners').select('*').order('display_order'),
    (supabase as any).from('before_after_pairs').select('*').order('display_order'),
    (supabase as any).from('gallery_images').select('*').eq('is_published', true).order('display_order'),
    (supabase as any).from('site_content').select('*'),
    (supabase as any).from('settings').select('*').single(),
  ]);

  // Helper to get site content by key
  const getContent = (key: string): string => {
    const item = (contentRes.data as SiteContent[])?.find((c) => c.key === key);
    return item ? String(item.content) : '';
  };

  // Helper to get parsed JSON content
  const getJSONContent = (key: string): string[] => {
    const item = (contentRes.data as SiteContent[])?.find((c) => c.key === key);
    if (!item) return [];
    try {
      return JSON.parse(String(item.content));
    } catch {
      return [];
    }
  };

  return {
    services: (servicesRes.data as Service[]) || [],
    banners: (bannersRes.data as PromoBannerType[]) || [],
    beforeAfterPairs: (beforeAfterRes.data as BeforeAfterPair[]) || [],
    galleryImages: (galleryRes.data as GalleryImage[]) || [],
    heroHeadline: getContent('hero_headline'),
    heroTagline: getContent('hero_tagline'),
    heroImageUrl: getContent('hero_image_url'),
    aboutTitle: getContent('about_title'),
    aboutDescription: getContent('about_description'),
    aboutDifferentiators: getJSONContent('about_differentiators'),
    businessHours: (settingsRes.data as any)?.business_hours || {},
  };
}

export default async function MarketingPage() {
  const data = await getMarketingData();

  return (
    <>
      {/* Promotional Banner */}
      {data.banners.length > 0 && <PromoBanner banners={data.banners} />}

      {/* Hero Section */}
      <HeroSection
        headline={data.heroHeadline || 'Your Pet Deserves the Best'}
        tagline={data.heroTagline || 'Professional grooming with a gentle touch'}
        imageUrl={data.heroImageUrl || 'https://placedog.net/1920/1080?id=hero'}
      />

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Professional grooming tailored to your pet's needs
            </p>
          </div>
          <ServiceGrid services={data.services} />
        </div>
      </section>

      {/* Before/After Section */}
      {data.beforeAfterPairs.length > 0 && (
        <section className="py-16 md:py-24 bg-base-200">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Amazing Transformations</h2>
              <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                See the incredible before and after results of our grooming services
              </p>
            </div>
            <BeforeAfterCarousel pairs={data.beforeAfterPairs} />
          </div>
        </section>
      )}

      {/* About Section */}
      <AboutSection
        title={data.aboutTitle || 'About The Puppy Day'}
        description={data.aboutDescription || 'Professional pet grooming services'}
        differentiators={data.aboutDifferentiators}
      />

      {/* Gallery Section */}
      {data.galleryImages.length > 0 && (
        <section id="gallery" className="py-16 md:py-24 bg-base-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Happy Pups</h2>
              <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                Check out some of our recent grooming clients
              </p>
            </div>
            <GalleryGrid images={data.galleryImages} />
          </div>
        </section>
      )}

      {/* Contact Section */}
      <ContactSection
        phone="(562) 555-1234"
        email="info@thepuppyday.com"
        address="La Mirada, CA 90638"
        businessHours={data.businessHours}
      />

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Pamper Your Pup?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Book your appointment today and give your furry friend the grooming experience they deserve
          </p>
          <a href="/login" className="btn btn-secondary btn-lg shadow-xl">
            Book Appointment Now
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </a>
        </div>
      </section>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': 'https://thepuppyday.com',
            name: 'The Puppy Day',
            description: 'Professional pet grooming services in La Mirada, CA',
            url: 'https://thepuppyday.com',
            telephone: '(562) 555-1234',
            email: 'info@thepuppyday.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'La Mirada',
              addressLocality: 'La Mirada',
              addressRegion: 'CA',
              postalCode: '90638',
              addressCountry: 'US',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: '33.9172',
              longitude: '-118.0120',
            },
            openingHoursSpecification: data.businessHours
              ? Object.entries(data.businessHours).map(([day, hours]: [string, any]) => ({
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
                  opens: hours.is_open ? hours.open : undefined,
                  closes: hours.is_open ? hours.close : undefined,
                }))
              : [],
            priceRange: '$$',
            image: 'https://placedog.net/1200/630?id=business',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '127',
            },
            sameAs: [
              'https://www.facebook.com/thepuppyday',
              'https://www.instagram.com/thepuppyday',
              'https://www.yelp.com/biz/the-puppy-day',
            ],
          }),
        }}
      />
    </>
  );
}
