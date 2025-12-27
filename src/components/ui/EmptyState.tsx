/**
 * Empty state component for sections with no data
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export type EmptyStateIcon = 'calendar' | 'dog' | 'file' | 'gift' | 'search' | 'photo' | 'notification' | 'chart' | 'settings' | 'users';

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  action?: EmptyStateAction; // Deprecated, kept for backwards compatibility
  className?: string;
  size?: 'sm' | 'md' | 'lg';
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
  notification: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  chart: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  settings: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

// Predefined empty states for common scenarios
export const emptyStates = {
  noAppointments: {
    icon: 'calendar' as const,
    title: 'No appointments yet',
    description: 'Book your first grooming appointment to keep your furry friend looking their best.',
    actions: [{ label: 'Book Appointment', href: '/book', variant: 'primary' as const }],
  },
  noPets: {
    icon: 'dog' as const,
    title: 'No pets added',
    description: 'Add your pets to easily book grooming appointments and track their care history.',
    actions: [{ label: 'Add Your First Pet', href: '/pets/new', variant: 'primary' as const }],
  },
  noSearchResults: {
    icon: 'search' as const,
    title: 'No results found',
    description: 'Try adjusting your search terms or clearing filters to see more results.',
  },
  noNotifications: {
    icon: 'notification' as const,
    title: 'All caught up!',
    description: 'You have no new notifications. Check back later for updates about your appointments.',
  },
  noReportCards: {
    icon: 'file' as const,
    title: 'No report cards yet',
    description: 'After your pet\'s grooming session, you\'ll receive a digital report card with photos and notes.',
  },
  noGalleryImages: {
    icon: 'photo' as const,
    title: 'Gallery is empty',
    description: 'Upload images to showcase your work and attract more customers.',
  },
  noAnalyticsData: {
    icon: 'chart' as const,
    title: 'No data yet',
    description: 'Analytics will appear here once you have appointments and activity to track.',
  },
  noWaitlistEntries: {
    icon: 'calendar' as const,
    title: 'Waitlist is empty',
    description: 'Customers can join the waitlist when their preferred time slots are fully booked.',
  },
};

export function EmptyState({
  icon = 'search',
  title,
  description,
  actions = [],
  action,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  // Support legacy single action prop
  const allActions = action ? [action] : actions;

  const sizeClasses = {
    sm: { container: 'py-8 px-4', icon: 'w-14 h-14', title: 'text-lg', desc: 'text-sm' },
    md: { container: 'py-12 px-6', icon: 'w-20 h-20', title: 'text-xl', desc: 'text-base' },
    lg: { container: 'py-16 px-8', icon: 'w-24 h-24', title: 'text-2xl', desc: 'text-lg' },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center ${sizes.container} ${className}`}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`${sizes.icon} rounded-full bg-[#EAE0D5] flex items-center justify-center text-[#434E54]/60 mb-6`}
      >
        {icons[icon]}
      </motion.div>

      {/* Title */}
      <h3 className={`${sizes.title} font-bold text-[#434E54] mb-2`}>{title}</h3>

      {/* Description */}
      <p className={`${sizes.desc} text-[#434E54]/70 max-w-sm mb-6`}>{description}</p>

      {/* Action Buttons */}
      {allActions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {allActions.map((actionItem, index) => {
            const buttonClass = actionItem.variant === 'primary'
              ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
              : 'bg-[#EAE0D5] text-[#434E54] hover:bg-[#F8EEE5]';

            if (actionItem.href) {
              return (
                <Link
                  key={index}
                  href={actionItem.href}
                  className={`px-6 py-3 font-semibold rounded-lg transition-colors ${buttonClass}`}
                >
                  {actionItem.label}
                </Link>
              );
            }

            return (
              <button
                key={index}
                onClick={actionItem.onClick}
                className={`px-6 py-3 font-semibold rounded-lg transition-colors ${buttonClass}`}
              >
                {actionItem.label}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
