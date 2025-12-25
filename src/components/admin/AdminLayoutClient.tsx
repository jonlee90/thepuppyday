/**
 * Admin Layout Client Wrapper
 * Provides booking modal context for admin pages
 */

'use client';

import { BookingModalProvider } from '@/components/booking';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  return <BookingModalProvider>{children}</BookingModalProvider>;
}
