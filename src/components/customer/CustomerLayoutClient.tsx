'use client';

import { CustomerNav } from '@/components/customer/CustomerNav';
import { Toaster } from '@/components/ui/toaster';
import { BookingModalProvider } from '@/components/booking';

interface CustomerLayoutClientProps {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
  loyaltyEnabled: boolean;
}

export function CustomerLayoutClient({ children, user, loyaltyEnabled }: CustomerLayoutClientProps) {
  return (
    <BookingModalProvider>
      <div className="min-h-screen bg-[#F8EEE5]">
        <CustomerNav user={user} loyaltyEnabled={loyaltyEnabled} />

        <main id="main-content" className="lg:pl-64 pb-20 lg:pb-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>

        <Toaster />
      </div>
    </BookingModalProvider>
  );
}
