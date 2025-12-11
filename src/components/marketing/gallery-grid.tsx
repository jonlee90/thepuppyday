'use client';

/**
 * Gallery grid component for displaying pet photos - Clean & Elegant Professional style
 */

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lightbox } from './lightbox';
import type { GalleryImage } from '@/types/database';

interface GalleryGridProps {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280]">No gallery images available.</p>
      </div>
    );
  }

  return (
    <>
      {/* Gallery Grid - Clean & Elegant Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-lg bg-white group transition-all duration-200 hover:-translate-y-1"
            onClick={() => openLightbox(index)}
          >
            <Image
              src={image.image_url}
              alt={image.caption || `Gallery image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />

            {/* Overlay on hover - Clean Design */}
            <div className="absolute inset-0 bg-[#434E54]/0 group-hover:bg-[#434E54]/80 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#434E54]"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <span className="text-white font-medium text-sm">View</span>
              </div>
            </div>

            {/* Badge for featured images */}
            {image.category === 'featured' && (
              <div className="absolute top-3 right-3 bg-[#434E54] text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
                Featured
              </div>
            )}

            {/* Caption overlay (bottom) - Clean Design */}
            {image.dog_name && (
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-white rounded-lg px-3 py-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-[#434E54] text-sm font-medium">{image.dog_name}</p>
                  {image.breed && (
                    <p className="text-[#6B7280] text-xs">{image.breed}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        images={images}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={goToNext}
        onPrevious={goToPrevious}
      />
    </>
  );
}
