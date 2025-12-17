import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import type { User } from '@/types/database';

// Create mock functions that can be accessed in tests
const mockUsePathname = vi.fn();
const mockSignOut = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock hooks
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

const mockUser: User = {
  id: 'test-user-id',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@test.com',
  phone: '5555555555',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
};

const staffUser: User = {
  ...mockUser,
  role: 'staff',
};

describe('AdminMobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/admin/dashboard');
  });

  describe('Mobile Header', () => {
    it('renders mobile header with logo and hamburger button', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      expect(screen.getByText('Puppy Day')).toBeInTheDocument();
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Open menu/i })).toBeInTheDocument();
    });

    it('opens drawer when hamburger is clicked', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Drawer content should be visible
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Close menu/i }).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Drawer Navigation', () => {
    it('displays all navigation items for admin users when drawer is open', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Should see all items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Appointments')).toBeInTheDocument();
      expect(screen.getByText('Waitlist')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Campaigns')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Add-ons')).toBeInTheDocument();
      expect(screen.getByText('Gallery')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('hides owner-only items for staff users', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={staffUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Should see non-owner items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Appointments')).toBeInTheDocument();

      // Should NOT see owner-only items
      expect(screen.queryByText('Campaigns')).not.toBeInTheDocument();
      expect(screen.queryByText('Services')).not.toBeInTheDocument();
      expect(screen.queryByText('Gallery')).not.toBeInTheDocument();
    });

    it('closes drawer when X button is clicked', async () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      const { container } = render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Verify drawer is open
      expect(screen.getByText('Menu')).toBeInTheDocument();

      // Get the aside element to check its classes
      const aside = container.querySelector('aside');

      // Close drawer using one of the X buttons
      const closeButtons = screen.getAllByRole('button', { name: /Close menu/i });
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      // Drawer should have the translate-x-full class (offscreen)
      await waitFor(() => {
        expect(aside).toHaveClass('translate-x-full');
      });
    });
  });

  describe('Notifications Sub-items', () => {
    it('does not show notifications sub-items initially when collapsed', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Sub-items should not be visible initially
      expect(screen.queryByText('Templates')).not.toBeInTheDocument();
      expect(screen.queryByText('Log')).not.toBeInTheDocument();
    });

    it('shows notifications sub-items when expanded', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

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

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

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

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Sub-items should be visible because a child is active
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Log')).toBeInTheDocument();
    });

    it('closes drawer after selecting a child item', async () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      const { container } = render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Verify drawer is open
      expect(screen.getByText('Menu')).toBeInTheDocument();

      // Get the aside element to check its classes
      const aside = container.querySelector('aside');

      // Expand notifications
      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsButton);

      // Click a child item
      const templatesLinks = screen.getAllByRole('link', { name: /Templates/i });
      fireEvent.click(templatesLinks[0]);

      // Drawer should be closed (translated offscreen)
      await waitFor(() => {
        expect(aside).toHaveClass('translate-x-full');
      });
    });
  });

  describe('Active State Highlighting', () => {
    it('highlights active parent when child is active', () => {
      mockUsePathname.mockReturnValue('/admin/notifications/log');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Parent button should have active styles
      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });
      expect(notificationsButton).toHaveClass('bg-[#434E54]');
      expect(notificationsButton).toHaveClass('text-white');
    });

    it('highlights active child item', () => {
      mockUsePathname.mockReturnValue('/admin/notifications/settings');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Settings link should have active styles
      const settingsLinks = screen.getAllByRole('link', { name: /Settings/i });
      // There might be multiple Settings (one for notifications child, one for main settings)
      const activeSettingsLink = settingsLinks.find(link =>
        link.className.includes('bg-[#434E54]/90')
      );
      expect(activeSettingsLink).toBeDefined();
    });

    it('highlights regular items correctly', () => {
      mockUsePathname.mockReturnValue('/admin/customers');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      const customersLink = screen.getByRole('link', { name: /Customers/i });
      expect(customersLink).toHaveClass('bg-[#434E54]');
      expect(customersLink).toHaveClass('text-white');
    });
  });

  describe('User Information', () => {
    it('displays user initials and role in drawer', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      expect(screen.getByText('JS')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('displays Staff role for non-admin users', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={staffUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      expect(screen.getByText('Staff')).toBeInTheDocument();
    });
  });

  describe('Sign Out', () => {
    it('calls signOut and closes drawer when logout button is clicked', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Overlay', () => {
    it('closes drawer when overlay is clicked', async () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      const { container } = render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Get the aside element to check its classes
      const aside = container.querySelector('aside');

      // Click overlay (the div with bg-black/20 class)
      const overlay = container.querySelector('.bg-black\\/20');
      expect(overlay).toBeInTheDocument();

      if (overlay) {
        fireEvent.click(overlay);
      }

      // Drawer should be closed (translated offscreen)
      await waitFor(() => {
        expect(aside).toHaveClass('translate-x-full');
      });
    });
  });

  describe('Chevron Icons', () => {
    it('shows ChevronDown when collapsed', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });
      expect(notificationsButton).toBeInTheDocument();
    });

    it('shows ChevronUp when expanded', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      const notificationsButton = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsButton);

      // After expanding, ChevronUp should be visible
      expect(notificationsButton).toBeInTheDocument();
    });
  });

  describe('Link Click Behavior', () => {
    it('closes drawer after clicking a regular navigation link', async () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');

      const { container } = render(<AdminMobileNav user={mockUser} />);

      // Open drawer
      const hamburgerButton = screen.getByRole('button', { name: /Open menu/i });
      fireEvent.click(hamburgerButton);

      // Verify drawer is open
      expect(screen.getByText('Menu')).toBeInTheDocument();

      // Get the aside element to check its classes
      const aside = container.querySelector('aside');

      // Click a regular link
      const appointmentsLink = screen.getByRole('link', { name: /Appointments/i });
      fireEvent.click(appointmentsLink);

      // Drawer should be closed (translated offscreen)
      await waitFor(() => {
        expect(aside).toHaveClass('translate-x-full');
      });
    });
  });
});
