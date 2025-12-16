import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionHistorySidebar } from '@/app/admin/notifications/templates/[id]/edit/components/VersionHistorySidebar';
import { TemplateVersion } from '@/types/template';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('VersionHistorySidebar', () => {
  const mockVersions: TemplateVersion[] = [
    {
      id: 'v3',
      template_id: 'test-123',
      version: 3,
      subject: 'Updated subject',
      html_template: '<p>Updated</p>',
      text_template: 'Updated',
      changed_by: 'admin@example.com',
      changed_at: '2024-01-20T15:30:00Z',
      change_reason: 'Updated wording for clarity',
      changes_made: { subject: true, html_template: true },
    },
    {
      id: 'v2',
      template_id: 'test-123',
      version: 2,
      subject: 'Old subject',
      html_template: '<p>Old</p>',
      text_template: 'Old',
      changed_by: 'admin@example.com',
      changed_at: '2024-01-15T10:00:00Z',
      change_reason: 'Fixed typo',
      changes_made: { subject: true },
    },
  ];

  const mockOnRollback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders toggle button', () => {
    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    expect(screen.getByRole('button', { name: /version history/i })).toBeInTheDocument();
  });

  it('opens sidebar when button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Current version: v3/i)).toBeInTheDocument();
    });
  });

  it('fetches version history when opened', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/notifications/templates/test-123/history'
      );
    });
  });

  it('displays version history correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Version 3')).toBeInTheDocument();
      expect(screen.getByText('Version 2')).toBeInTheDocument();
      expect(screen.getByText('Updated wording for clarity')).toBeInTheDocument();
      expect(screen.getByText('Fixed typo')).toBeInTheDocument();
    });
  });

  it('marks current version with badge', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Current')).toBeInTheDocument();
    });
  });

  it('shows rollback button for non-current versions', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      const rollbackButtons = screen.getAllByRole('button', {
        name: /rollback to this version/i,
      });
      expect(rollbackButtons).toHaveLength(1); // Only for version 2
    });
  });

  it('opens rollback confirmation modal', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(async () => {
      const rollbackButtons = screen.getAllByRole('button', {
        name: /rollback to this version/i,
      });
      fireEvent.click(rollbackButtons[0]);

      // Wait a bit for modal to open
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(screen.getByText('Confirm Rollback')).toBeInTheDocument();
    });
  });

  it('requires reason for rollback', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    const alertSpy = vi.spyOn(global, 'alert').mockImplementation(() => {});

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(async () => {
      const rollbackButtons = screen.getAllByRole('button', {
        name: /rollback to this version/i,
      });
      fireEvent.click(rollbackButtons[0]);

      // Wait for modal
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      const confirmButtons = screen.getAllByRole('button', { name: /confirm rollback/i });
      fireEvent.click(confirmButtons[0]);
    });

    expect(alertSpy).toHaveBeenCalledWith('Please provide a reason for the rollback');
    alertSpy.mockRestore();
  });

  it('performs rollback successfully', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versions: mockVersions }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versions: mockVersions }),
      });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      const rollbackButton = screen.getByRole('button', {
        name: /rollback to this version/i,
      });
      fireEvent.click(rollbackButton);
    });

    await waitFor(() => {
      const reasonInput = screen.getByPlaceholderText(
        /Explain why you're rolling back/i
      );
      fireEvent.change(reasonInput, { target: { value: 'Reverting changes' } });
    });

    const confirmButton = screen.getByRole('button', { name: /confirm rollback/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/notifications/templates/test-123/rollback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            target_version: 2,
            reason: 'Reverting changes',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(mockOnRollback).toHaveBeenCalled();
    });
  });

  it('shows error when fetch fails', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows message when no version history', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: [] }),
    });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('No version history available')).toBeInTheDocument();
    });
  });

  it('displays changed fields', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistorySidebar
        templateId="test-123"
        currentVersion={3}
        onRollback={mockOnRollback}
      />
    );

    const button = screen.getByRole('button', { name: /version history/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Fields changed:/i)).toBeInTheDocument();
    });
  });
});
