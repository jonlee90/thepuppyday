/**
 * Stats strip for customer dashboard — total visits, pets, member since
 */

'use client';

import { motion } from 'framer-motion';

interface DashboardStatsBarProps {
  totalVisits: number;
  petCount: number;
  memberSince: string;
}

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function DashboardStatsBar({ totalVisits, petCount, memberSince }: DashboardStatsBarProps) {
  const stats = [
    {
      label: 'Total Visits',
      value: totalVisits.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      ),
    },
    {
      label: petCount === 1 ? 'Pet' : 'Pets',
      value: petCount.toString(),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
        </svg>
      ),
    },
    {
      label: 'Member Since',
      value: formatMemberSince(memberSince),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-[#EAE0D5]/60 flex items-center justify-center text-[#434E54]/70 flex-shrink-0">
            {stat.icon}
          </div>
          <div>
            <p className="text-lg font-bold text-[#434E54] leading-none">{stat.value}</p>
            <p className="text-xs text-[#434E54]/60 mt-0.5">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
