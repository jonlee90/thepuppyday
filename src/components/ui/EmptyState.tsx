/**
 * Empty state component for sections with no data
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export type EmptyStateIcon = 'calendar' | 'dog' | 'file' | 'gift' | 'search' | 'photo';

interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const icons: Record<EmptyStateIcon, React.ReactElement> = {
  calendar: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  dog: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 15h4" />
    </svg>
  ),
  file: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  gift: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  search: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  photo: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const ActionButton = () => {
    if (!action) return null;

    const buttonClasses = `
      inline-flex items-center justify-center gap-2
      bg-[#434E54] text-white font-semibold
      px-6 py-3 rounded-lg
      hover:bg-[#434E54]/90 transition-all duration-200
      shadow-md hover:shadow-lg
    `;

    if (action.href) {
      return (
        <Link href={action.href} className={buttonClasses}>
          {action.label}
        </Link>
      );
    }

    return (
      <button onClick={action.onClick} className={buttonClasses}>
        {action.label}
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-[#EAE0D5] flex items-center justify-center text-[#434E54]/60 mb-6"
      >
        {icons[icon]}
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-bold text-[#434E54] mb-2">{title}</h3>

      {/* Description */}
      <p className="text-[#434E54]/70 max-w-sm mb-6">{description}</p>

      {/* Action Button */}
      <ActionButton />
    </motion.div>
  );
}
