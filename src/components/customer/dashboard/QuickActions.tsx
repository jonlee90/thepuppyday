/**
 * Quick Actions widget for dashboard
 * Provides shortcuts to common actions
 */

'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useBookingModal } from '@/hooks/useBookingModal';

interface QuickAction {
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  primary?: boolean;
}

const staticQuickActions: Omit<QuickAction, 'onClick'>[] = [
  {
    label: 'Book Appointment',
    description: 'Schedule your next grooming',
    primary: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: 'Add Pet',
    description: 'Register a new furry friend',
    href: '/pets/new',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
      </svg>
    ),
  },
  {
    label: 'View Report Cards',
    description: 'See grooming history',
    href: '/report-cards',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Loyalty Rewards',
    description: 'Check your progress',
    href: '/loyalty',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
];

interface QuickActionsProps {
  showAll?: boolean;
}

export function QuickActions({ showAll = false }: QuickActionsProps) {
  const { open: openBookingModal } = useBookingModal();

  const handleBookAppointment = useCallback(() => {
    openBookingModal({ mode: 'customer' });
  }, [openBookingModal]);

  const quickActions: QuickAction[] = useMemo(
    () =>
      staticQuickActions.map((a) =>
        a.label === 'Book Appointment'
          ? { ...a, onClick: handleBookAppointment }
          : a
      ),
    [handleBookAppointment]
  );

  const displayActions = showAll ? quickActions : quickActions.slice(0, 4);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#434E54]/10">
        <h3 className="font-bold text-[#434E54]">Quick Actions</h3>
      </div>

      {/* Actions grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {displayActions.map((action, index) => {
          const className = `
            block w-full text-left p-4 rounded-lg transition-all duration-200
            ${action.primary
              ? 'bg-[#434E54] text-white hover:bg-[#434E54]/90 shadow-md hover:shadow-lg'
              : 'bg-[#EAE0D5]/30 text-[#434E54] hover:bg-[#EAE0D5]/50'
            }
          `;
          const inner = (
            <>
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center mb-3
                ${action.primary ? 'bg-white/20' : 'bg-[#434E54]/10'}
              `}>
                {action.icon}
              </div>
              <p className="font-semibold text-sm mb-0.5">{action.label}</p>
              <p className={`text-xs ${action.primary ? 'text-white/70' : 'text-[#434E54]/60'}`}>
                {action.description}
              </p>
            </>
          );
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {action.onClick ? (
                <button onClick={action.onClick} className={className}>{inner}</button>
              ) : (
                <Link href={action.href!} className={className}>{inner}</Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
