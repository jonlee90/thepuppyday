/**
 * Contact section component - Clean & Elegant Professional style
 * Enhanced with Lucide icons and refined design
 */

'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

interface ContactSectionProps {
  phone: string;
  email: string;
  address: string;
}

export function ContactSection({
  phone,
  email,
  address,
}: ContactSectionProps) {
  return (
    <section id="contact" className="py-20 md:py-28 bg-gradient-to-b from-[#FFFBF7] to-[#EAE0D5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#434E54] mb-4">
              Get In Touch
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-[#434E54] to-[#434E54]/30 rounded-full mx-auto mb-6"></div>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
              Have questions or ready to book? We're here to help make your pet's grooming experience wonderful.
            </p>
          </motion.div>

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
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#EAE0D5] to-[#DCD2C7] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <Phone className="w-6 h-6 text-[#434E54]" strokeWidth={2} />
                </div>
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
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#EAE0D5] to-[#DCD2C7] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <Mail className="w-6 h-6 text-[#434E54]" strokeWidth={2} />
                </div>
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
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#EAE0D5] to-[#DCD2C7] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <MapPin className="w-6 h-6 text-[#434E54]" strokeWidth={2} />
                </div>
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
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#EAE0D5] to-[#DCD2C7] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-6 h-6 text-[#434E54]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#434E54] mb-3 text-sm uppercase tracking-wide">Hours</div>
                  <div className="text-lg text-[#6B7280] font-medium">
                    Monday - Saturday: 9:00 AM - 5:00 PM
                  </div>
                  <div className="text-base text-[#9CA3AF] mt-1">
                    Sunday: Closed
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="/login"
              className="mt-12 block w-full text-center px-8 py-4 text-lg font-semibold text-white bg-[#434E54] rounded-xl shadow-md hover:bg-[#363F44] hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
            >
              Book Appointment Now
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
