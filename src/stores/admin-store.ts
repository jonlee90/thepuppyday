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

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type BottomTab = 'home' | 'appointments' | 'customers';

interface AdminState {
  // Sidebar state
  isSidebarCollapsed: boolean;

  // Date range for appointments
  selectedDateRange: DateRange;

  // Active filters
  appointmentFilters: AppointmentFilters;

  // Appointments view preference
  appointmentsView: 'calendar' | 'list';

  // Toast notifications
  toasts: Toast[];

  // Responsive state
  currentBreakpoint: Breakpoint;
  isMobileDrawerOpen: boolean;
  activeBottomTab: BottomTab;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDateRange: (range: DateRange) => void;
  setAppointmentFilters: (filters: AppointmentFilters) => void;
  clearAppointmentFilters: () => void;
  setAppointmentsView: (view: 'calendar' | 'list') => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  toggleMobileDrawer: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setActiveBottomTab: (tab: BottomTab) => void;
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
      appointmentsView: 'calendar',
      toasts: [],
      currentBreakpoint: 'desktop',
      isMobileDrawerOpen: false,
      activeBottomTab: 'home',

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

      // Appointments view actions
      setAppointmentsView: (view) =>
        set({ appointmentsView: view }),

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

      // Responsive actions
      setBreakpoint: (breakpoint) =>
        set({ currentBreakpoint: breakpoint }),

      toggleMobileDrawer: () =>
        set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),

      setMobileDrawerOpen: (open) =>
        set({ isMobileDrawerOpen: open }),

      setActiveBottomTab: (tab) =>
        set({ activeBottomTab: tab }),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        selectedDateRange: state.selectedDateRange,
        appointmentFilters: state.appointmentFilters,
        appointmentsView: state.appointmentsView,
        activeBottomTab: state.activeBottomTab,
      }),
    }
  )
);
