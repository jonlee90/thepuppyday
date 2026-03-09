/**
 * Contact section component - Clean & Elegant Professional style
 * Enhanced with Lucide icons and refined design
 */

'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useBookingModal } from '@/hooks/useBookingModal';
import { summarizeBusinessHours } from '@/lib/utils/business-hours';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { SectionHeader } from '@/components/common/SectionHeader';
import { IconBox } from '@/components/ui/IconBox';

interface ContactSectionProps {
  phone: string;
  email: string;
  address: string;
  businessHours?: Record<string, { open: string; close: string; is_open: boolean }>;
}

export function ContactSection({
  phone,
  email,
  address,
  businessHours,
}: ContactSectionProps) {
  const { open: openBookingModal } = useBookingModal();
  const hoursSummary = businessHours
    ? summarizeBusinessHours(businessHours)
    : [{ days: 'Monday - Saturday', hours: '9:00 AM - 5:00 PM' }, { days: 'Sunday', hours: 'Closed' }];

  return (
    <section id="contact" className="py-20 md:py-28 bg-[#EAE0D5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="Get In Touch"
            subtitle="Have questions or ready to book? We're here to help make your pet's grooming experience wonderful."
          />

          {/* Single Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 md:p-12 shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 max-w-3xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-[#434E54] mb-10 text-center">Contact Information</h3>

            <div className="space-y-8">
              {/* Phone */}
              <div className="flex items-start gap-5 group">
                <IconBox hoverScale className="shadow-sm">
                  <Phone className="w-6 h-6 text-[#434E54]" strokeWidth={2} />
                </IconBox>
                <div className="flex-1">
                  <div className="font-semibold text-[#434E54] mb-2 text-sm uppercase tracking-wide">Phone</div>
                  <a
                    href={`tel:${phone}`}
                    className="text-xl text-[#6B7280] hover:text-[#434E54] transition-colors duration-200 font-medium"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-5 group">
                <IconBox hoverScale className="shadow-sm">
                  <Mail className="w-6 h-6 text-[#434E54]" strokeWidth={2} />
                </IconBox>
                <div className="flex-1">
                  <div className="font-semibold text-[#434E54] mb-2 text-sm uppercase tracking-wide">Email</div>
                  <a
                    href={`mailto:${email}`}
                    className="text-lg text-[#6B7280] hover:text-[#434E54] transition-colors duration-200 break-all font-medium"
                  >
                    {email}
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-5 group">
                <IconBox hoverScale className="shadow-sm">
                  <MapPin className="w-6 h-6 text-[#434E54]" strokeWidth={2} />
                </IconBox>
                <div className="flex-1">
                  <div className="font-semibold text-[#434E54] mb-2 text-sm uppercase tracking-wide">Location</div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl text-[#6B7280] hover:text-[#434E54] transition-colors duration-200 font-medium inline-flex items-center gap-2"
                  >
                    {address}
                    <svg
                      className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-start gap-5 group pt-4 border-t border-gray-200">
                <IconBox hoverScale className="shadow-sm">
                  <Clock className="w-6 h-6 text-[#434E54]" strokeWidth={2} />
                </IconBox>
                <div className="flex-1">
                  <div className="font-semibold text-[#434E54] mb-3 text-sm uppercase tracking-wide">Hours</div>
                  {hoursSummary.map((line, i) => (
                    <div
                      key={line.days}
                      className={i === 0 ? 'text-lg text-[#6B7280] font-medium' : 'text-base text-[#9CA3AF] mt-1'}
                    >
                      {line.days}: {line.hours}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <MarketingCTA
              onClick={() => openBookingModal({ mode: 'customer' })}
              fullWidth
              className="mt-12"
            >
              Book Appointment Now
            </MarketingCTA>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
