'use client';

import { motion } from 'framer-motion';
import { HeroSection } from './HeroSection';
import { AssessmentGrid } from './AssessmentGrid';
import { BeforeAfterComparison } from './BeforeAfterComparison';
import { HealthObservationsSection } from './HealthObservationsSection';
import { GroomerNotesSection } from './GroomerNotesSection';
import { ShareButtons } from './ShareButtons';
import type { PublicReportCard as PublicReportCardType } from '@/types/report-card';

interface PublicReportCardProps {
  reportCard: PublicReportCardType;
}

/**
 * PublicReportCard - Main component that orchestrates all report card sections
 * Client component that receives data from the server page
 */
export function PublicReportCard({ reportCard }: PublicReportCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#F8EEE5]"
    >
      {/* Hero Section with After Photo */}
      <HeroSection
        petName={reportCard.pet_name}
        serviceName={reportCard.service_name}
        appointmentDate={reportCard.appointment_date}
        afterPhotoUrl={reportCard.after_photo_url}
      />

      {/* Assessment Grid */}
      <AssessmentGrid
        mood={reportCard.mood}
        coatCondition={reportCard.coat_condition}
        behavior={reportCard.behavior}
      />

      {/* Before/After Comparison (conditional) */}
      {reportCard.before_photo_url && (
        <BeforeAfterComparison
          beforePhotoUrl={reportCard.before_photo_url}
          afterPhotoUrl={reportCard.after_photo_url}
          petName={reportCard.pet_name}
        />
      )}

      {/* Health Observations (conditional) */}
      {reportCard.health_observations &&
        reportCard.health_observations.length > 0 && (
          <HealthObservationsSection
            observations={reportCard.health_observations}
          />
        )}

      {/* Groomer Notes (conditional) */}
      {reportCard.groomer_notes && (
        <GroomerNotesSection
          notes={reportCard.groomer_notes}
          groomerName="The Puppy Day Team"
          date={reportCard.created_at}
        />
      )}

      {/* Share Buttons */}
      <ShareButtons reportCard={reportCard} />

      {/* Footer Call-to-Action */}
      <section className="bg-[#434E54] py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Book Your Next Appointment
          </h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Keep your pet looking and feeling their best with regular grooming
            sessions at The Puppy Day.
          </p>
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-white text-[#434E54] font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Book Now
          </motion.a>
        </div>
      </section>

      {/* Business Footer */}
      <footer className="bg-[#F8EEE5] py-8 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-2">
            <h4 className="text-lg font-semibold text-[#434E54]">
              The Puppy Day
            </h4>
            <p className="text-sm text-[#6B7280]">
              14936 Leffingwell Rd, La Mirada, CA 90638
            </p>
            <p className="text-sm text-[#6B7280]">
              (657) 252-2903 | puppyday14936@gmail.com
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <a
                href="https://www.instagram.com/puppyday_lm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#434E54] hover:text-[#363F44] transition-colors"
              >
                Instagram
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="https://www.yelp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#434E54] hover:text-[#363F44] transition-colors"
              >
                Yelp
              </a>
            </div>
            <p className="text-xs text-[#9CA3AF] pt-4">
              Monday - Saturday, 9:00 AM - 5:00 PM
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
