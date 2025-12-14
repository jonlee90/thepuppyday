'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { PetNameBadge } from './PetNameBadge';
import { Calendar } from 'lucide-react';

interface HeroSectionProps {
  petName: string;
  serviceName: string;
  appointmentDate: string;
  afterPhotoUrl: string | null;
}

/**
 * HeroSection - Full-width hero with after photo and pet details
 * Displays the transformed pet with professional branding
 */
export function HeroSection({
  petName,
  serviceName,
  appointmentDate,
  afterPhotoUrl,
}: HeroSectionProps) {
  // Format date for display
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="relative w-full h-[400px] lg:h-[600px] bg-[#434E54] overflow-hidden">
      {/* After Photo */}
      <div className="absolute inset-0">
        {afterPhotoUrl ? (
          <Image
            src={afterPhotoUrl}
            alt={`${petName} after grooming`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#434E54] to-[#5A6670] flex items-center justify-center">
            <span className="text-white/50 text-lg">No photo available</span>
          </div>
        )}
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-between p-6 lg:p-12">
        {/* Top: Business Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-md">
            <span className="text-sm font-semibold text-[#434E54]">
              The Puppy Day
            </span>
          </div>
        </motion.div>

        {/* Bottom: Pet Details */}
        <div className="space-y-4">
          {/* Pet Name Badge */}
          <PetNameBadge petName={petName} />

          {/* Service & Date Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-2"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
              {serviceName}
            </h2>
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="w-4 h-4" />
              <span className="text-sm lg:text-base">{formattedDate}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
