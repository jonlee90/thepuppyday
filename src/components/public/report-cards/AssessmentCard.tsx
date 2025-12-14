'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AssessmentCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
}

/**
 * AssessmentCard - Individual card showing a single assessment metric
 * Color-coded based on assessment value
 */
export function AssessmentCard({
  icon: Icon,
  label,
  value,
  color,
}: AssessmentCardProps) {
  // Color mappings for assessments
  const colorClasses = {
    green: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    yellow: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-700',
      border: 'border-red-200',
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`
        ${colors.bg} ${colors.border}
        p-6 rounded-xl border shadow-sm hover:shadow-md
        transition-all duration-200
      `}
    >
      {/* Icon */}
      <div className={`${colors.icon} mb-4`}>
        <Icon className="w-8 h-8" strokeWidth={1.5} />
      </div>

      {/* Label */}
      <h3 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        {label}
      </h3>

      {/* Value */}
      <p className={`text-2xl font-bold ${colors.text} capitalize`}>
        {value}
      </p>
    </motion.div>
  );
}
