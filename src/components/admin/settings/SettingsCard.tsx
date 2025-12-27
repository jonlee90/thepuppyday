/**
 * Settings Card Component
 * Task 0158: Navigation card for settings sections
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Image,
  Calendar,
  Gift,
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { formatRelativeTime } from '@/app/admin/notifications/log/utils';
import type { SettingsSectionMetadata } from '@/types/settings-dashboard';

interface SettingsCardProps {
  section: SettingsSectionMetadata;
}

const iconMap = {
  FileText,
  Image,
  Calendar,
  Gift,
  Users,
};

const statusConfig = {
  configured: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Configured',
  },
  needs_attention: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Needs Attention',
  },
  not_configured: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    label: 'Not Configured',
  },
};

export function SettingsCard({ section }: SettingsCardProps) {
  const Icon = iconMap[section.icon];
  const statusDetails = statusConfig[section.status];
  const StatusIcon = statusDetails.icon;

  return (
    <Link href={section.href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className="
          bg-white rounded-xl shadow-sm border border-[#434E54]/10
          p-6 hover:shadow-lg transition-all duration-200
          group cursor-pointer
        "
      >
        {/* Header: Icon + Title + Arrow */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-12 h-12 bg-[#EAE0D5] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Icon className="w-6 h-6 text-[#434E54]" />
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[#434E54] group-hover:text-[#363F44] transition-colors">
                  {section.title}
                </h3>
                {section.badge && (
                  <span className="badge badge-sm bg-[#F59E0B] text-white border-none">
                    {section.badge}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-[#434E54]/40 group-hover:text-[#434E54] group-hover:translate-x-1 transition-all" />
        </div>

        {/* Description */}
        <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
          {section.description}
        </p>

        {/* Status Badge + Summary */}
        <div className="space-y-2">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusDetails.bgColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusDetails.color}`} />
              <span className={`text-xs font-medium ${statusDetails.color}`}>
                {statusDetails.label}
              </span>
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm text-[#434E54]/70">
            {section.summary}
          </p>

          {/* Last Updated */}
          {section.lastUpdated && (
            <p className="text-xs text-[#434E54]/50">
              Last updated {formatRelativeTime(section.lastUpdated)}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
