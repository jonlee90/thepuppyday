/**
 * Blog index page
 * SEO Phase 5: Lists all 12 blog posts sorted by newest first
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/data/blog-posts';
import { getSiteContent } from '@/lib/site-content';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CTABooking } from '@/components/common/CTABooking';
import { SchemaOrg } from '@/components/common/SchemaOrg';

export const revalidate = 900;

export const metadata: Metadata = {
  title: 'Dog Grooming Blog - Tips & Guides | Puppy Day La Mirada',
  description:
    'Expert dog grooming tips, breed guides, and care advice from the team at Puppy Day in La Mirada, CA. Learn how to keep your dog looking and feeling their best.',
  alternates: {
    canonical: 'https://thepuppyday.com/blog',
  },
  openGraph: {
    title: 'Dog Grooming Blog - Tips & Guides | Puppy Day La Mirada',
    description:
      'Expert dog grooming tips, breed guides, and care advice from the Puppy Day team in La Mirada, CA.',
    url: 'https://thepuppyday.com/blog',
    siteName: 'Puppy Day',
    type: 'website',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogIndexPage() {
  const { business } = await getSiteContent();

  const sortedPosts = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );

  return (
    <div className="min-h-screen bg-[#F8EEE5]">
      <SchemaOrg
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Dog Grooming Blog - Puppy Day La Mirada',
          description:
            'Expert dog grooming tips, breed guides, and care advice from the team at Puppy Day in La Mirada, CA.',
          url: 'https://thepuppyday.com/blog',
          publisher: {
            '@type': 'Organization',
            name: 'Puppy Day',
            url: 'https://thepuppyday.com',
          },
          blogPost: sortedPosts.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.publishDate,
            url: `https://thepuppyday.com/blog/${post.slug}`,
          })),
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]}
        />

        <header className="mb-10">
          <h1 className="text-4xl font-semibold text-[#434E54] mb-4">Dog Grooming Blog</h1>
          <p className="text-[#6B7280] text-lg max-w-2xl leading-relaxed">
            Expert grooming tips, breed guides, and dog care advice from the Puppy Day team in La
            Mirada, CA. Helping Southern California pet owners keep their dogs happy and healthy.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-transparent hover:border-[#C67C4E] hover:-translate-y-0.5 p-6"
            >
              <h2 className="font-semibold text-[#434E54] text-lg mb-2 leading-snug">
                {post.title}
              </h2>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <time
                  dateTime={post.publishDate}
                  className="text-xs text-[#6B7280]"
                >
                  {formatDate(post.publishDate)}
                </time>
                <span className="text-xs text-[#C67C4E] font-medium">{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <CTABooking
        phone={business.phone}
        heading="Ready to Book Your Pup's Grooming?"
        subheading="Professional grooming for dogs of all sizes in La Mirada, CA. Same-week appointments available."
      />
    </div>
  );
}
