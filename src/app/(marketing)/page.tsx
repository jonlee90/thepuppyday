/**
 * Marketing homepage - integrates all marketing components
 * Task 0168: Updated to use dynamic site content from database
 *
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSiteContent } from '@/lib/site-content';
import {
  HeroSection,
  PromoBannerCarousel,
  ServiceSection,
  BeforeAfterSection,
  GallerySection,
  AboutSection,
  TestimonialsSection,
  ContactSection,
} from '@/components/marketing';
import type {
  Service,
  PromoBanner as PromoBannerType,
  BeforeAfterPair,
  GalleryImage,
} from '@/types/database';

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

// ISR: Revalidate every 15 minutes (matches banner cache TTL)
// Task 0229: Configure ISR for services and gallery content
export const revalidate = 900; // 15 minutes

async function getMarketingData() {
  const supabase = await createServerSupabaseClient();

  // Fetch site content and other marketing data in parallel
  const [siteContent, servicesRes, bannersRes, beforeAfterRes, galleryRes, settingsRes, addonsRes] =
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
      (supabase as any).from('settings').select('value').eq('key', 'business_hours').single(),
      (supabase as any)
        .from('addons')
        .select('id, name, price')
        .eq('is_active', true)
        .order('display_order'),
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
    businessHours: settingsRes.data?.value || {},
    addons: (addonsRes.data as Array<{ id: string; name: string; price: number }>) || [],
  };
}

export default async function MarketingPage() {
  const data = await getMarketingData();

  return (
    <div className="grooming-pattern-bg">
      {/* Promotional Banner Carousel */}
      <PromoBannerCarousel banners={data.banners} />

      {/* Hero Section - Dynamic content from database */}
      <HeroSection heroContent={data.siteContent.hero} />

      {/* Before/After Transformations Section */}
      {data.beforeAfterPairs.length > 0 && (
        <BeforeAfterSection pairs={data.beforeAfterPairs} />
      )}

      {/* Services Section */}
      <ServiceSection services={data.services} addons={data.addons} />

      {/* Gallery Section */}
      {data.galleryImages.length > 0 && (
        <GallerySection images={data.galleryImages} />
      )}


      {/* Testimonials Section - Yelp Reviews */}
      <TestimonialsSection />

      {/* About Section */}
      <AboutSection
        title="About Puppy Day"
        description="At The Puppy Day, we’re a family-run grooming salon that believes every dog deserves to feel comfortable and look their best. Our La Mirada studio was designed to feel like a second home for your pup and we use warm water and premium hypoallergenic products during every session."
      />

      {/* Contact Section - Dynamic from database */}
      <ContactSection
        phone={data.siteContent.business.phone}
        email={data.siteContent.business.email}
        address={`${data.siteContent.business.address}, ${data.siteContent.business.city}, ${data.siteContent.business.state} ${data.siteContent.business.zip}`}
        businessHours={data.businessHours}
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
