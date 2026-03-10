/**
 * FAQ page — 20 questions with FAQPage JSON-LD schema
 * Uses FAQAccordion which auto-generates structured data
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CTABooking } from '@/components/common/CTABooking';
import { SectionHeader } from '@/components/common/SectionHeader';
import { FAQAccordion } from '@/components/marketing/FAQAccordion';
import { FAQ_ITEMS } from '@/data/faq';
import { getBusinessInfo } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'FAQ - Dog Grooming Questions',
  description:
    'Frequently asked questions about dog grooming at Puppy Day in La Mirada, CA. Learn about pricing, services, breed-specific styling, and what to expect.',
  alternates: { canonical: 'https://thepuppyday.com/faq' },
  keywords: [
    'dog grooming FAQ',
    'dog grooming questions',
    'pet grooming La Mirada',
    'grooming cost',
    'puppy first grooming',
  ],
};

export const revalidate = 900;

export default async function FAQPage() {
  const businessInfo = await getBusinessInfo();

  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'FAQ' },
          ]}
        />
      </div>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <SectionHeader
              title="Frequently Asked Questions"
              subtitle="Everything you need to know about grooming at Puppy Day"
            />

            <FAQAccordion items={FAQ_ITEMS} />

            {/* Internal links to service pages */}
            <div className="mt-12 p-6 bg-[#F8EEE5] rounded-xl">
              <h3 className="text-lg font-semibold text-[#434E54] mb-3">
                Explore Our Services
              </h3>
              <p className="text-[#6B7280] mb-4">
                Have more questions about a specific service? Visit our detailed service pages for
                pricing, what&apos;s included, and more.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Dog Bath', href: '/services/dog-bath' },
                  { label: 'Dog Haircut', href: '/services/dog-haircut' },
                  { label: 'Breed-Specific Styling', href: '/services/breed-specific-styling' },
                  { label: 'Nail Trimming', href: '/services/nail-trimming' },
                  { label: 'Teeth Brushing', href: '/services/teeth-brushing' },
                  { label: 'Deshedding', href: '/services/deshedding' },
                  { label: 'Flea & Tick Treatment', href: '/services/flea-tick-treatment' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-block px-4 py-2 bg-white text-[#434E54] text-sm font-medium rounded-lg hover:bg-[#434E54] hover:text-white transition-colors duration-200 shadow-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABooking phone={businessInfo.phone} />
    </div>
  );
}
