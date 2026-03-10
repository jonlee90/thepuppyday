import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { getBusinessInfo } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Terms of Service - Puppy Day Dog Grooming',
  description:
    'Review the terms and conditions for using Puppy Day dog grooming services and website in La Mirada, CA.',
  alternates: { canonical: 'https://thepuppyday.com/terms' },
};

export const revalidate = 86400;

export default async function TermsOfServicePage() {
  const businessInfo = await getBusinessInfo();
  const lastUpdated = 'March 9, 2026';

  return (
    <div className="bg-[#FDF8F4] min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]}
        />

        <div className="py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#434E54] mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-[#6B7280] mb-8">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-lg max-w-none text-[#434E54] space-y-8">
            {/* Agreement */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Agreement to Terms
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                By accessing or using the {businessInfo.name} website at{' '}
                <Link href="/" className="text-[#A0785D] hover:underline">
                  thepuppyday.com
                </Link>{' '}
                or by booking and using our dog grooming services, you agree to
                be bound by these Terms of Service. If you do not agree to these
                terms, please do not use our website or services.
              </p>
            </section>

            {/* Services Description */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Services Description
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                {businessInfo.name} provides professional dog grooming and day
                care services at our location in {businessInfo.city},{' '}
                {businessInfo.state}. Our services include but are not limited to
                bathing, haircuts, breed-specific styling, nail trimming, teeth
                brushing, deshedding treatments, and flea and tick treatments.
                Service availability, pricing, and scheduling are subject to
                change. Current pricing is displayed on our website and may vary
                based on your dog&apos;s size, breed, and coat condition.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Account Registration
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                To book appointments online, you may need to create an account.
                You are responsible for maintaining the confidentiality of your
                account credentials, providing accurate and current information,
                all activities that occur under your account, and notifying us
                immediately of any unauthorized use of your account. We reserve
                the right to suspend or terminate accounts that violate these
                terms or contain inaccurate information.
              </p>
            </section>

            {/* Booking and Appointments */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Booking and Appointments
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                Appointments can be booked through our website, by phone, or as
                walk-ins (subject to availability). When booking, please provide
                accurate information about your dog including breed, size,
                temperament, and any health concerns. This helps us provide the
                best and safest grooming experience.
              </p>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                <span className="font-medium text-[#434E54]">
                  Cancellation Policy:
                </span>{' '}
                We ask that you provide at least 24 hours notice for
                cancellations or rescheduling. Repeated no-shows or late
                cancellations may result in a cancellation fee or limitations on
                future booking privileges.
              </p>
              <p className="text-[#6B7280] leading-relaxed">
                <span className="font-medium text-[#434E54]">
                  Late Arrivals:
                </span>{' '}
                If you arrive more than 15 minutes late for your scheduled
                appointment, we may need to reschedule to accommodate other
                clients.
              </p>
            </section>

            {/* Pet Health and Safety */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Pet Health and Safety
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                The health and safety of every dog in our care is our top
                priority. By using our services, you represent and agree that
                your dog is current on vaccinations as recommended by your
                veterinarian, your dog is free from contagious diseases,
                parasites, or conditions that may affect other animals, and you
                will disclose any known behavioral issues, allergies, health
                conditions, or medications.
              </p>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                <span className="font-medium text-[#434E54]">
                  Health Discoveries:
                </span>{' '}
                During grooming, we may discover pre-existing conditions such as
                skin irritation, lumps, parasites, ear infections, or dental
                issues. We will notify you of any findings but we are not
                veterinary professionals and our observations should not be
                considered medical diagnoses. We recommend consulting your
                veterinarian for any health concerns.
              </p>
              <p className="text-[#6B7280] leading-relaxed">
                <span className="font-medium text-[#434E54]">
                  Safety Measures:
                </span>{' '}
                We reserve the right to refuse service, stop a grooming session,
                or modify services if we determine that a dog poses a safety
                risk to our staff, other animals, or itself. In such cases, we
                will contact you immediately. Partial charges may apply for work
                already completed.
              </p>
            </section>

            {/* Pricing and Payment */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Pricing and Payment
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                Our prices are based on your dog&apos;s size category (small,
                medium, large, and extra-large), the services selected, and any
                add-on treatments. Final pricing may be adjusted based on coat
                condition, matting, or special requirements identified during the
                grooming session. We will communicate any price adjustments
                before proceeding with additional work.
              </p>
              <p className="text-[#6B7280] leading-relaxed">
                Payment is due at the time of service unless other arrangements
                have been agreed upon. We accept major credit and debit cards.
                Payment processing is handled securely through our third-party
                payment processor, Stripe. We do not store your full payment
                card details on our systems.
              </p>
            </section>

            {/* Loyalty Program and Memberships */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Loyalty Program and Memberships
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We may offer loyalty programs, memberships, or promotional
                offers from time to time. These programs are subject to their
                own specific terms and conditions which will be provided at the
                time of enrollment. We reserve the right to modify, suspend, or
                discontinue any loyalty or membership program at our discretion
                with reasonable notice. Points or rewards have no cash value and
                are non-transferable unless otherwise stated.
              </p>
            </section>

            {/* Liability Limitations */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Limitation of Liability
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                While we take every precaution to ensure the safety and
                well-being of your pet, dog grooming involves inherent risks. We
                exercise the utmost care, but minor nicks, brush burns, or
                stress reactions can occasionally occur, particularly with dogs
                that are anxious, aggressive, or have pre-existing skin
                conditions.
              </p>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                To the maximum extent permitted by California law,{' '}
                {businessInfo.name} shall not be held liable for any
                pre-existing medical conditions discovered or aggravated during
                grooming, injuries resulting from a dog&apos;s own behavior such
                as biting, excessive movement, or panic, adverse reactions to
                grooming products (though we use hypoallergenic products
                whenever possible), cosmetic results that differ from your
                expectations due to coat condition, or lost personal items left
                at our facility.
              </p>
              <p className="text-[#6B7280] leading-relaxed">
                If an injury or incident occurs during grooming, we will notify
                you immediately and seek veterinary care if necessary. We
                maintain liability insurance for our services.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Intellectual Property
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                All content on our website, including text, images,
                photographs, logos, graphics, and software, is the property of{' '}
                {businessInfo.name} or our content providers and is protected by
                copyright and other intellectual property laws. You may not
                reproduce, distribute, modify, or create derivative works from
                our content without our prior written consent.
              </p>
            </section>

            {/* Photo and Media */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Photos and Media
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We may take photos or videos of your dog during grooming
                sessions for use in grooming report cards, our website gallery,
                or social media pages. By using our services, you grant us
                permission to use images of your pet for promotional purposes.
                If you do not wish for your dog&apos;s photos to be used, please
                notify us in writing.
              </p>
            </section>

            {/* User Conduct */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                User Conduct
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                When using our website, you agree not to use the site for any
                unlawful purpose, attempt to gain unauthorized access to any
                part of the website, interfere with the proper operation of the
                website, submit false or misleading information, or use
                automated tools to scrape or collect data from the website. We
                reserve the right to restrict access for violations of these
                terms.
              </p>
            </section>

            {/* Reviews and Feedback */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Reviews and Feedback
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We value your feedback and reviews. By submitting a review or
                testimonial, you grant us a non-exclusive, royalty-free license
                to use, display, and share your review on our website and
                marketing materials. Reviews should be honest, accurate, and
                based on your genuine experience with our services.
              </p>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Disclaimer of Warranties
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                Our website and services are provided on an &quot;as is&quot;
                and &quot;as available&quot; basis. We make no warranties,
                expressed or implied, regarding the operation of our website, the
                accuracy of information provided, or the results of our grooming
                services. We disclaim all warranties to the maximum extent
                permitted by California law, including implied warranties of
                merchantability and fitness for a particular purpose.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Indemnification
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                You agree to indemnify and hold harmless {businessInfo.name},
                its owners, employees, and agents from any claims, damages,
                losses, or expenses (including reasonable attorney&apos;s fees)
                arising from your use of our website or services, your violation
                of these terms, your pet&apos;s behavior causing injury to our
                staff or damage to our property, or any inaccurate information
                you provide about your pet.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Governing Law
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                These Terms of Service are governed by and construed in
                accordance with the laws of the State of California, without
                regard to its conflict of law principles. Any disputes arising
                from these terms or your use of our services shall be resolved
                in the courts of Los Angeles County, California.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Changes to These Terms
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We reserve the right to update or modify these Terms of Service
                at any time. Changes will be effective immediately upon posting
                to our website. Your continued use of our website or services
                after changes are posted constitutes your acceptance of the
                revised terms. We encourage you to review these terms
                periodically.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Contact Us
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                If you have questions about these Terms of Service, please
                contact us:
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
          </div>
        </div>
      </div>
    </div>
  );
}
