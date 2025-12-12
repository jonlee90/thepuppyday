/**
 * Admin Dashboard Page
 * Overview of key metrics and recent activity
 */

'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="mt-2 text-[#434E54]/60">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Appointments"
          value="8"
          icon={Calendar}
          trend="+2 from yesterday"
          trendUp={true}
        />
        <StatCard
          title="Total Customers"
          value="142"
          icon={Users}
          trend="+5 this week"
          trendUp={true}
        />
        <StatCard
          title="Revenue (MTD)"
          value="$4,250"
          icon={DollarSign}
          trend="+12% from last month"
          trendUp={true}
        />
        <StatCard
          title="Avg Rating"
          value="4.9"
          icon={TrendingUp}
          trend="Excellent"
          trendUp={true}
        />
      </div>

      {/* Placeholder for upcoming features */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">
          Upcoming Features
        </h2>
        <ul className="space-y-2 text-[#434E54]/70">
          <li>• Recent appointments list</li>
          <li>• Quick actions panel</li>
          <li>• Revenue charts</li>
          <li>• Customer activity feed</li>
        </ul>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
}

function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#434E54]/60 mb-1">{title}</p>
          <p className="text-3xl font-bold text-[#434E54]">{value}</p>
          <p
            className={`text-xs mt-2 ${
              trendUp ? 'text-green-600' : 'text-[#434E54]/60'
            }`}
          >
            {trend}
          </p>
        </div>
        <div className="w-12 h-12 bg-[#EAE0D5] rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#434E54]" />
        </div>
      </div>
    </div>
  );
}
