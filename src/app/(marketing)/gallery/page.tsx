import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CTABooking } from '@/components/common/CTABooking';
import { SchemaOrg } from '@/components/common/SchemaOrg';
import { GallerySection, BeforeAfterSection } from '@/components/marketing';
import { getBusinessInfo } from '@/lib/site-content';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Dog Grooming Gallery - Before & After Photos',
  description:
    'Browse before and after photos from Puppy Day dog grooming in La Mirada, CA. See real grooming transformations and happy pups.',
  alternates: { canonical: 'https://thepuppyday.com/gallery' },
};

export const revalidate = 900;

export default async function GalleryPage() {
  const supabase = await createServerSupabaseClient();

  const [businessInfo, galleryRes, beforeAfterRes] = await Promise.all([
    getBusinessInfo(),
    (supabase as any)
      .from('gallery_images')
      .select('*')
      .eq('is_published', true)
      .order('display_order'),
    (supabase as any)
      .from('before_after_pairs')
      .select('*')
      .order('display_order'),
  ]);

  const galleryImages = galleryRes.data || [];
  const beforeAfterPairs = beforeAfterRes.data || [];

  return (
    <div>
      <SchemaOrg
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'Dog Grooming Gallery - Puppy Day La Mirada',
          description: 'Before and after grooming photos from Puppy Day dog grooming salon in La Mirada, CA.',
          url: 'https://thepuppyday.com/gallery',
          author: {
            '@type': 'LocalBusiness',
            name: businessInfo.name,
            url: 'https://thepuppyday.com',
          },
        }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Gallery' }]}
        />
      </div>

      {beforeAfterPairs.length > 0 && (
        <BeforeAfterSection pairs={beforeAfterPairs} />
      )}

      {galleryImages.length > 0 && (
        <GallerySection images={galleryImages} />
      )}

      <CTABooking phone={businessInfo.phone} />
    </div>
  );
}
