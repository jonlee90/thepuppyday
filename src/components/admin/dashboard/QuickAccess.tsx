/**
 * Quick Access Pills Component
 * Compact icon+label pill navigation to key admin sections
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Scissors,
  Users,
  Calendar,
  Settings,
  BarChart2,
  Clock,
} from 'lucide-react';

interface QuickAccessPillProps {
  title: string;
  href: string;
  icon: React.ElementType;
  index: number;
}

function QuickAccessPill({ title, href, icon: Icon, index }: QuickAccessPillProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
    >
      <Link
        href={href}
        aria-label={`Navigate to ${title}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-[#434E54]"
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        {title}
      </Link>
    </motion.div>
  );
}

const PILLS = [
  { title: 'Appointments', href: '/admin/appointments', icon: Calendar },
  { title: 'Waitlist', href: '/admin/waitlist', icon: Clock },
  { title: 'Customers', href: '/admin/customers', icon: Users },
  { title: 'Services', href: '/admin/services', icon: Scissors },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export function QuickAccess() {
  return (
    <nav aria-label="Quick access navigation">
      <div className="flex flex-wrap gap-3">
        {PILLS.map((pill, index) => (
          <QuickAccessPill key={pill.href} {...pill} index={index} />
        ))}
      </div>
    </nav>
  );
}
