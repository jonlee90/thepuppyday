/**
 * Contact section component - Clean & Elegant Professional style
 */

'use client';

import { motion } from 'framer-motion';
import { BusinessHours } from './business-hours';

interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

type BusinessHoursType = Record<string, DayHours>;

interface ContactSectionProps {
  phone: string;
  email: string;
  address: string;
  businessHours: BusinessHoursType;
}

export function ContactSection({
  phone,
  email,
  address,
  businessHours,
}: ContactSectionProps) {
  return (
    <section id="contact" className="py-16 md:py-24 bg-[#F8EEE5]">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-[#434E54] mb-4">
              Get In Touch
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-8 shadow-md"
            >
              <h3 className="text-2xl font-semibold text-[#434E54] mb-8">Contact Us</h3>

              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#EAE0D5] rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#434E54]"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#434E54] mb-1 text-sm">Phone</div>
                    <a
                      href={`tel:${phone}`}
                      className="text-[#6B7280] hover:text-[#434E54] transition-colors text-base"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#EAE0D5] rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#434E54]"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#434E54] mb-1 text-sm">Email</div>
                    <a
                      href={`mailto:${email}`}
                      className="text-[#6B7280] hover:text-[#434E54] transition-colors break-all text-sm"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#EAE0D5] rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#434E54]"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#434E54] mb-1 text-sm">Location</div>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6B7280] hover:text-[#434E54] transition-colors text-base"
                    >
                      {address}
                    </a>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <a
                href="/book"
                className="mt-8 block w-full text-center px-6 py-4 text-base font-medium text-white bg-[#434E54] rounded-lg shadow-md hover:bg-[#363F44] hover:shadow-lg transition-all duration-200"
              >
                Book Appointment
              </a>
            </motion.div>

            {/* Business Hours */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-8 shadow-md"
            >
              <h3 className="text-2xl font-semibold text-[#434E54] mb-8">Business Hours</h3>
              <BusinessHours hours={businessHours} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
