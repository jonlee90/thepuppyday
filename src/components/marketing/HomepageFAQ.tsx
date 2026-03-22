/**
 * Homepage FAQ section — shows top 6 FAQs for GEO optimization
 * Schema handled by parent page's @graph, not this component
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FAQItem } from '@/data/faq';
import { SectionHeader } from '@/components/common/SectionHeader';
import { FAQAccordion } from '@/components/marketing/FAQAccordion';

interface HomepageFAQProps {
  items: FAQItem[];
}

export function HomepageFAQ({ items }: HomepageFAQProps) {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Quick answers about grooming at Puppy Day"
          className="mb-12"
        />
        <div className="max-w-3xl mx-auto">
          <FAQAccordion items={items} includeSchema={false} />
          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-[#434E54] hover:text-[#C67C4E] transition-colors font-medium"
            >
              View All FAQs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
