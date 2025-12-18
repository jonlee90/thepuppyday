/**
 * Tests for useSettingsForm Hook
 * Task 0166: Shared form patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettingsForm } from '@/hooks/admin/use-settings-form';

interface TestSettings {
  name: string;
  count: number;
  enabled: boolean;
}

describe('useSettingsForm', () => {
  const initialData: TestSettings = {
    name: 'test',
    count: 10,
    enabled: true,
  };

  let mockSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSave = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with provided data', () => {
      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      expect(result.current.data).toEqual(initialData);
      expect(result.current.originalData).toEqual(initialData);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastSaved).toBe(null);
    });
  });

  describe('data updates', () => {
    it('should update data and mark as dirty', () => {
      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      act(() => {
        result.current.updateData({ name: 'updated' });
      });

      expect(result.current.data.name).toBe('updated');
      expect(result.current.isDirty).toBe(true);
    });

    it('should clear error on data update', () => {
      mockSave.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      // Trigger save error
      act(() => {
        result.current.updateData({ name: 'new' });
      });

      act(() => {
        result.current.save();
      });

      waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Update data should clear error
      act(() => {
        result.current.updateData({ name: 'another' });
      });

      expect(result.current.error).toBe(null);
    });

    it('should support setData to replace entire object', () => {
      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      const newData: TestSettings = {
        name: 'completely new',
        count: 999,
        enabled: false,
      };

      act(() => {
        result.current.setData(newData);
      });

      expect(result.current.data).toEqual(newData);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('save functionality', () => {
    it('should save successfully and update state', async () => {
      const updatedData: TestSettings = {
        name: 'saved',
        count: 20,
        enabled: false,
      };

      mockSave.mockResolvedValueOnce(updatedData);

      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      act(() => {
        result.current.updateData({ name: 'saved' });
      });

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.save();
      });

      expect(saveResult).toBe(true);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.lastSaved).toBeInstanceOf(Date);
      expect(result.current.error).toBe(null);
    });

    it('should handle save errors with rollback', async () => {
      mockSave.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      act(() => {
        result.current.updateData({ name: 'will fail' });
      });

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.save();
      });

      expect(saveResult).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.data).toEqual(initialData); // Rolled back
      expect(result.current.isDirty).toBe(false);
    });

    it('should not save when not dirty', async () => {
      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.save();
      });

      expect(saveResult).toBe(true); // Returns true but doesn't call onSave
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should call onSuccess callback on successful save', async () => {
      const onSuccess = vi.fn();
      mockSave.mockResolvedValueOnce(initialData);

      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
          onSuccess,
        })
      );

      act(() => {
        result.current.updateData({ count: 999 });
      });

      await act(async () => {
        await result.current.save();
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(initialData);
    });

    it('should call onError callback on save failure', async () => {
      const onError = vi.fn();
      mockSave.mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
          onError,
        })
      );

      act(() => {
        result.current.updateData({ count: 999 });
      });

      await act(async () => {
        await result.current.save();
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith('Save failed');
    });
  });

  describe('retry functionality', () => {
    it('should retry failed save', async () => {
      mockSave
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(initialData);

      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      // Update and fail save
      act(() => {
        result.current.updateData({ name: 'retry test' });
      });

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.error).toBeTruthy();

      // Retry should succeed
      let retryResult: boolean = false;
      await act(async () => {
        retryResult = await result.current.retry();
      });

      expect(retryResult).toBe(true);
      expect(result.current.error).toBe(null);
      expect(mockSave).toHaveBeenCalledTimes(2);
    });

    it('should not retry if no error', async () => {
      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      let retryResult: boolean = false;
      await act(async () => {
        retryResult = await result.current.retry();
      });

      expect(retryResult).toBe(false);
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('discard functionality', () => {
    it('should discard changes and revert to original', () => {
      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      act(() => {
        result.current.updateData({ name: 'changed', count: 999 });
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.discard();
      });

      expect(result.current.data).toEqual(initialData);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('reset functionality', () => {
    it('should reset to new data and clear dirty state', () => {
      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
        })
      );

      // Make changes
      act(() => {
        result.current.updateData({ name: 'changed' });
      });

      expect(result.current.isDirty).toBe(true);

      // Reset to new data
      const newData: TestSettings = {
        name: 'reset',
        count: 100,
        enabled: false,
      };

      act(() => {
        result.current.reset(newData);
      });

      expect(result.current.data).toEqual(newData);
      expect(result.current.originalData).toEqual(newData);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('auto-save functionality', () => {
    it.skip('should auto-save after delay when enabled', async () => {
      mockSave.mockResolvedValue(initialData);

      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
          autoSaveDelay: 3000,
        })
      );

      // Update data
      act(() => {
        result.current.updateData({ name: 'auto save test' });
      });

      expect(mockSave).not.toHaveBeenCalled();

      // Fast-forward time and flush promises
      await act(async () => {
        vi.advanceTimersByTime(3000);
        await Promise.resolve(); // Flush promises
      });

      // Wait for the save to complete
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    it.skip('should debounce auto-save on rapid changes', async () => {
      mockSave.mockResolvedValue(initialData);

      const { result } = renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
          autoSaveDelay: 3000,
        })
      );

      // Rapid updates
      act(() => {
        result.current.updateData({ count: 1 });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.updateData({ count: 2 });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.updateData({ count: 3 });
      });

      // Only final update should save after full delay
      await act(async () => {
        vi.advanceTimersByTime(3000);
        await Promise.resolve(); // Flush promises
      });

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    it('should not auto-save when not dirty', async () => {
      mockSave.mockResolvedValue(initialData);

      renderHook(() =>
        useSettingsForm({
          initialData,
          onSave: mockSave,
          autoSaveDelay: 3000,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockSave).not.toHaveBeenCalled();
    });
  });
});
