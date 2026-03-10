/**
 * Marketing site layout
 * Task 0168: Updated to use dynamic business info from database
 */

import type { Metadata } from 'next';
import { Header } from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';
import { BookingModalProvider } from '@/components/booking';
import { StickyBookingButton } from '@/components/marketing/StickyBookingButton';
import { HashRedirect } from '@/components/marketing/HashRedirect';
import { getBusinessInfo } from '@/lib/site-content';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { summarizeBusinessHours } from '@/lib/utils/business-hours';

export const metadata: Metadata = {
  title: {
    template: '%s | Puppy Day Dog Grooming La Mirada',
    default: 'Puppy Day - Dog Grooming in La Mirada, CA',
  },
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [businessInfo, supabase] = await Promise.all([
    getBusinessInfo(),
    createServerSupabaseClient(),
  ]);

  const { data: settings } = await (supabase as any).from('settings').select('value').eq('key', 'business_hours').single();
  const businessHours = settings?.value || null;

  // Build a compact hours string for the announcement bar (e.g. "Monday - Saturday 9:00 AM - 5:00 PM")
  const hoursText = businessHours
    ? summarizeBusinessHours(businessHours)
        .filter((line) => line.hours !== 'Closed')
        .map((line) => `${line.days} ${line.hours}`)
        .join(' · ')
    : undefined;

  return (
    <BookingModalProvider>
      <HashRedirect />
      <Header hoursText={hoursText} />
      <main className="min-h-screen pt-[160px]">
        {children}
      </main>
      <Footer businessInfo={businessInfo} businessHours={businessHours} />
      <StickyBookingButton />
    </BookingModalProvider>
  );
}
