/**
 * Marketing site footer
 * Task 0168: Updated to use dynamic business info from database
 */

import Link from 'next/link';
import type { BusinessInfo } from '@/types/settings';
import { summarizeBusinessHours } from '@/lib/utils/business-hours';
import { InstagramIcon, YelpIcon, FacebookIcon } from '@/components/common/SocialIcons';
import { SocialLink } from '@/components/ui/SocialLink';

interface FooterProps {
  businessInfo: BusinessInfo;
  businessHours?: Record<string, { open: string; close: string; is_open: boolean }>;
}

export function Footer({ businessInfo, businessHours }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#EAE0D5]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">{businessInfo.name}</h3>
            <p className="text-[#6B7280] text-sm">
              Professional dog grooming and day care services in {businessInfo.city}, {businessInfo.state}. We treat your dogs like family.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#services" className="text-[#6B7280] hover:text-[#434E54] transition-colors duration-200">
                  Services
                </a>
              </li>
              <li>
                <a href="#about" className="text-[#6B7280] hover:text-[#434E54] transition-colors duration-200">
                  About
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-[#6B7280] hover:text-[#434E54] transition-colors duration-200">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#contact" className="text-[#6B7280] hover:text-[#434E54] transition-colors duration-200">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/login" className="text-[#6B7280] hover:text-[#434E54] transition-colors duration-200">
                  Customer Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact - Dynamic from database */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">Contact Us</h3>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li>
                <a
                  href={`tel:${businessInfo.phone.replace(/\D/g, '')}`}
                  className="hover:text-[#434E54] transition-colors duration-200"
                >
                  {businessInfo.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${businessInfo.email}`}
                  className="hover:text-[#434E54] transition-colors duration-200 break-all"
                >
                  {businessInfo.email}
                </a>
              </li>
              <li>{businessInfo.address}</li>
              <li>
                {businessInfo.city}, {businessInfo.state} {businessInfo.zip}
              </li>
              <li className="pt-2">
                <span className="font-semibold text-[#434E54]">Hours:</span>{' '}
                {businessHours
                  ? summarizeBusinessHours(businessHours).map((line) => `${line.days}: ${line.hours}`).join(' | ')
                  : 'Mon-Sat, 9:00 AM - 5:00 PM'}
              </li>
            </ul>
          </div>

          {/* Social Media - Dynamic from database */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">Follow Us</h3>
            <div className="flex gap-4">
              {businessInfo.social_links.instagram && (
                <SocialLink href={businessInfo.social_links.instagram} label="Instagram">
                  <InstagramIcon className="w-5 h-5 text-[#434E54]" />
                </SocialLink>
              )}
              {businessInfo.social_links.yelp && (
                <SocialLink href={businessInfo.social_links.yelp} label="Yelp">
                  <YelpIcon className="w-5 h-5 text-[#434E54]" />
                </SocialLink>
              )}
              {businessInfo.social_links.facebook && (
                <SocialLink href={businessInfo.social_links.facebook} label="Facebook">
                  <FacebookIcon className="w-5 h-5 text-[#434E54]" />
                </SocialLink>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-[#6B7280]">
          <p>&copy; {currentYear} Puppy Day. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
