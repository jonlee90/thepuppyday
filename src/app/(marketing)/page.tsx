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
import { EmbeddedBookingWidget } from '@/components/marketing/embedded-booking-widget';
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
    businessHours: settingsRes.data?.business_hours || {},
  };
}

export default async function MarketingPage() {
  const data = await getMarketingData();

  return (
    <div className="bg-[#FFFBF7]">
      {/* Promotional Banner */}
      {data.banners.length > 0 && <PromoBanner banners={data.banners} />}

      {/* Hero Section */}
      <HeroSection
        headline={data.heroHeadline || 'Dog Grooming & Day Care'}
        tagline={data.heroTagline || 'Welcome to Puppy Day, where we treat your dogs like family. We offer expert grooming and engaging daycare services for dogs.'}
        imageUrl={data.heroImageUrl || 'https://placedog.net/1920/1080?id=hero'}
      />

      {/* Before/After Transformations Section */}
      {data.beforeAfterPairs.length > 0 && (
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#FFFBF7] to-[#EAE0D5]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header with decorative underline */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-4">
                Amazing Transformations
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#434E54] to-[#434E54]/30 rounded-full mx-auto mb-6"></div>
              <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
                See the incredible before and after results of our professional grooming services
              </p>
            </div>

            <BeforeAfterCarousel pairs={data.beforeAfterPairs} />
          </div>
        </section>
      )}

      {/* Services Section */}
      <section id="services" className="relative py-20 md:py-28 bg-gradient-to-b from-[#F8EEE5] to-[#FFFBF7]">
        {/* Subtle decorative element */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#434E54]/10 to-transparent"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ServiceGrid services={data.services} />
        </div>

        {/* Bottom decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#434E54]/10 to-transparent"></div>
      </section>

      {/* Gallery Section */}
      {data.galleryImages.length > 0 && (
        <section id="gallery" className="relative py-20 md:py-28 bg-gradient-to-b from-[#FFFBF7] to-[#F8EEE5]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header with decorative underline */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-4">
                Happy Pups Gallery
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#434E54] to-[#434E54]/30 rounded-full mx-auto mb-6"></div>
              <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
                Check out some of our recent grooming clients looking absolutely fabulous
              </p>
            </div>

            <GalleryGrid images={data.galleryImages} />
          </div>
        </section>
      )}

      {/* Booking Widget Section */}
      <section id="book" className="relative py-20 md:py-32 bg-gradient-to-b from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7] overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-20 right-10 w-80 h-80 bg-[#434E54]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#434E54]/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-4">
                Book Appointment
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#434E54] to-[#434E54]/30 rounded-full mx-auto mb-6"></div>
              <p className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto leading-relaxed">
                Book an appointment in minutes and give them the grooming experience they deserve
              </p>
            </div>

            {/* Embedded Booking Widget */}
            <EmbeddedBookingWidget />
          </div>
        </div>

        {/* Decorative paw prints - subtle and elegant */}
        <div className="absolute bottom-10 right-20 text-[#434E54]/5 hidden lg:block">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>
        <div className="absolute top-32 left-20 text-[#434E54]/5 hidden lg:block">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>
      </section>

      {/* About Section */}
      <div className="relative bg-gradient-to-b from-[#EAE0D5] to-[#FFFBF7]">
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
      </div>

      {/* Contact Section */}
      <div className="relative bg-gradient-to-b from-[#F8EEE5] to-[#EAE0D5]">
        <ContactSection
          phone="(657) 252-2903"
          email="puppyday14936@gmail.com"
          address="14936 Leffingwell Rd, La Mirada, CA 90638"
        />
      </div>

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
    </div>
  );
}
