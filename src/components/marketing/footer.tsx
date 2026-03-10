/**
 * Marketing site footer with SEO-optimized link sections
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

const serviceLinks = [
  { label: 'Dog Bath', href: '/services/dog-bath' },
  { label: 'Dog Haircut', href: '/services/dog-haircut' },
  { label: 'Breed-Specific Styling', href: '/services/breed-specific-styling' },
  { label: 'Nail Trimming', href: '/services/nail-trimming' },
  { label: 'Teeth Brushing', href: '/services/teeth-brushing' },
  { label: 'Deshedding', href: '/services/deshedding' },
  { label: 'Flea & Tick Treatment', href: '/services/flea-tick-treatment' },
];

const areaLinks = [
  { label: 'La Mirada', href: '/areas/la-mirada' },
  { label: 'Norwalk', href: '/areas/norwalk' },
  { label: 'Buena Park', href: '/areas/buena-park' },
  { label: 'Whittier', href: '/areas/whittier' },
  { label: 'Santa Fe Springs', href: '/areas/santa-fe-springs' },
  { label: 'Cerritos', href: '/areas/cerritos' },
  { label: 'Hacienda Heights', href: '/areas/hacienda-heights' },
  { label: 'Fullerton', href: '/areas/fullerton' },
  { label: 'Brea', href: '/areas/brea' },
];

const quickLinks = [
  { label: 'Services', href: '/services' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'Customer Portal', href: '/login' },
];

export function Footer({ businessInfo, businessHours }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#EAE0D5]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* About */}
          <div className="sm:col-span-2 lg:col-span-2">
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">{businessInfo.name}</h3>
            <p className="text-[#6B7280] text-sm mb-4">
              Professional dog grooming and day care services in {businessInfo.city}, {businessInfo.state}. We treat your dogs like family.
            </p>
            <div className="flex gap-4">
              {businessInfo.social_links.instagram ? (
                <SocialLink href={businessInfo.social_links.instagram} label="Instagram">
                  <InstagramIcon className="w-5 h-5 text-[#434E54]" />
                </SocialLink>
              ) : null}
              {businessInfo.social_links.yelp ? (
                <SocialLink href={businessInfo.social_links.yelp} label="Yelp">
                  <YelpIcon className="w-5 h-5 text-[#434E54]" />
                </SocialLink>
              ) : null}
              {businessInfo.social_links.facebook ? (
                <SocialLink href={businessInfo.social_links.facebook} label="Facebook">
                  <FacebookIcon className="w-5 h-5 text-[#434E54]" />
                </SocialLink>
              ) : null}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#6B7280] hover:text-[#434E54] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">Services</h3>
            <ul className="space-y-2 text-sm">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#6B7280] hover:text-[#434E54] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas We Serve */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">Areas We Serve</h3>
            <ul className="space-y-2 text-sm">
              {areaLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#6B7280] hover:text-[#434E54] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
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
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-8 text-sm text-[#6B7280]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {currentYear} Puppy Day. All rights reserved.</p>
            <nav aria-label="Legal" className="flex gap-4">
              <Link href="/privacy" className="hover:text-[#434E54] transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#434E54] transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/accessibility" className="hover:text-[#434E54] transition-colors duration-200">
                Accessibility
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
