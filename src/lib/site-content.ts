/**
 * Site Content Utility
 * Task 0168: Fetch site content from database with fallback defaults
 *
 * Provides a reusable function to fetch hero, SEO, and business info
 * from the site_content table with caching and fallback support.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { HeroContent, SeoSettings, BusinessInfo } from '@/types/settings';

// Default values based on business info from CLAUDE.md
const DEFAULT_HERO: HeroContent = {
  headline: 'Professional Dog Grooming in La Mirada',
  subheadline: 'Expert grooming services for dogs of all sizes. Book your appointment today!',
  background_image_url: null,
  cta_buttons: [
    {
      text: 'Book Appointment',
      url: '/booking',
      style: 'primary',
    },
    {
      text: 'View Services',
      url: '/services',
      style: 'secondary',
    },
  ],
};

const DEFAULT_SEO: SeoSettings = {
  page_title: 'Puppy Day - Professional Dog Grooming | La Mirada, CA',
  meta_description:
    'Professional dog grooming services in La Mirada, CA. Expert care for dogs of all sizes. Monday-Saturday 9AM-5PM. Call (657) 252-2903 to book!',
  og_title: 'Puppy Day - Professional Dog Grooming in La Mirada',
  og_description:
    'We treat your pup like family with gentle, expert grooming care. Serving La Mirada and surrounding areas.',
  og_image_url: null,
};

const DEFAULT_BUSINESS: BusinessInfo = {
  name: 'Puppy Day',
  address: '14936 Leffingwell Rd',
  city: 'La Mirada',
  state: 'CA',
  zip: '90638',
  phone: '(657) 252-2903',
  email: 'puppyday14936@gmail.com',
  social_links: {
    instagram: 'https://instagram.com/puppyday_lm',
    yelp: 'https://yelp.com/biz/puppy-day-la-mirada',
  },
};

export interface SiteContent {
  hero: HeroContent;
  seo: SeoSettings;
  business: BusinessInfo;
}

/**
 * Fetch all site content from database
 * Falls back to defaults if not configured
 *
 * @returns Site content with hero, SEO, and business info
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch all site content sections
    const { data: siteContent, error } = (await (supabase as any)
      .from('site_content')
      .select('section, content')
      .in('section', ['hero', 'seo', 'business_info'])) as {
      data: Array<{ section: string; content: any }> | null;
      error: any;
    };

    if (error) {
      console.error('[getSiteContent] Error fetching site content:', error);
      // Return defaults on error
      return {
        hero: DEFAULT_HERO,
        seo: DEFAULT_SEO,
        business: DEFAULT_BUSINESS,
      };
    }

    // Map database results to settings object
    const contentMap = new Map(siteContent?.map((item) => [item.section, item.content]) || []);

    return {
      hero: (contentMap.get('hero') as HeroContent) || DEFAULT_HERO,
      seo: (contentMap.get('seo') as SeoSettings) || DEFAULT_SEO,
      business: (contentMap.get('business_info') as BusinessInfo) || DEFAULT_BUSINESS,
    };
  } catch (error) {
    console.error('[getSiteContent] Unexpected error:', error);
    // Return defaults on any error
    return {
      hero: DEFAULT_HERO,
      seo: DEFAULT_SEO,
      business: DEFAULT_BUSINESS,
    };
  }
}

/**
 * Fetch hero content only
 */
export async function getHeroContent(): Promise<HeroContent> {
  const content = await getSiteContent();
  return content.hero;
}

/**
 * Fetch SEO settings only
 */
export async function getSeoSettings(): Promise<SeoSettings> {
  const content = await getSiteContent();
  return content.seo;
}

/**
 * Fetch business info only
 */
export async function getBusinessInfo(): Promise<BusinessInfo> {
  const content = await getSiteContent();
  return content.business;
}
