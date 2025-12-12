/**
 * Admin Panel Zustand Store
 * Manages sidebar state, filters, and notifications for admin panel
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface AppointmentFilters {
  status?: string[];
  groomer?: string;
  dateRange?: DateRange;
  searchQuery?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface AdminState {
  // Sidebar state
  isSidebarCollapsed: boolean;

  // Date range for appointments
  selectedDateRange: DateRange;

  // Active filters
  appointmentFilters: AppointmentFilters;

  // Toast notifications
  toasts: Toast[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDateRange: (range: DateRange) => void;
  setAppointmentFilters: (filters: AppointmentFilters) => void;
  clearAppointmentFilters: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      // Initial state
      isSidebarCollapsed: false,
      selectedDateRange: {
        from: null,
        to: null,
      },
      appointmentFilters: {},
      toasts: [],

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ isSidebarCollapsed: collapsed }),

      // Date range actions
      setDateRange: (range) =>
        set({ selectedDateRange: range }),

      // Filter actions
      setAppointmentFilters: (filters) =>
        set({ appointmentFilters: filters }),

      clearAppointmentFilters: () =>
        set({ appointmentFilters: {} }),

      // Toast actions
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              ...toast,
              id: `toast-${Date.now()}-${Math.random()}`,
            },
          ],
        })),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      clearToasts: () =>
        set({ toasts: [] }),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        selectedDateRange: state.selectedDateRange,
        appointmentFilters: state.appointmentFilters,
      }),
    }
  )
);
