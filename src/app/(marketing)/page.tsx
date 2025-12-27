/**
 * Marketing homepage - integrates all marketing components
 * Task 0168: Updated to use dynamic site content from database
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSiteContent } from '@/lib/site-content';
import { HeroSection } from '@/components/marketing/hero-section';
import { PromoBannerCarousel } from '@/components/marketing/PromoBannerCarousel';
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
import GroomingToolDecoration from '@/components/marketing/grooming-tool-decoration';

// Dynamic SEO Metadata - fetches from database
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSiteContent();

  return {
    title: seo.page_title,
    description: seo.meta_description,
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
      title: seo.og_title,
      description: seo.og_description,
      url: 'https://thepuppyday.com',
      siteName: 'Puppy Day',
      images: seo.og_image_url
        ? [
            {
              url: seo.og_image_url,
              width: 1200,
              height: 630,
              alt: seo.og_title,
            },
          ]
        : [],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.og_title,
      description: seo.og_description,
      images: seo.og_image_url ? [seo.og_image_url] : [],
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
  };
}

// Revalidate every 5 seconds for near-instant updates
export const revalidate = 5;

async function getMarketingData() {
  const supabase = await createServerSupabaseClient();

  // Fetch site content and other marketing data in parallel
  const [siteContent, servicesRes, bannersRes, beforeAfterRes, galleryRes, settingsRes] =
    await Promise.all([
      getSiteContent(),
      (supabase as any)
        .from('services')
        .select('*, prices:service_prices(*)')
        .eq('is_active', true)
        .order('display_order'),
      (supabase as any).from('promo_banners').select('*').eq('is_active', true).order('display_order'),
      (supabase as any).from('before_after_pairs').select('*').order('display_order'),
      (supabase as any)
        .from('gallery_images')
        .select('*')
        .eq('is_published', true)
        .order('display_order'),
      (supabase as any).from('settings').select('*').single(),
    ]);

  // Filter banners by date range
  const today = new Date().toISOString().split('T')[0];
  const activeBanners = (bannersRes.data as PromoBannerType[])?.filter((banner) => {
    // Include if no dates set
    if (!banner.start_date && !banner.end_date) {
      return true;
    }
    // Check if within date range
    const afterStart = !banner.start_date || banner.start_date <= today;
    const beforeEnd = !banner.end_date || banner.end_date >= today;
    return afterStart && beforeEnd;
  }) || [];

  return {
    siteContent,
    services: (servicesRes.data as Service[]) || [],
    banners: activeBanners,
    beforeAfterPairs: (beforeAfterRes.data as BeforeAfterPair[]) || [],
    galleryImages: (galleryRes.data as GalleryImage[]) || [],
    businessHours: settingsRes.data?.business_hours || {},
  };
}

export default async function MarketingPage() {
  const data = await getMarketingData();

  return (
    <div className="bg-[#FFFBF7]">
      {/* Promotional Banner Carousel */}
      <PromoBannerCarousel banners={data.banners} />

      {/* Hero Section - Dynamic content from database */}
      <HeroSection heroContent={data.siteContent.hero} />

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
      <section id="services" className="relative py-20 md:py-28 bg-gradient-to-b from-[#F8EEE5] to-[#EAE0D5]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ServiceGrid services={data.services} />
          <GroomingToolDecoration/>
        </div>
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


      {/* About Section */}
      <AboutSection
        title="About Puppy Day"
        description="At Puppy Day, we provide professional grooming services that promote your dog's health, comfort, and happiness. We use gentle techniques and premium hypoallergenic products suitable for sensitive skin. Our day care offers a safe, social experience with supervised playtime."
        differentiators={[
          'Gentle techniques and premium hypoallergenic products',
          'Safe, supervised daycare environment',
          'Experienced and caring staff',
          'Health-focused grooming services',
          'Social playtime for dogs',
          'Comfortable and clean facilities'
        ]}
      />

      {/* Contact Section - Dynamic from database */}
      <ContactSection
        phone={data.siteContent.business.phone}
        email={data.siteContent.business.email}
        address={`${data.siteContent.business.address}, ${data.siteContent.business.city}, ${data.siteContent.business.state} ${data.siteContent.business.zip}`}
      />

      {/* Structured Data for SEO - Dynamic from database */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': 'https://thepuppyday.com',
            name: data.siteContent.business.name,
            description: `Professional dog grooming and day care services in ${data.siteContent.business.city}, ${data.siteContent.business.state}`,
            url: 'https://thepuppyday.com',
            telephone: data.siteContent.business.phone,
            email: data.siteContent.business.email,
            address: {
              '@type': 'PostalAddress',
              streetAddress: data.siteContent.business.address,
              addressLocality: data.siteContent.business.city,
              addressRegion: data.siteContent.business.state,
              postalCode: data.siteContent.business.zip,
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
              data.siteContent.business.social_links.instagram,
              data.siteContent.business.social_links.yelp,
              data.siteContent.business.social_links.facebook,
            ].filter(Boolean),
          }),
        }}
      />
    </div>
  );
}
