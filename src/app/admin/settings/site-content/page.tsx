/**
 * Site Content Settings Page
 * Task 0160-0165: Main page for site content management
 *
 * Server Component - Fetches initial settings and renders client component
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { SiteContentClient } from './client';
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
  ],
};

const DEFAULT_SEO: SeoSettings = {
  page_title: 'Dog Grooming La Mirada | The Puppy Day',
  meta_description:
    'Professional dog grooming services in La Mirada. Expert care for all breeds and sizes. Monday-Saturday 9AM-5PM. Call (657) 252-2903 to book!',
  og_title: 'The Puppy Day - Dog Grooming & Day Care',
  og_description:
    'Professional dog grooming services in La Mirada. Expert care for all breeds and sizes. Book your appointment today!',
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

export default async function SiteContentPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  // Fetch current site content from database
  const { data: siteContent } = (await (supabase as any)
    .from('site_content')
    .select('section, content')
    .in('section', ['hero', 'seo', 'business_info'])) as {
    data: Array<{ section: string; content: any }> | null;
  };

  // Map database results to settings object
  const contentMap = new Map(siteContent?.map((item) => [item.section, item.content]) || []);

  const initialSettings = {
    hero: (contentMap.get('hero') as HeroContent) || DEFAULT_HERO,
    seo: (contentMap.get('seo') as SeoSettings) || DEFAULT_SEO,
    business: (contentMap.get('business_info') as BusinessInfo) || DEFAULT_BUSINESS,
  };

  return <SiteContentClient initialSettings={initialSettings} />;
}
