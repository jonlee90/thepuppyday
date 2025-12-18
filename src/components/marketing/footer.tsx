/**
 * Marketing site footer
 * Task 0168: Updated to use dynamic business info from database
 */

import Link from 'next/link';
import type { BusinessInfo } from '@/types/settings';

interface FooterProps {
  businessInfo: BusinessInfo;
}

export function Footer({ businessInfo }: FooterProps) {
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
                <span className="font-semibold text-[#434E54]">Hours:</span> Mon-Sat, 9:00 AM - 5:00 PM
              </li>
            </ul>
          </div>

          {/* Social Media - Dynamic from database */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#434E54]">Follow Us</h3>
            <div className="flex gap-4">
              {businessInfo.social_links.instagram && (
                <a
                  href={businessInfo.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 text-[#434E54]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              {businessInfo.social_links.yelp && (
                <a
                  href={businessInfo.social_links.yelp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  aria-label="Yelp"
                >
                  <svg className="w-5 h-5 text-[#434E54]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.271.885l-.313 2.23c-.174 1.24-.203 1.39-.203 2.788 0 1.197.029 1.525.145 2.196.058.348.116.638.145.645.028.007 1.652.703 3.607 1.547 1.955.843 3.576 1.54 3.604 1.547.029.007.116-.29.195-.661.174-.813.174-1.978 0-2.792-.232-1.073-.784-2.123-1.578-2.99-.986-1.084-2.28-1.84-3.72-2.17l-.79-.181-.05.087zM11.79 9.185c-.145.087-.29.348-.348.638-.116.58-.029 1.182.203 1.398.116.116.29.145.667.145.464 0 .638-.058.813-.29.145-.174.232-.609.232-1.182 0-.783-.058-1.008-.348-1.124-.203-.087-.638-.058-.87.145-.348.348-.435.58-.348 1.27zm.783 6.148c-.928-.203-1.72-.697-2.357-1.46-.696-.84-1.073-1.753-1.16-2.823-.029-.435-.029-1.431 0-2.213.058-1.562.203-2.388.725-4.14.116-.348.232-.725.29-.87.058-.145.116-.377.116-.522 0-.145-.029-.348-.058-.435-.058-.145-.116-.145-1.769-.145-1.826 0-1.84 0-2.28.377-.377.319-.667.754-.754 1.124-.029.116-.058 1.073-.058 2.13 0 1.898.029 2.504.203 3.636.783 5.08 4.592 8.863 9.672 9.588 1.769.232 3.607.116 5.26-.348.29-.087.638-.203.783-.29.145-.058.29-.116.377-.116.464 0 1.13-.638 1.13-.928 0-.116-.116-.261-.348-.435-.377-.29-.928-.377-2.097-.377-.986 0-1.24.029-1.855.232zm-1.826 1.769c-.203.116-.29.29-.29.522 0 .29.087.435.377.638.464.319.87.319 1.769.029.783-.232 1.073-.377 1.16-.551.058-.116.058-.203 0-.435-.058-.174-.145-.29-.377-.377-.609-.232-1.769-.145-2.639.174zm7.598-2.936c-.087.058-.116.116-.116.29 0 .145.058.232.232.377.377.29.928.377 2.097.377.986 0 1.24-.029 1.855-.232.928-.203 1.72-.697 2.357-1.46.696-.84 1.073-1.753 1.16-2.823.029-.435.029-1.431 0-2.213-.058-1.562-.203-2.388-.725-4.14-.116-.348-.232-.725-.29-.87-.058-.145-.116-.377-.116-.522 0-.145.029-.348.058-.435.058-.145.116-.145 1.769-.145 1.826 0 1.84 0 2.28.377.377.319.667.754.754 1.124.029.116.058 1.073.058 2.13 0 1.898-.029 2.504-.203 3.636-.783 5.08-4.592 8.863-9.672 9.588-1.769.232-3.607.116-5.26-.348-.29-.087-.638-.203-.783-.29-.145-.058-.29-.116-.377-.116-.464 0-1.13-.638-1.13-.928 0-.116.116-.261.348-.435.377-.29.928-.377 2.097-.377.986 0 1.24.029 1.855.232.928.203 1.72.697 2.357 1.46z" />
                  </svg>
                </a>
              )}
              {businessInfo.social_links.facebook && (
                <a
                  href={businessInfo.social_links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5 text-[#434E54]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
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
