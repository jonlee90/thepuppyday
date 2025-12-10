'use client';

/**
 * Admin dashboard placeholder
 */

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={signOut} variant="ghost">
            Sign Out
          </Button>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Welcome, {user?.first_name}!</h2>
            <p className="text-base-content/60">
              This is the admin panel. Phase 5-6 will add appointment management, CRM, and advanced features.
            </p>

            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <h3 className="font-semibold mb-2">Admin User Info:</h3>
              <p>Email: {user?.email}</p>
              <p>Role: {user?.role}</p>
              <p>ID: {user?.id}</p>
            </div>

            <div className="divider">Coming in Phase 5-6</div>

            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Appointment calendar and management</li>
              <li>Customer CRM</li>
              <li>Report card creation</li>
              <li>Waitlist management</li>
              <li>Analytics dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
