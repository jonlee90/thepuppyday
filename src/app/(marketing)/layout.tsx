/**
 * Marketing site layout
 */

import { Header } from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';
import { AnnouncementBars } from '@/components/marketing/announcement-bars';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBars />
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
