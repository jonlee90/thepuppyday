import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { getBusinessInfo } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Accessibility Statement - Puppy Day Dog Grooming',
  description:
    'Puppy Day is committed to ensuring digital accessibility for people with disabilities. Learn about our accessibility efforts and how to contact us.',
  alternates: { canonical: 'https://thepuppyday.com/accessibility' },
};

export const revalidate = 86400;

export default async function AccessibilityPage() {
  const businessInfo = await getBusinessInfo();
  const lastUpdated = 'March 9, 2026';

  return (
    <div className="bg-[#FDF8F4] min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Accessibility Statement' },
          ]}
        />

        <div className="py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#434E54] mb-2">
            Accessibility Statement
          </h1>
          <p className="text-sm text-[#6B7280] mb-8">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-lg max-w-none text-[#434E54] space-y-8">
            {/* Commitment */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Our Commitment
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                {businessInfo.name} is committed to ensuring that our website
                is accessible to people with disabilities. We strive to provide
                an inclusive digital experience that allows all visitors to
                access our services, book appointments, and find the information
                they need. We are continually improving the user experience for
                everyone and applying the relevant accessibility standards.
              </p>
            </section>

            {/* Standards */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Conformance Standards
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We aim to conform to the Web Content Accessibility Guidelines
                (WCAG) 2.1 at Level AA. These guidelines explain how to make
                web content more accessible to people with a wide array of
                disabilities, including visual, auditory, physical, speech,
                cognitive, language, learning, and neurological disabilities.
                Compliance with these guidelines also helps make web content
                more usable for all users.
              </p>
            </section>

            {/* Measures */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Measures We Take
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                To ensure accessibility of our website, {businessInfo.name}{' '}
                takes the following measures: we include accessibility as part
                of our development process, we use semantic HTML elements for
                proper document structure, we provide text alternatives for
                non-text content such as images, we ensure sufficient color
                contrast ratios for text readability, we support keyboard
                navigation for all interactive elements, we design responsive
                layouts that work across different devices and screen sizes, we
                use ARIA labels and roles where appropriate to enhance screen
                reader compatibility, and we regularly review and test our
                website for accessibility.
              </p>
            </section>

            {/* Known Limitations */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Known Limitations
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                While we strive for full accessibility, some areas of our
                website may not yet be fully optimized. These may include some
                older gallery images that may lack detailed alternative text,
                certain third-party embedded content or widgets that are outside
                our direct control, and some PDF documents that may not be fully
                screen-reader compatible. We are actively working to identify
                and resolve these issues. If you encounter any barriers, please
                let us know so we can address them promptly.
              </p>
            </section>

            {/* Assistive Technologies */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Compatibility with Assistive Technologies
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                Our website is designed to be compatible with popular assistive
                technologies including screen readers such as JAWS, NVDA, and
                VoiceOver, screen magnification software, voice recognition
                software, and keyboard-only navigation. We test with these
                technologies regularly to ensure a usable experience.
              </p>
            </section>

            {/* Physical Accessibility */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Physical Location Accessibility
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We are also committed to accessibility at our grooming salon in{' '}
                {businessInfo.city}, {businessInfo.state}. If you have specific
                accessibility needs when visiting our physical location, please
                contact us in advance so we can make appropriate accommodations.
              </p>
            </section>

            {/* Alternative Access */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Alternative Ways to Access Our Services
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                If you are unable to use our website to book an appointment or
                access information, we are happy to assist you through
                alternative means. You can call us at{' '}
                <a
                  href={`tel:${businessInfo.phone.replace(/\D/g, '')}`}
                  className="text-[#A0785D] hover:underline"
                >
                  {businessInfo.phone}
                </a>{' '}
                to book an appointment, ask questions, or get information about
                our services. You can also email us at{' '}
                <a
                  href={`mailto:${businessInfo.email}`}
                  className="text-[#A0785D] hover:underline"
                >
                  {businessInfo.email}
                </a>{' '}
                or visit us in person at our salon.
              </p>
            </section>

            {/* Feedback */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Feedback and Contact
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We welcome your feedback on the accessibility of our website.
                If you encounter accessibility barriers, have suggestions for
                improvement, or need assistance accessing any content, please
                contact us. We take accessibility feedback seriously and will
                make every reasonable effort to address your concerns.
              </p>
              <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <p className="text-[#434E54] font-medium mb-1">
                  {businessInfo.name}
                </p>
                <p className="text-[#6B7280] text-sm">
                  {businessInfo.address}
                  <br />
                  {businessInfo.city}, {businessInfo.state} {businessInfo.zip}
                  <br />
                  Email:{' '}
                  <a
                    href={`mailto:${businessInfo.email}`}
                    className="text-[#A0785D] hover:underline"
                  >
                    {businessInfo.email}
                  </a>
                  <br />
                  Phone:{' '}
                  <a
                    href={`tel:${businessInfo.phone.replace(/\D/g, '')}`}
                    className="text-[#A0785D] hover:underline"
                  >
                    {businessInfo.phone}
                  </a>
                </p>
              </div>
            </section>

            {/* Legal Framework */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Legal Framework
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                This accessibility statement is provided in compliance with the
                Americans with Disabilities Act (ADA) and the California Unruh
                Civil Rights Act, which prohibit discrimination on the basis of
                disability. We recognize our responsibility to provide equal
                access to our digital services and physical location.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
