/**
 * Auth layout - minimal layout for login/register pages
 */

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple header with logo */}
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">The Puppy Day</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Simple footer */}
      <footer className="p-4 text-center text-sm text-base-content/60">
        <p>&copy; {new Date().getFullYear()} The Puppy Day. All rights reserved.</p>
      </footer>
    </div>
  );
}
