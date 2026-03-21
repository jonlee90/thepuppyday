import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { ErrorFilter } from './ErrorFilter';
import { SwUnregister } from '@/components/common/SwUnregister';
import './globals.css';

// Distinctive heading font
const bricolage = Bricolage_Grotesque({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['200', '700', '800'],
  display: 'swap',
});

// Clean body font
const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#434E54',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://thepuppyday.com'),
  title: 'The Puppy Day - Professional Dog Grooming in La Mirada, CA',
  description:
    'Professional pet grooming services in La Mirada, CA. Book your appointment online for a gentle, stress-free grooming experience for your furry friend.',
  keywords: ['dog grooming', 'pet grooming', 'La Mirada', 'California', 'pet salon'],
  applicationName: 'Puppy Day',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Puppy Day',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'The Puppy Day - Professional Dog Grooming',
    description: 'Professional pet grooming services in La Mirada, CA',
    images: ['/images/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://jajbtwgbhrkvgxvvruaa.supabase.co" />
      </head>
      <body suppressHydrationWarning className={`${bricolage.variable} ${dmSans.variable} antialiased`}>
        {/* Skip to content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#434E54] focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* ARIA live regions for screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" />
        <div aria-live="assertive" aria-atomic="true" className="sr-only" />

        <ErrorFilter />
        <SwUnregister />
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
