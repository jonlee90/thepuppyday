/**
 * Marketing site footer
 */

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-base-200 border-t border-base-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">The Puppy Day</h3>
            <p className="text-base-content/70 text-sm">
              Professional pet grooming services in La Mirada, CA. Making every day a special day for your furry friend.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#services" className="text-base-content/70 hover:text-primary transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-base-content/70 hover:text-primary transition-colors">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#contact" className="text-base-content/70 hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/login" className="text-base-content/70 hover:text-primary transition-colors">
                  Customer Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm text-base-content/70">
              <li>
                <a href="tel:+15625551234" className="hover:text-primary transition-colors">
                  (562) 555-1234
                </a>
              </li>
              <li>
                <a href="mailto:info@thepuppyday.com" className="hover:text-primary transition-colors">
                  info@thepuppyday.com
                </a>
              </li>
              <li>La Mirada, CA 90638</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-base-300 mt-8 pt-8 text-center text-sm text-base-content/60">
          <p>&copy; {currentYear} The Puppy Day. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
