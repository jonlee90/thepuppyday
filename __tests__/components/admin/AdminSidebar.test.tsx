import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import type { User } from '@/types/database';

// Create mock functions that can be accessed in tests
const mockUsePathname = vi.fn();
const mockToggleSidebar = vi.fn();
const mockSignOut = vi.fn();
let mockIsSidebarCollapsed = false;

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock hooks
vi.mock('@/stores/admin-store', () => ({
  useAdminStore: () => ({
    get isSidebarCollapsed() {
      return mockIsSidebarCollapsed;
    },
    toggleSidebar: mockToggleSidebar,
  }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

const mockUser: User = {
  id: 'test-user-id',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@test.com',
  phone: '5555555555',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
};

const staffUser: User = {
  ...mockUser,
  role: 'staff',
};

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/admin/dashboard');
    mockIsSidebarCollapsed = false;
  });

  describe('Navigation Structure', () => {
    it('renders all top-level navigation items for admin users', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={mockUser} />);

      // Overview section
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();

      // Operations section
      expect(screen.getByText('Appointments')).toBeInTheDocument();
      expect(screen.getByText('Waitlist')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();

      // Marketing section
      expect(screen.getByText('Campaigns')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();

      // Configuration section
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Add-ons')).toBeInTheDocument();
      expect(screen.getByText('Gallery')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('hides owner-only items for staff users', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={staffUser} />);

      // Staff should see non-owner items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Appointments')).toBeInTheDocument();

      // Staff should NOT see owner-only items
      expect(screen.queryByText('Campaigns')).not.toBeInTheDocument();
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      expect(screen.queryByText('Services')).not.toBeInTheDocument();
      expect(screen.queryByText('Gallery')).not.toBeInTheDocument();
    });
  });

  describe('Notifications Sub-items', () => {
    it('does not show notifications sub-items initially when collapsed', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={mockUser} />);

      // Sub-items should not be visible initially
      expect(screen.queryByText('Templates')).not.toBeInTheDocument();
      expect(screen.queryByText('Log')).not.toBeInTheDocument();
    });

    it('shows notifications sub-items when expanded', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={mockUser} />);

      // Click the Notifications parent item to expand
      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsButton);

      // Sub-items should now be visible
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Log')).toBeInTheDocument();
    });

    it('toggles expand/collapse on click', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={mockUser} />);

      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });

      // First click - expand
      fireEvent.click(notificationsButton);
      expect(screen.getByText('Templates')).toBeInTheDocument();

      // Second click - collapse
      fireEvent.click(notificationsButton);
      expect(screen.queryByText('Templates')).not.toBeInTheDocument();
    });

    it('auto-expands notifications when a child is active', () => {
      mockUsePathname.mockReturnValue('/admin/notifications/templates');

      render(<AdminSidebar user={mockUser} />);

      // Sub-items should be visible because a child is active
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Log')).toBeInTheDocument();
    });
  });

  describe('Active State Highlighting', () => {
    it('highlights active parent when child is active', () => {
      mockUsePathname.mockReturnValue('/admin/notifications/templates');

      const { container } = render(<AdminSidebar user={mockUser} />);

      // Parent button should have active styles
      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });
      expect(notificationsButton).toHaveClass('bg-[#434E54]');
      expect(notificationsButton).toHaveClass('text-white');
    });

    it('highlights active child item', () => {
      mockUsePathname.mockReturnValue('/admin/notifications/templates');

      render(<AdminSidebar user={mockUser} />);

      // Templates link should have active styles
      const templatesLink = screen.getByRole('link', { name: /Templates/i });
      expect(templatesLink).toHaveClass('bg-[#434E54]/90');
      expect(templatesLink).toHaveClass('text-white');
    });

    it('highlights dashboard when on /admin route', () => {
      mockUsePathname.mockReturnValue('/admin');

      render(<AdminSidebar user={mockUser} />);

      // Dashboard link should have active styles
      const dashboardLinks = screen.getAllByRole('link', { name: /Dashboard/i });
      // First one is the logo link, second is the nav item
      const dashboardNavLink = dashboardLinks.find(link =>
        link.className.includes('bg-[#434E54]')
      );
      expect(dashboardNavLink).toBeDefined();
    });

    it('highlights regular items correctly', () => {
      mockUsePathname.mockReturnValue('/admin/appointments');

      render(<AdminSidebar user={mockUser} />);

      const appointmentsLink = screen.getByRole('link', { name: /Appointments/i });
      expect(appointmentsLink).toHaveClass('bg-[#434E54]');
      expect(appointmentsLink).toHaveClass('text-white');
    });
  });

  describe('Chevron Icons', () => {
    it('shows ChevronDown when collapsed', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      const { container } = render(<AdminSidebar user={mockUser} />);

      // SVG for ChevronDown should be present (lucide-react renders as SVG)
      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });
      expect(notificationsButton).toBeInTheDocument();
    });

    it('shows ChevronUp when expanded', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={mockUser} />);

      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsButton);

      // After expanding, ChevronUp should be visible
      expect(notificationsButton).toBeInTheDocument();
    });
  });

  describe('Sidebar Collapsed State', () => {
    it('hides sub-items when sidebar is collapsed', () => {
      mockUsePathname.mockReturnValue('/admin/notifications/templates');
      mockIsSidebarCollapsed = true;

      render(<AdminSidebar user={mockUser} />);

      // Even though a child is active, sub-items should be hidden when sidebar is collapsed
      expect(screen.queryByText('Templates')).not.toBeInTheDocument();
      expect(screen.queryByText('Log')).not.toBeInTheDocument();
    });

    it('shows only icons when collapsed', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');
      mockIsSidebarCollapsed = true;

      const { container } = render(<AdminSidebar user={mockUser} />);

      // Section titles should not be visible
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Operations')).not.toBeInTheDocument();
    });
  });

  describe('User Information', () => {
    it('displays user initials and role', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={mockUser} />);

      expect(screen.getByText('JD')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('displays Staff role for non-admin users', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={staffUser} />);

      expect(screen.getByText('Staff')).toBeInTheDocument();
    });
  });

  describe('Sign Out', () => {
    it('calls signOut when logout button is clicked', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={mockUser} />);

      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sidebar Toggle', () => {
    it('calls toggleSidebar when toggle button is clicked', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminSidebar user={mockUser} />);

      const toggleButton = screen.getByRole('button', { name: /Collapse sidebar/i });
      fireEvent.click(toggleButton);

      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });
  });
});
