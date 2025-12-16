'use client';

/**
 * Toast notification component
 * Simple, elegant toast for success and error messages
 */

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className="fixed top-4 right-4 z-50 animate-slide-in-right"
      role="alert"
      aria-live="polite"
    >
      <div
        className={`
          flex items-start gap-3 p-4 rounded-lg shadow-lg max-w-md
          ${isSuccess ? 'bg-white border-l-4 border-green-500' : 'bg-white border-l-4 border-red-500'}
        `}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
          )}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
            {message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`
            flex-shrink-0 rounded-lg p-1
            ${isSuccess ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}
            transition-colors duration-150
          `}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Toast container for managing multiple toasts
 */
export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ top: `${1 + index * 5}rem` }}
          className="fixed right-4 z-50"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemoveToast(toast.id)}
            duration={5000}
          />
        </div>
      ))}
    </>
  );
}
