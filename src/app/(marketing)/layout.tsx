/**
 * Marketing site layout
 * Task 0168: Updated to use dynamic business info from database
 */

import { Header } from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';
import { AnnouncementBars } from '@/components/marketing/announcement-bars';
import { BookingModalProvider } from '@/components/booking';
import { StickyBookingButton } from '@/components/marketing/StickyBookingButton';
import { getBusinessInfo } from '@/lib/site-content';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const businessInfo = await getBusinessInfo();

  return (
    <BookingModalProvider>
      <AnnouncementBars />
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer businessInfo={businessInfo} />
      <StickyBookingButton />
    </BookingModalProvider>
  );
}
