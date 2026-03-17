/**
 * Marketing homepage - integrates all marketing components
 * Task 0168: Updated to use dynamic site content from database
 *
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSiteContent } from '@/lib/site-content';
import { BLOG_POSTS } from '@/data/blog-posts';
import {
  HeroSection,
  PromoBannerCarousel,
  ServiceSection,
  BeforeAfterSection,
  GallerySection,
  AboutSection,
  TestimonialsSection,
  ContactSection,
  BlogSection,
} from '@/components/marketing';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { SERVICE_SLUGS, SERVICE_CONFIGS } from '@/data/services';
import { CITY_SLUGS, CITY_CONFIGS } from '@/data/cities';
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
      'dog grooming La Mirada',
      'pet groomer La Mirada CA',
      'dog grooming near me',
      'best dog groomer La Mirada',
      'puppy grooming La Mirada',
      'pet grooming',
      'dog spa',
      'professional pet care',
    ],
    authors: [{ name: 'The Puppy Day' }],
    alternates: {
      canonical: 'https://thepuppyday.com',
    },
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
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
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
        <GallerySection images={data.galleryImages} showViewAll />
      )}


      {/* Testimonials Section - Yelp Reviews */}
      <TestimonialsSection />

      {/* About Section */}
      <AboutSection
        title="About Puppy Day"
        description="At The Puppy Day, we’re a family-run grooming salon that believes every dog deserves to feel comfortable and look their best. Our La Mirada studio was designed to feel like a second home for your pup and we use warm water and premium hypoallergenic products during every session."
        showViewAll
      />

      {/* Latest from Our Blog */}
      <BlogSection
        posts={[...BLOG_POSTS]
          .filter(({ slug }) => [
            'dog-grooming-cost-la-mirada',
            'goldendoodle-grooming-guide',
            'signs-dog-needs-grooming',
          ].includes(slug))
          .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
          .slice(0, 3)
          .map(({ slug, title, excerpt, readTime, publishDate }) => ({
            slug, title, excerpt, readTime, publishDate,
          }))}
      />

      {/* Areas We Serve */}
      <section className="py-8 px-4 text-center bg-white">
        <p className="text-[#6B7280] text-base">
          {'Proudly serving '}
          <Link href="/dog-grooming" className="text-[#C67C4E] hover:underline font-medium">
            La Mirada and surrounding cities
          </Link>
          {' including Norwalk, Buena Park, Whittier, Cerritos, and more.'}
        </p>
      </section>

      {/* Contact Section - Dynamic from database */}
      <ContactSection
        phone={data.siteContent.business.phone}
        email={data.siteContent.business.email}
        address={`${data.siteContent.business.address}, ${data.siteContent.business.city}, ${data.siteContent.business.state} ${data.siteContent.business.zip}`}
        businessHours={data.businessHours}
      />

      {/* Structured Data for SEO — PetGroomer schema via SchemaOrg */}
      <SchemaOrg
        schema={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          additionalType: 'https://schema.org/PetGroomer',
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
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Dog Grooming Services',
            itemListElement: SERVICE_SLUGS.map((slug) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: SERVICE_CONFIGS[slug].displayName,
                url: `https://thepuppyday.com/services/${slug}`,
              },
            })),
          },
          areaServed: CITY_SLUGS.map((slug) => ({
            '@type': 'City',
            name: CITY_CONFIGS[slug].name,
          })),
          sameAs: [
            data.siteContent.business.social_links.instagram,
            data.siteContent.business.social_links.yelp,
            data.siteContent.business.social_links.facebook,
          ].filter(Boolean),
        }}
      />
    </div>
  );
}
