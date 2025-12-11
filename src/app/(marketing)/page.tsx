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
  title: 'Puppy Day - Dog Grooming & Day Care in La Mirada, CA',
  description: 'Professional dog grooming and day care services in La Mirada, CA. We use gentle techniques and premium hypoallergenic products. Book your appointment today!',
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
    title: 'Puppy Day - Dog Grooming & Day Care',
    description: 'We treat your dogs like family. Expert grooming and engaging daycare services in La Mirada, CA.',
    url: 'https://thepuppyday.com',
    siteName: 'Puppy Day',
    images: [
      {
        url: 'https://placedog.net/1200/630?id=og',
        width: 1200,
        height: 630,
        alt: 'Puppy Day - Dog Grooming & Day Care',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Puppy Day - Dog Grooming & Day Care',
    description: 'We treat your dogs like family. Expert grooming and engaging daycare services.',
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
    supabase.from('services').select('*').eq('is_active', true).order('display_order'),
    supabase.from('promo_banners').select('*').order('display_order'),
    supabase.from('before_after_pairs').select('*').order('display_order'),
    supabase.from('gallery_images').select('*').eq('is_published', true).order('display_order'),
    supabase.from('site_content').select('*'),
    supabase.from('settings').select('*').single(),
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
    businessHours: settingsRes.data?.business_hours || {},
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
        headline={data.heroHeadline || 'Dog Grooming & Day Care'}
        tagline={data.heroTagline || 'Welcome to Puppy Day, where we treat your dogs like family. We offer expert grooming and engaging daycare services for dogs.'}
        imageUrl={data.heroImageUrl || 'https://placedog.net/1920/1080?id=hero'}
      />

      {/* Services Section - Clean & Elegant */}
      <section id="services" className="py-16 md:py-24 bg-[#F8EEE5]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-semibold text-[#434E54] mb-4">
              Our Services
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Professional grooming and daycare services tailored to your dog&apos;s needs
            </p>
          </div>
          <ServiceGrid services={data.services} />
        </div>
      </section>

      {/* Before/After Section - Clean & Elegant */}
      {data.beforeAfterPairs.length > 0 && (
        <section className="py-16 md:py-24 bg-[#EAE0D5]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-semibold text-[#434E54] mb-4">
                Amazing Transformations
              </h2>
              <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
                See the incredible before and after results of our grooming services
              </p>
            </div>
            <BeforeAfterCarousel pairs={data.beforeAfterPairs} />
          </div>
        </section>
      )}

      {/* About Section */}
      <AboutSection
        title={data.aboutTitle || 'About Puppy Day'}
        description={data.aboutDescription || 'At Puppy Day, we provide professional grooming services that promote your dog\'s health, comfort, and happiness. We use gentle techniques and premium hypoallergenic products suitable for sensitive skin. Our day care offers a safe, social experience with supervised playtime.'}
        differentiators={data.aboutDifferentiators.length > 0 ? data.aboutDifferentiators : [
          'Gentle techniques and premium hypoallergenic products',
          'Safe, supervised daycare environment',
          'Experienced and caring staff',
          'Health-focused grooming services',
          'Social playtime for dogs',
          'Comfortable and clean facilities'
        ]}
      />

      {/* Gallery Section - Clean & Elegant */}
      {data.galleryImages.length > 0 && (
        <section id="gallery" className="py-16 md:py-24 bg-[#F8EEE5]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-semibold text-[#434E54] mb-4">
                Happy Pups
              </h2>
              <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
                Check out some of our recent grooming clients looking fabulous
              </p>
            </div>
            <GalleryGrid images={data.galleryImages} />
          </div>
        </section>
      )}

      {/* Contact Section */}
      <ContactSection
        phone="(657) 252-2903"
        email="puppyday14936@gmail.com"
        address="14936 Leffingwell Rd, La Mirada, CA 90638"
        businessHours={data.businessHours}
      />

      {/* Final CTA Section - Clean & Elegant */}
      <section className="py-20 md:py-32 bg-[#EAE0D5]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-semibold text-[#434E54] mb-6">
              Ready to Pamper Your Pup?
            </h2>

            <p className="text-xl md:text-2xl text-[#6B7280] mb-12 max-w-3xl mx-auto">
              Book your appointment today and give your furry friend the care they deserve
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a
                href="/login"
                className="group px-10 py-4 text-lg font-medium text-white bg-[#434E54] rounded-lg shadow-md hover:bg-[#363F44] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                Book Appointment Now
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
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

              <a
                href="#services"
                className="px-10 py-4 text-lg font-medium text-[#434E54] bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                View Services
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { text: '5-Star Rated' },
                { text: 'Award Winning' },
                { text: '100% Satisfaction' },
                { text: 'Pet Approved' },
              ].map((badge, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md"
                >
                  <div className="text-sm font-semibold text-[#434E54]">{badge.text}</div>
                </div>
              ))}
            </div>
          </div>
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
            name: 'Puppy Day',
            description: 'Professional dog grooming and day care services in La Mirada, CA',
            url: 'https://thepuppyday.com',
            telephone: '(657) 252-2903',
            email: 'puppyday14936@gmail.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '14936 Leffingwell Rd',
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
              ? Object.entries(data.businessHours).map(([day, hours]) => ({
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
                  opens: (hours as { is_open?: boolean; open?: string; close?: string }).is_open ? (hours as { is_open?: boolean; open?: string; close?: string }).open : undefined,
                  closes: (hours as { is_open?: boolean; open?: string; close?: string }).is_open ? (hours as { is_open?: boolean; open?: string; close?: string }).close : undefined,
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
              'https://www.instagram.com/puppyday_lm',
              'https://www.yelp.com/biz/puppy-day-la-mirada',
            ],
          }),
        }}
      />
    </>
  );
}
