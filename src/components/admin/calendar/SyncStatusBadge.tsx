'use client';

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatusBadgeProps {
  appointmentId: string;
  status: 'synced' | 'pending' | 'failed' | 'not_eligible';
  lastSyncedAt?: string;
  error?: string;
  onClick?: () => void;
  showLabel?: boolean;
}

export function SyncStatusBadge({
  appointmentId,
  status,
  lastSyncedAt,
  error,
  onClick,
  showLabel = false,
}: SyncStatusBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // Don't render for not_eligible status
  if (status === 'not_eligible') {
    return null;
  }

  const config = {
    synced: {
      icon: CheckCircle2,
      label: 'Synced',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600',
      hoverBg: 'hover:bg-green-500/20',
      activeBg: 'active:bg-green-500/30',
      focusRing: 'focus:ring-green-500/40',
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600',
      hoverBg: 'hover:bg-amber-500/20',
      activeBg: 'active:bg-amber-500/30',
      focusRing: 'focus:ring-amber-500/40',
    },
    failed: {
      icon: AlertCircle,
      label: 'Failed',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600',
      hoverBg: 'hover:bg-red-500/20',
      activeBg: 'active:bg-red-500/30',
      focusRing: 'focus:ring-red-500/40',
    },
  }[status];

  const Icon = config.icon;

  // Generate tooltip text
  const getTooltipText = () => {
    if (status === 'failed' && error) {
      return `Sync failed: ${error}`;
    }
    if (lastSyncedAt) {
      try {
        const relativeTime = formatDistanceToNow(new Date(lastSyncedAt), {
          addSuffix: true,
        });
        return `Last synced: ${relativeTime}`;
      } catch {
        return 'Last synced: unknown';
      }
    }
    return status === 'pending' ? 'Sync pending' : 'Sync status';
  };

  // Generate ARIA label
  const getAriaLabel = () => {
    const baseLabel = `Sync status: ${config.label}`;
    if (lastSyncedAt) {
      try {
        const relativeTime = formatDistanceToNow(new Date(lastSyncedAt), {
          addSuffix: true,
        });
        return `${baseLabel}. Last synced: ${relativeTime}. Click for details`;
      } catch {
        return `${baseLabel}. Click for details`;
      }
    }
    return `${baseLabel}. Click for details`;
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        role="button"
        tabIndex={0}
        aria-label={getAriaLabel()}
        aria-describedby={`sync-tooltip-${appointmentId}`}
        onClick={onClick}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onFocus={() => setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
        className={`
          inline-flex items-center gap-1.5 px-2 py-1
          rounded-md
          ${config.bgColor} ${config.textColor}
          ${config.hoverBg} ${config.activeBg}
          hover:shadow-sm active:shadow-none
          focus:outline-none focus:ring-2 ${config.focusRing} focus:ring-offset-2
          transition-all duration-150 ease-in-out
          cursor-pointer
          min-h-[24px] md:min-h-[24px]
          touch-manipulation
        `}
      >
        <Icon
          className={`w-4 h-4 ${status === 'pending' ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
        {showLabel && (
          <span className="hidden md:inline text-xs font-medium">
            {config.label}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {isTooltipVisible && (
        <div
          id={`sync-tooltip-${appointmentId}`}
          role="tooltip"
          className="
            absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2
            px-3 py-2
            bg-[#434E54] text-white
            text-xs
            rounded-lg shadow-lg
            max-w-[200px]
            whitespace-normal
            pointer-events-none
            after:content-['']
            after:absolute
            after:top-full
            after:left-1/2
            after:-translate-x-1/2
            after:border-4
            after:border-transparent
            after:border-t-[#434E54]
          "
        >
          {getTooltipText()}
        </div>
      )}
    </div>
  );
}
