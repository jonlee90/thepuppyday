/**
 * Loyalty Punch Card Widget
 * Animated punch card with paw stamps for "Buy X, Get 1 Free" program
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface PunchInfo {
  punchNumber: number;
  date: string;
  serviceName?: string;
}

interface LoyaltyPunchCardProps {
  currentPunches: number;
  threshold: number; // Total punches needed for free wash
  freeWashesAvailable: number;
  isCloseToGoal?: boolean; // Within 2 punches
  punches?: PunchInfo[];
  onRedeemClick?: () => void;
  onViewHistoryClick?: () => void;
  showConfetti?: boolean;
  compact?: boolean;
}

// Paw print SVG component
const PawPrint = ({ filled, index, punchInfo }: { filled: boolean; index: number; punchInfo?: PunchInfo }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: index * 0.08,
        }}
        whileHover={{ scale: 1.15, rotate: 5 }}
        onMouseEnter={() => filled && punchInfo && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-default
          transition-all duration-200
          ${filled
            ? 'bg-[#434E54] text-white shadow-md'
            : 'bg-[#EAE0D5]/50 text-[#434E54]/30 border-2 border-dashed border-[#434E54]/20'
          }
        `}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 sm:w-6 sm:h-6"
        >
          {/* Paw print icon */}
          <ellipse cx="12" cy="17" rx="3" ry="2.5" />
          <ellipse cx="6" cy="13" rx="2" ry="2.5" />
          <ellipse cx="18" cy="13" rx="2" ry="2.5" />
          <ellipse cx="8" cy="8" rx="2" ry="2" />
          <ellipse cx="16" cy="8" rx="2" ry="2" />
        </svg>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && punchInfo && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10"
          >
            <div className="bg-[#434E54] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              <p className="font-medium">{new Date(punchInfo.date).toLocaleDateString()}</p>
              {punchInfo.serviceName && (
                <p className="text-white/70">{punchInfo.serviceName}</p>
              )}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-[#434E54]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function LoyaltyPunchCard({
  currentPunches,
  threshold,
  freeWashesAvailable,
  isCloseToGoal = false,
  punches = [],
  onRedeemClick,
  showConfetti = false,
  compact = false,
}: LoyaltyPunchCardProps) {
  const [localConfetti, setLocalConfetti] = useState(showConfetti);
  const totalSlots = threshold + 1; // Include the free wash slot
  const progressPercentage = (currentPunches / threshold) * 100;
  const punchesUntilFree = threshold - currentPunches;
  const hasEarnedFreeWash = currentPunches >= threshold || freeWashesAvailable > 0;

  // Trigger confetti when free wash is earned
  useEffect(() => {
    if (hasEarnedFreeWash && showConfetti) {
      setLocalConfetti(true);
      const timer = setTimeout(() => setLocalConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasEarnedFreeWash, showConfetti]);

  // Get progress message
  const getProgressMessage = () => {
    if (freeWashesAvailable > 0) {
      return (
        <span className="text-[#434E54] font-bold">
          FREE WASH EARNED! 🎉
        </span>
      );
    }
    if (punchesUntilFree <= 2 && punchesUntilFree > 0) {
      return (
        <span className="text-[#434E54] font-semibold">
          Almost there! Just {punchesUntilFree} more visit{punchesUntilFree > 1 ? 's' : ''}! 🐾
        </span>
      );
    }
    return (
      <span className="text-[#434E54]/70">
        {currentPunches} of {threshold} paws collected
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden
        ${compact ? 'p-4' : 'p-6'}
        ${hasEarnedFreeWash ? 'ring-2 ring-[#434E54]/30' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold text-[#434E54] ${compact ? 'text-base' : 'text-lg'}`}>
            Loyalty Rewards
          </h3>
          {freeWashesAvailable > 0 && (
            <span className="bg-[#434E54] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {freeWashesAvailable} FREE
            </span>
          )}
        </div>
        <Link
          href="/loyalty"
          className="text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
        >
          View History →
        </Link>
      </div>

      {/* Paw stamps grid */}
      <div className={`
        grid gap-2 sm:gap-3 mb-4
        ${compact ? 'grid-cols-5' : 'grid-cols-5 sm:grid-cols-5'}
      `}>
        {Array.from({ length: totalSlots }).map((_, index) => {
          const isFreeWashSlot = index === threshold;
          const isFilled = index < currentPunches;
          const punchInfo = punches.find(p => p.punchNumber === index + 1);

          if (isFreeWashSlot) {
            return (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.08, type: 'spring' }}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                  ${freeWashesAvailable > 0
                    ? 'bg-[#434E54] text-white shadow-lg'
                    : 'bg-[#EAE0D5]/30 text-[#434E54]/40 border-2 border-dashed border-[#434E54]/20'
                  }
                `}
              >
                <span className="text-xs font-bold">FREE</span>
              </motion.div>
            );
          }

          return (
            <PawPrint
              key={index}
              filled={isFilled}
              index={index}
              punchInfo={isFilled ? punchInfo : undefined}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#EAE0D5] rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
          className="h-full bg-[#434E54] rounded-full"
        />
      </div>

      {/* Progress text */}
      <div className="text-center text-sm mb-4">
        {getProgressMessage()}
      </div>

      {/* Redeem button (when free wash available) */}
      {freeWashesAvailable > 0 && onRedeemClick && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRedeemClick}
          className="w-full py-3 px-4 rounded-lg bg-[#434E54] text-white font-semibold
                   hover:bg-[#434E54]/90 transition-all duration-200
                   shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          Redeem Free Wash
        </motion.button>
      )}

      {/* How it works (compact only shows when no punches) */}
      {!compact && currentPunches === 0 && (
        <div className="mt-4 pt-4 border-t border-[#434E54]/10">
          <p className="text-xs text-[#434E54]/60 text-center">
            Get {threshold} grooming visits and earn a <strong>FREE wash</strong>! 🎉
          </p>
        </div>
      )}
    </motion.div>
  );
}
