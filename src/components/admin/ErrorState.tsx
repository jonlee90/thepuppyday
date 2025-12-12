/**
 * Error state component with retry functionality
 */

'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, WifiOff, Lock, ServerCrash, XCircle } from 'lucide-react';

export type ErrorType = 'network' | 'auth' | 'permission' | 'server' | 'validation' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
  className?: string;
}

const errorConfig: Record<ErrorType, { icon: React.ReactElement; title: string; message: string; color: string }> = {
  network: {
    icon: <WifiOff className="w-12 h-12" />,
    title: 'Network Error',
    message: 'Unable to connect. Please check your internet connection and try again.',
    color: 'text-orange-600',
  },
  auth: {
    icon: <Lock className="w-12 h-12" />,
    title: 'Authentication Required',
    message: 'Your session has expired. Please log in again to continue.',
    color: 'text-yellow-600',
  },
  permission: {
    icon: <Lock className="w-12 h-12" />,
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    color: 'text-red-600',
  },
  server: {
    icon: <ServerCrash className="w-12 h-12" />,
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    color: 'text-red-600',
  },
  validation: {
    icon: <XCircle className="w-12 h-12" />,
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    color: 'text-yellow-600',
  },
  generic: {
    icon: <AlertTriangle className="w-12 h-12" />,
    title: 'Error',
    message: 'Something went wrong. Please try again.',
    color: 'text-red-600',
  },
};

export function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  isRetrying = false,
  className = '',
}: ErrorStateProps) {
  const config = errorConfig[type];
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  const handleRetry = async () => {
    if (onRetry && !isRetrying) {
      await onRetry();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`w-20 h-20 rounded-full bg-red-50 flex items-center justify-center ${config.color} mb-6`}
      >
        {config.icon}
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-bold text-[#434E54] mb-2">{displayTitle}</h3>

      {/* Message */}
      <p className="text-[#434E54]/70 max-w-sm mb-6">{displayMessage}</p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="
            inline-flex items-center justify-center gap-2
            bg-[#434E54] text-white font-semibold
            px-6 py-3 rounded-lg
            hover:bg-[#434E54]/90 transition-all duration-200
            shadow-md hover:shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Retry"
        >
          {isRetrying ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}

/**
 * Helper to map HTTP status codes to error types
 */
export function getErrorType(statusCode?: number): ErrorType {
  if (!statusCode) return 'generic';

  if (statusCode === 401) return 'auth';
  if (statusCode === 403) return 'permission';
  if (statusCode >= 500) return 'server';
  if (statusCode >= 400 && statusCode < 500) return 'validation';

  return 'generic';
}

/**
 * Helper to create error message from API response
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
