'use client';

/**
 * Customer dashboard placeholder
 */

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function CustomerDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <Button onClick={signOut} variant="ghost">
            Sign Out
          </Button>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Welcome, {user?.first_name}!</h2>
            <p className="text-base-content/60">
              This is your customer dashboard. Phase 2-4 will add booking, appointments, and pet management features.
            </p>

            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <h3 className="font-semibold mb-2">User Info:</h3>
              <p>Email: {user?.email}</p>
              <p>Role: {user?.role}</p>
              <p>ID: {user?.id}</p>
            </div>

            <div className="divider">Phase 1 Complete</div>

            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ Next.js 14 with TypeScript</li>
              <li>✅ Tailwind CSS + DaisyUI</li>
              <li>✅ Mock Supabase with localStorage</li>
              <li>✅ Authentication system</li>
              <li>✅ Protected routes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
