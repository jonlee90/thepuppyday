/**
 * Tests for UnsavedChangesIndicator Component
 * Task 0166: Shared form patterns
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnsavedChangesIndicator } from '@/components/admin/settings/UnsavedChangesIndicator';

describe('UnsavedChangesIndicator', () => {
  const mockOnSave = vi.fn();
  const mockOnDiscard = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unsaved changes state', () => {
    it('should show unsaved changes indicator when dirty', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
    });

    it('should not show indicator when not dirty', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={false}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });

    it('should show save and discard buttons when dirty', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Discard/i })).toBeInTheDocument();
    });
  });

  describe('saving state', () => {
    it('should show saving state when isSaving is true', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          isSaving={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable buttons when saving', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          isSaving={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Saving/i });
      const discardButton = screen.getByRole('button', { name: /Discard/i });

      expect(saveButton).toBeDisabled();
      expect(discardButton).toBeDisabled();
    });
  });

  describe('error state', () => {
    it('should show error message when error is present', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          error="Network error occurred"
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('Save Failed')).toBeInTheDocument();
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should show retry button when error and onRetry provided', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          error="Save failed"
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('should not show unsaved indicator when error is present', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          error="Save failed"
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
      expect(screen.getByText('Save Failed')).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('should show last saved indicator when not dirty and has lastSaved', () => {
      const lastSaved = new Date(Date.now() - 60000); // 1 minute ago

      render(
        <UnsavedChangesIndicator
          isDirty={false}
          lastSaved={lastSaved}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/Saved 1 minute ago/)).toBeInTheDocument();
    });

    it('should format "just now" for recent saves', () => {
      const lastSaved = new Date(Date.now() - 5000); // 5 seconds ago

      render(
        <UnsavedChangesIndicator
          isDirty={false}
          lastSaved={lastSaved}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/Saved just now/)).toBeInTheDocument();
    });

    it('should format minutes correctly', () => {
      const lastSaved = new Date(Date.now() - 5 * 60000); // 5 minutes ago

      render(
        <UnsavedChangesIndicator
          isDirty={false}
          lastSaved={lastSaved}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/Saved 5 minutes ago/)).toBeInTheDocument();
    });

    it('should format hours correctly', () => {
      const lastSaved = new Date(Date.now() - 2 * 60 * 60000); // 2 hours ago

      render(
        <UnsavedChangesIndicator
          isDirty={false}
          lastSaved={lastSaved}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/Saved 2 hours ago/)).toBeInTheDocument();
    });

    it('should not show last saved when dirty', () => {
      const lastSaved = new Date(Date.now() - 60000);

      render(
        <UnsavedChangesIndicator
          isDirty={true}
          lastSaved={lastSaved}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call onSave when save button clicked', async () => {
      const user = userEvent.setup();

      render(
        <UnsavedChangesIndicator
          isDirty={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('should call onDiscard when discard button clicked', async () => {
      const user = userEvent.setup();

      render(
        <UnsavedChangesIndicator
          isDirty={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const discardButton = screen.getByRole('button', { name: /Discard/i });
      await user.click(discardButton);

      expect(mockOnDiscard).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();

      render(
        <UnsavedChangesIndicator
          isDirty={true}
          error="Network error"
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom text props', () => {
    it('should use custom save text', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          saveText="Apply Settings"
        />
      );

      expect(screen.getByRole('button', { name: /Apply Settings/i })).toBeInTheDocument();
    });

    it('should use custom discard text', () => {
      render(
        <UnsavedChangesIndicator
          isDirty={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          discardText="Cancel"
        />
      );

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });
});
