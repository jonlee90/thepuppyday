/**
 * Admin Dashboard Page
 * Thin server component — all data fetching is handled client-side
 * by DashboardClient via the useDashboardData hook.
 */

import { DashboardClient } from './DashboardClient';

export const metadata = {
  title: 'Dashboard | The Puppy Day Admin',
};

export default function AdminDashboard() {
  return <DashboardClient />;
}
