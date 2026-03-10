import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { getBusinessInfo } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Privacy Policy - Puppy Day Dog Grooming',
  description:
    'Read the Puppy Day privacy policy. Learn how we collect, use, and protect your personal information when using our dog grooming services.',
  alternates: { canonical: 'https://thepuppyday.com/privacy' },
};

export const revalidate = 86400;

export default async function PrivacyPolicyPage() {
  const businessInfo = await getBusinessInfo();
  const lastUpdated = 'March 9, 2026';

  return (
    <div className="bg-[#FDF8F4] min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
        />

        <div className="py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#434E54] mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#6B7280] mb-8">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-lg max-w-none text-[#434E54] space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Introduction
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                {businessInfo.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website{' '}
                <Link href="/" className="text-[#A0785D] hover:underline">
                  thepuppyday.com
                </Link>{' '}
                and provides dog grooming services in {businessInfo.city},{' '}
                {businessInfo.state}. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your personal information
                when you visit our website, use our online booking system, or
                utilize our grooming services. By using our website or services,
                you consent to the practices described in this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Information We Collect
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                We collect information that you provide directly to us and
                information collected automatically when you use our website.
              </p>

              <h3 className="text-lg font-medium text-[#434E54] mb-2">
                Information You Provide
              </h3>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                When you create an account, book an appointment, or contact us,
                we may collect your name, email address, phone number, mailing
                address, pet information (name, breed, size, age, health notes,
                and photos), appointment history and preferences, payment
                information (processed securely through our third-party payment
                provider), and any communications you send to us.
              </p>

              <h3 className="text-lg font-medium text-[#434E54] mb-2">
                Information Collected Automatically
              </h3>
              <p className="text-[#6B7280] leading-relaxed">
                When you visit our website, we may automatically collect certain
                information including your IP address, browser type and version,
                operating system, referring URLs, pages visited on our site,
                date and time of visits, and device identifiers. We use cookies
                and similar tracking technologies to enhance your browsing
                experience. Please see our cookie information section below for
                more details.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                How We Use Your Information
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We use your personal information to provide and manage our dog
                grooming services, process and confirm appointment bookings,
                create and manage your customer account, send appointment
                reminders and confirmations via email or SMS, send grooming
                report cards after appointments, process payments for services
                rendered, communicate with you about our services including
                promotions and updates, manage our loyalty program and
                membership benefits, improve our website and customer
                experience, respond to your inquiries and support requests, and
                comply with legal obligations.
              </p>
            </section>

            {/* How We Share Your Information */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                How We Share Your Information
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                We do not sell your personal information to third parties. We
                may share your information with the following types of service
                providers who assist us in operating our business:
              </p>
              <p className="text-[#6B7280] leading-relaxed">
                <span className="font-medium text-[#434E54]">
                  Database and Authentication:
                </span>{' '}
                We use Supabase for secure data storage and account
                authentication.{' '}
                <span className="font-medium text-[#434E54]">
                  Email Communications:
                </span>{' '}
                We use Resend to send appointment confirmations, reminders, and
                report cards.{' '}
                <span className="font-medium text-[#434E54]">
                  SMS Notifications:
                </span>{' '}
                We use Twilio to send text message reminders and notifications.{' '}
                <span className="font-medium text-[#434E54]">
                  Calendar Integration:
                </span>{' '}
                We use Google Calendar to manage scheduling.{' '}
                <span className="font-medium text-[#434E54]">
                  Payment Processing:
                </span>{' '}
                Payment transactions are processed securely through Stripe. We
                do not store your full credit card information on our servers.
              </p>
              <p className="text-[#6B7280] leading-relaxed mt-4">
                We may also disclose your information if required by law, court
                order, or governmental regulation, or if we believe disclosure
                is necessary to protect our rights, your safety, or the safety
                of others.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Cookies and Tracking Technologies
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                Our website uses cookies and similar technologies to provide
                core website functionality such as user authentication and
                session management, remember your preferences and settings,
                analyze website traffic and usage patterns, and improve our
                services. You can control cookie preferences through your
                browser settings. Disabling certain cookies may affect website
                functionality, particularly features that require you to be
                logged in.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Data Security
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We implement appropriate technical and organizational security
                measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction.
                These measures include encryption of data in transit using
                SSL/TLS, secure authentication with hashed passwords, row-level
                security policies on our database, and regular security reviews
                of our systems. While we strive to protect your personal
                information, no method of transmission over the internet or
                electronic storage is 100% secure. We cannot guarantee absolute
                security.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Data Retention
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We retain your personal information for as long as your account
                is active or as needed to provide you services. We may also
                retain your information as necessary to comply with legal
                obligations, resolve disputes, and enforce our agreements. If
                you request deletion of your account, we will delete or
                anonymize your personal information within a reasonable
                timeframe, except where retention is required by law.
              </p>
            </section>

            {/* California Privacy Rights */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Your California Privacy Rights
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                If you are a California resident, you have certain rights under
                the California Consumer Privacy Act (CCPA) and the California
                Online Privacy Protection Act (CalOPPA).
              </p>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                <span className="font-medium text-[#434E54]">
                  Right to Know:
                </span>{' '}
                You have the right to request that we disclose the categories
                and specific pieces of personal information we have collected
                about you, the categories of sources from which we collected it,
                and our business purpose for collecting it.
              </p>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                <span className="font-medium text-[#434E54]">
                  Right to Delete:
                </span>{' '}
                You have the right to request that we delete the personal
                information we have collected from you, subject to certain
                exceptions.
              </p>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                <span className="font-medium text-[#434E54]">
                  Right to Correct:
                </span>{' '}
                You have the right to request that we correct inaccurate
                personal information we maintain about you.
              </p>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                <span className="font-medium text-[#434E54]">
                  Right to Non-Discrimination:
                </span>{' '}
                We will not discriminate against you for exercising any of your
                privacy rights.
              </p>
              <p className="text-[#6B7280] leading-relaxed mb-4">
                <span className="font-medium text-[#434E54]">
                  No Sale of Personal Information:
                </span>{' '}
                We do not sell or share your personal information for
                cross-context behavioral advertising as defined under the CCPA.
              </p>
              <p className="text-[#6B7280] leading-relaxed">
                To exercise any of these rights, please contact us using the
                information provided below. We will respond to verifiable
                consumer requests within 45 days.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Children&apos;s Privacy
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                Our website and services are not directed to children under 13
                years of age. We do not knowingly collect personal information
                from children under 13. If we learn that we have collected
                personal information from a child under 13, we will take steps
                to delete that information promptly. If you believe a child
                under 13 has provided us with personal information, please
                contact us.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Third-Party Links
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                Our website may contain links to third-party websites or
                services, such as our social media profiles on Instagram, Yelp,
                and Facebook. We are not responsible for the privacy practices
                of these third-party sites. We encourage you to review the
                privacy policies of any third-party sites you visit.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Changes to This Privacy Policy
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                We may update this Privacy Policy from time to time. When we
                make changes, we will update the &quot;Last updated&quot; date
                at the top of this page. We encourage you to review this Privacy
                Policy periodically to stay informed about how we are protecting
                your information.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-xl font-semibold text-[#434E54] mb-3">
                Contact Us
              </h2>
              <p className="text-[#6B7280] leading-relaxed">
                If you have questions about this Privacy Policy, would like to
                exercise your California privacy rights, or have concerns about
                how we handle your personal information, please contact us:
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
