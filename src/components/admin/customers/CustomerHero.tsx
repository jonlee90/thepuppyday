/**
 * CustomerHero Component
 * Full-width hero card displaying customer identity, metrics, flags, and action buttons.
 * Task 0061: Create CustomerHero Component
 */

'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Phone, Calendar } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { CustomerFlagBadge } from './CustomerFlagBadge';
import { isWalkinPlaceholderEmail, getInitials } from '@/lib/utils';
import { formatPhoneNumber } from '@/hooks/usePhoneMask';
import type { CustomerMetrics } from './AppointmentHistoryList';
import type { User, Pet, CustomerFlag } from '@/types/database';

export interface CustomerDetail extends User {
  pets: Pet[];
  flags: CustomerFlag[];
  loyalty_points: Record<string, unknown> | null;
  loyalty_transactions: Record<string, unknown>[];
}

interface CustomerHeroProps {
  customer: CustomerDetail;
  metrics: CustomerMetrics;
  onBookAppointment: () => void;
  onAddPet: () => void;
}

interface StatItem {
  label: string;
  value: string;
}

function formatAvgFrequency(days: number | null): string {
  if (days === null) return 'N/A';
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  return `${weeks}w`;
}

export function CustomerHero({
  customer,
  metrics,
  onBookAppointment,
  onAddPet,
}: CustomerHeroProps) {
  const initials = getInitials(customer.first_name, customer.last_name);
  const isWalkin = isWalkinPlaceholderEmail(customer.email);

  const stats: StatItem[] = [
    {
      label: 'Visits',
      value: metrics.total_appointments > 0 ? String(metrics.total_appointments) : 'N/A',
    },
    {
      label: 'Spent',
      value:
        metrics.total_spent > 0
          ? `$${metrics.total_spent.toFixed(0)}`
          : 'N/A',
    },
    {
      label: 'Favorite',
      value: metrics.favorite_service || 'N/A',
    },
    {
      label: 'Frequency',
      value: formatAvgFrequency(metrics.avg_visit_frequency_days),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Accent strip */}
      <div className="h-1.5 bg-gradient-to-r from-[#D4A574] to-[#E8C49A]" />

      <div className="p-6">
        {/* Desktop layout: flex row; Mobile layout: flex column */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">

          {/* Avatar + customer info */}
          <div className="flex items-center gap-4 lg:flex-shrink-0">
            <div className="w-16 h-16 rounded-xl bg-[#EAE0D5] text-[#434E54] text-xl font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#434E54] leading-tight">
                {customer.first_name} {customer.last_name}
              </h1>
              {isWalkin ? (
                <p className="text-sm text-gray-400 italic mt-0.5">Walk-in (phone only)</p>
              ) : (
                <p className="text-sm text-[#434E54]/60 mt-0.5 truncate">{customer.email}</p>
              )}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {customer.phone && (
                  <div className="flex items-center gap-1 text-sm text-[#434E54]/60">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{formatPhoneNumber(customer.phone)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-[#434E54]/60">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Since {format(new Date(customer.created_at), 'MMM yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flags -- inline on desktop, row on mobile */}
          {customer.flags.length > 0 && (
            <div className="mt-4 lg:mt-0 lg:flex-shrink-0">
              <CustomerFlagBadge flags={customer.flags} maxVisible={5} size="md" />
            </div>
          )}

          {/* Stats row -- spacer pushes to right on desktop */}
          <div className="mt-4 lg:mt-0 lg:ml-auto">
            {/* Desktop: horizontal flex with dividers */}
            <div className="hidden lg:flex items-center gap-0">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  {i > 0 && <div className="w-px h-8 bg-[#F0EAE0] mx-4" />}
                  <div className="text-center">
                    <p
                      className="text-2xl font-bold text-[#434E54] leading-none truncate max-w-[80px]"
                      title={stat.value}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[#434E54]/50 mt-1">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: 2x2 grid */}
            <div className="grid grid-cols-2 gap-4 lg:hidden">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p
                    className="text-2xl font-bold text-[#434E54] leading-none truncate"
                    title={stat.value}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[#434E54]/50 mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 lg:mt-0 lg:flex-shrink-0 flex gap-2 lg:flex-col xl:flex-row">
            <AdminButton
              variant="primary"
              size="sm"
              onClick={onBookAppointment}
              className="flex-1 lg:flex-none"
            >
              Book Appointment
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={onAddPet}
              className="flex-1 lg:flex-none"
            >
              Add Pet
            </AdminButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
