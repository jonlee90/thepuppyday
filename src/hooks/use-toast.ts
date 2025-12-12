/**
 * Toast notification hook with state management
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, 0 = requires manual dismissal
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
}

// Global state for toasts (allows use across components)
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

// Generate unique ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Toast API
export const toast = {
  success: (title: string, options?: Omit<Partial<Toast>, 'type' | 'title' | 'id'>) => {
    const newToast: Toast = {
      id: generateId(),
      type: 'success',
      title,
      duration: 3000, // 3 seconds for success
      ...options,
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    return newToast.id;
  },

  error: (title: string, options?: Omit<Partial<Toast>, 'type' | 'title' | 'id'>) => {
    const newToast: Toast = {
      id: generateId(),
      type: 'error',
      title,
      duration: 5000, // 5 seconds for errors
      ...options,
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    return newToast.id;
  },

  warning: (title: string, options?: Omit<Partial<Toast>, 'type' | 'title' | 'id'>) => {
    const newToast: Toast = {
      id: generateId(),
      type: 'warning',
      title,
      duration: 4000,
      ...options,
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    return newToast.id;
  },

  info: (title: string, options?: Omit<Partial<Toast>, 'type' | 'title' | 'id'>) => {
    const newToast: Toast = {
      id: generateId(),
      type: 'info',
      title,
      duration: 4000,
      ...options,
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    return newToast.id;
  },

  // Critical toast that requires manual dismissal
  critical: (title: string, options?: Omit<Partial<Toast>, 'type' | 'title' | 'id'>) => {
    const newToast: Toast = {
      id: generateId(),
      type: 'error',
      title,
      duration: 0, // Requires manual dismissal
      ...options,
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    return newToast.id;
  },

  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  },

  dismissAll: () => {
    toasts = [];
    notifyListeners();
  },
};

// React hook for components that need to render toasts
export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  useEffect(() => {
    // Register listener
    const listener = (newToasts: Toast[]) => {
      setState({ toasts: newToasts });
    };
    toastListeners.push(listener);

    // Initialize with current toasts
    setState({ toasts: [...toasts] });

    // Cleanup
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  return {
    toasts: state.toasts,
    dismiss,
    dismissAll: toast.dismissAll,
    toast,
  };
}
