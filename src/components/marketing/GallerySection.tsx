/**
 * Gallery section
 * Owns its section wrapper for consistency with other section components
 */

import { SectionHeader } from '@/components/common/SectionHeader';
import { GalleryGrid } from './GalleryGrid';
import type { GalleryImage } from '@/types/database';

interface GallerySectionProps {
  images: GalleryImage[];
}

export function GallerySection({ images }: GallerySectionProps) {
  return (
    <section id="gallery" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Happy Pups Gallery"
          subtitle="Check out some of our recent grooming clients looking absolutely fabulous"
        />
        <GalleryGrid images={images} />
      </div>
    </section>
  );
}
