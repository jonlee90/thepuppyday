/**
 * Gallery section
 * Owns its section wrapper for consistency with other section components
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { GalleryGrid } from './GalleryGrid';
import type { GalleryImage } from '@/types/database';

interface GallerySectionProps {
  images: GalleryImage[];
  showViewAll?: boolean;
}

export function GallerySection({ images, showViewAll = false }: GallerySectionProps) {
  return (
    <section id="gallery" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Happy Pups Gallery"
          subtitle="Check out some of our recent grooming clients looking absolutely fabulous"
        />
        <GalleryGrid images={images} />
        {showViewAll ? (
          <div className="text-center mt-10">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-[#434E54] hover:text-[#C67C4E] font-semibold transition-colors duration-200"
            >
              View Full Gallery
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
