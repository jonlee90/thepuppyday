/**
 * Before/After Transformations section
 * Owns its section wrapper for consistency with other section components
 */

import { SectionHeader } from '@/components/common/SectionHeader';
import { BeforeAfterCarousel } from './BeforeAfterCarousel';
import type { BeforeAfterPair } from '@/types/database';

interface BeforeAfterSectionProps {
  pairs: BeforeAfterPair[];
}

export function BeforeAfterSection({ pairs }: BeforeAfterSectionProps) {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Amazing Transformations"
          subtitle="See the incredible before and after results of our professional grooming services"
        />
        <BeforeAfterCarousel pairs={pairs} />
      </div>
    </section>
  );
}
