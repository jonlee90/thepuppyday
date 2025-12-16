/**
 * Quick Access Cards Component
 * Provides quick navigation to key admin sections
 */

'use client';

import Link from 'next/link';
import {
  Scissors,
  Plus,
  Users,
  Calendar,
  Images,
  Settings,
  BarChart3,
  Clock,
} from 'lucide-react';

interface QuickAccessCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color?: string;
}

function QuickAccessCard({
  title,
  description,
  href,
  icon: Icon,
  color = 'bg-[#EAE0D5]',
}: QuickAccessCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-6 h-6 text-[#434E54]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#434E54] mb-1">
            {title}
          </h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function QuickAccess() {
  const quickAccessItems: QuickAccessCardProps[] = [
    {
      title: 'Appointments',
      description: 'View and manage upcoming appointments',
      href: '/admin/appointments',
      icon: Calendar,
      color: 'bg-[#EAE0D5]',
    },
    {
      title: 'Waitlist',
      description: 'Manage waitlist and fill available slots',
      href: '/admin/waitlist',
      icon: Clock,
      color: 'bg-[#EAE0D5]',
    },
    {
      title: 'Customers',
      description: 'Browse customer profiles and history',
      href: '/admin/customers',
      icon: Users,
      color: 'bg-[#EAE0D5]',
    },
    {
      title: 'Services',
      description: 'Configure grooming services and pricing',
      href: '/admin/services',
      icon: Scissors,
      color: 'bg-[#EAE0D5]',
    },
    {
      title: 'Add-ons',
      description: 'Manage service add-ons and extras',
      href: '/admin/addons',
      icon: Plus,
      color: 'bg-[#EAE0D5]',
    },
    {
      title: 'Gallery',
      description: 'Manage photo gallery and showcase work',
      href: '/admin/gallery',
      icon: Images,
      color: 'bg-[#EAE0D5]',
    },
    {
      title: 'Analytics',
      description: 'View business insights and reports',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-[#EAE0D5]',
    },
    {
      title: 'Settings',
      description: 'Configure system settings and preferences',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-[#EAE0D5]',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#434E54]">Quick Access</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Navigate to key sections of your admin panel
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickAccessItems.map((item) => (
          <QuickAccessCard key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}
