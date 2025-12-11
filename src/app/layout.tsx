import type { Metadata } from 'next';
import { Nunito, Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import './globals.css';

// Playful heading font for Neubrutalism design
const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
});

// Clean body font
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://thepuppyday.com'),
  title: 'The Puppy Day - Professional Dog Grooming in La Mirada, CA',
  description:
    'Professional pet grooming services in La Mirada, CA. Book your appointment online for a gentle, stress-free grooming experience for your furry friend.',
  keywords: ['dog grooming', 'pet grooming', 'La Mirada', 'California', 'pet salon'],
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
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
      <body className={`${nunito.variable} ${inter.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
