import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicReportCard } from '@/components/public/report-cards/PublicReportCard';
import type { PublicReportCard as PublicReportCardType } from '@/types/report-card';

interface PageProps {
  params: Promise<{
    uuid: string;
  }>;
}

/**
 * Fetch report card data from API
 */
async function getReportCard(uuid: string): Promise<{
  data: PublicReportCardType | null;
  error: string | null;
  status: number;
}> {
  try {
    // In production, use full URL. In development, construct from env
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/report-cards/${uuid}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: errorData.error || 'Failed to load report card',
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      error: null,
      status: 200,
    };
  } catch (error) {
    console.error('Error fetching report card:', error);
    return {
      data: null,
      error: 'Failed to load report card',
      status: 500,
    };
  }
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  const { data, error } = await getReportCard(uuid);

  if (error || !data) {
    return {
      title: 'Report Card Not Found - The Puppy Day',
      description: 'This grooming report card could not be found.',
    };
  }

  return {
    title: `${data.pet_name}'s Grooming Report Card - The Puppy Day`,
    description: `View ${data.pet_name}'s ${data.service_name} grooming report card from The Puppy Day. See before and after photos, assessments, and groomer notes.`,
    openGraph: {
      title: `${data.pet_name}'s Grooming Report Card`,
      description: `${data.pet_name} just got pampered at The Puppy Day! Check out the transformation.`,
      images: data.after_photo_url
        ? [
            {
              url: data.after_photo_url,
              width: 1200,
              height: 630,
              alt: `${data.pet_name} after grooming`,
            },
          ]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.pet_name}'s Grooming Report Card`,
      description: `${data.pet_name} just got pampered at The Puppy Day!`,
      images: data.after_photo_url ? [data.after_photo_url] : [],
    },
  };
}

/**
 * Public Report Card Page
 * Server component that fetches data and renders the client component
 */
export default async function ReportCardPage({ params }: PageProps) {
  const { uuid } = await params;
  const { data, error, status } = await getReportCard(uuid);

  // Handle 404 - Report card not found
  if (status === 404 || !data) {
    notFound();
  }

  // Handle 410 - Report card expired
  if (status === 410) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#434E54] mb-2">
              Report Card Expired
            </h1>
            <p className="text-[#6B7280] mb-6">
              This report card link has expired and is no longer available.
              Please contact The Puppy Day if you need access.
            </p>
            <a
              href="/"
              className="inline-block bg-[#434E54] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#363F44] transition-colors duration-200"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Handle 500 - Server error
  if (status === 500 || error) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#434E54] mb-2">
              Something Went Wrong
            </h1>
            <p className="text-[#6B7280] mb-6">
              We encountered an error loading this report card. Please try again
              later or contact us for assistance.
            </p>
            <a
              href="/"
              className="inline-block bg-[#434E54] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#363F44] transition-colors duration-200"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Success - render the report card
  return <PublicReportCard reportCard={data} />;
}
