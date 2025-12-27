'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

interface QuotaWarningProps {
  current: number;
  limit: number;
  percentage: number;
  resetAt: string;
  onDismiss?: () => void;
}

export function QuotaWarning({
  current,
  limit,
  percentage,
  resetAt,
  onDismiss
}: QuotaWarningProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [timeToReset, setTimeToReset] = useState('');

  // Determine severity level based on percentage
  const getSeverity = useCallback(() => {
    if (percentage >= 95) return 'critical';
    if (percentage >= 90) return 'high';
    if (percentage >= 80) return 'warning';
    return 'normal';
  }, [percentage]);

  const severity = getSeverity();

  // Calculate time to reset
  useEffect(() => {
    const calculateTimeToReset = () => {
      const resetTime = new Date(resetAt).getTime();
      const now = Date.now();
      const diff = resetTime - now;

      if (diff <= 0) {
        setTimeToReset('Resetting soon');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeToReset(`${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`);
      } else {
        setTimeToReset(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      }
    };

    calculateTimeToReset();
    const interval = setInterval(calculateTimeToReset, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [resetAt]);

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Auto-hide if percentage drops below 80%
  useEffect(() => {
    if (percentage < 80 && isVisible) {
      handleDismiss();
    }
  }, [percentage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      setTimeout(() => {
        onDismiss();
      }, 300); // Wait for animation to complete
    }
  };

  // Get severity-specific styles
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          container: 'bg-red-50 border-l-4 border-red-500',
          icon: 'text-red-500',
          header: '🚨 Critical API Quota Usage',
          percentageColor: 'text-red-600'
        };
      case 'high':
        return {
          container: 'bg-orange-50 border-l-4 border-orange-500',
          icon: 'text-orange-500',
          header: '⚠️ High API Quota Usage',
          percentageColor: 'text-orange-600'
        };
      case 'warning':
        return {
          container: 'bg-amber-50 border-l-4 border-amber-400',
          icon: 'text-amber-500',
          header: '⚠️ API Quota Warning',
          percentageColor: 'text-amber-600'
        };
      default:
        return {
          container: 'bg-amber-50 border-l-4 border-amber-400',
          icon: 'text-amber-500',
          header: '⚠️ API Quota Warning',
          percentageColor: 'text-amber-600'
        };
    }
  };

  // Get progress bar color based on percentage
  const getProgressBarColor = () => {
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const styles = getSeverityStyles();

  if (!isVisible || percentage < 80) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-label={`API quota warning: ${percentage}% used`}
      className={`
        ${styles.container}
        max-w-6xl w-full rounded-xl shadow-md p-6
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        animate-slideDown
      `}
    >
      {/* Header with dismiss button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
          <h3 className="text-lg font-semibold text-[#434E54]">
            {styles.header}
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="btn btn-sm btn-circle btn-ghost hover:bg-neutral-200/50"
          aria-label="Dismiss quota warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Usage text */}
      <div className="mb-3">
        <p className="text-base font-medium text-[#434E54]">
          Google Calendar API usage:{' '}
          <span className={styles.percentageColor}>
            {current.toLocaleString()} / {limit.toLocaleString()} requests ({percentage}%)
          </span>
        </p>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mb-3"
      >
        <div className="h-4 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`
              h-full ${getProgressBarColor()}
              transition-all duration-500 ease-in-out
              rounded-full
            `}
            style={{ width: `${animatedPercentage}%` }}
          />
        </div>
      </div>

      {/* Reset time */}
      <p className="text-sm text-[#6B7280] mb-4">
        Quota resets in: {timeToReset}
      </p>

      {/* Critical warning message (only for 95%+) */}
      {severity === 'critical' && (
        <p className="text-sm font-medium text-red-600 mb-4">
          Service may be interrupted soon
        </p>
      )}

      {/* Suggested actions */}
      <div className="mb-4">
        <p className="text-sm font-medium text-[#434E54] mb-2">Suggested actions:</p>
        <ul className="text-sm text-[#6B7280] space-y-1 list-disc list-inside md:space-y-0 md:list-none">
          <li className="md:inline md:after:content-['•'] md:after:mx-2">Monitor sync frequency settings</li>
          <li className="md:inline md:after:content-['•'] md:after:mx-2">Review recent appointment activity</li>
          <li className="md:inline">Consider upgrading quota in Google Cloud Console</li>
        </ul>
      </div>

      {/* Console link */}
      <a
        href={`https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas`}
        target="_blank"
        rel="noopener noreferrer"
        className="link link-hover text-sm font-medium text-[#434E54] inline-flex items-center gap-1.5 hover:underline transition-all duration-100"
      >
        View Google Cloud Console
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
