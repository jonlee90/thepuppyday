'use client';

/**
 * useSettingsForm Hook
 * Task 0166: Shared form patterns for settings editors
 *
 * Features:
 * - Track dirty state (unsaved changes)
 * - Save handler with loading/error states
 * - Optimistic UI updates with rollback on failure
 * - Retry logic for failed saves
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSettingsFormOptions<T> {
  /**
   * Initial form data
   */
  initialData: T;

  /**
   * Save handler - should return updated data on success
   */
  onSave: (data: T) => Promise<T>;

  /**
   * Success callback
   */
  onSuccess?: (data: T) => void;

  /**
   * Error callback
   */
  onError?: (error: string) => void;

  /**
   * Enable auto-save after delay (milliseconds)
   * Default: disabled
   */
  autoSaveDelay?: number;
}

interface UseSettingsFormReturn<T> {
  /**
   * Current form data
   */
  data: T;

  /**
   * Original data (before any changes)
   */
  originalData: T;

  /**
   * Update form data
   */
  updateData: (updates: Partial<T>) => void;

  /**
   * Set entire form data
   */
  setData: (data: T) => void;

  /**
   * Save changes
   */
  save: () => Promise<boolean>;

  /**
   * Retry last failed save
   */
  retry: () => Promise<boolean>;

  /**
   * Discard changes and revert to original
   */
  discard: () => void;

  /**
   * Reset to new initial data (clears dirty state)
   */
  reset: (newData: T) => void;

  /**
   * Whether there are unsaved changes
   */
  isDirty: boolean;

  /**
   * Whether save is in progress
   */
  isSaving: boolean;

  /**
   * Save error message
   */
  error: string | null;

  /**
   * Last successful save timestamp
   */
  lastSaved: Date | null;
}

export function useSettingsForm<T extends Record<string, unknown>>({
  initialData,
  onSave,
  onSuccess,
  onError,
  autoSaveDelay,
}: UseSettingsFormOptions<T>): UseSettingsFormReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [originalData, setOriginalData] = useState<T>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveDataRef = useRef<T | null>(null);

  // Track dirty state
  useEffect(() => {
    const dirty = JSON.stringify(data) !== JSON.stringify(originalData);
    setIsDirty(dirty);
  }, [data, originalData]);

  /**
   * Update partial form data
   */
  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
    setError(null); // Clear error on new changes
  }, []);

  /**
   * Save changes with optimistic update and rollback
   */
  const save = useCallback(async (): Promise<boolean> => {
    if (!isDirty) {
      return true; // Nothing to save
    }

    setIsSaving(true);
    setError(null);

    // Store current data for potential rollback
    const dataToSave = data;
    pendingSaveDataRef.current = dataToSave;

    // Optimistic update (already reflected in UI)
    const previousData = originalData;

    try {
      // Call save handler
      const updatedData = await onSave(dataToSave);

      // Success - update original data to reflect saved state
      setOriginalData(updatedData);
      setData(updatedData);
      setLastSaved(new Date());
      setIsDirty(false);
      pendingSaveDataRef.current = null;

      onSuccess?.(updatedData);

      return true;
    } catch (err) {
      // Failure - rollback to previous state
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';

      setError(errorMessage);
      setData(previousData); // Rollback
      setOriginalData(previousData);

      onError?.(errorMessage);

      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data, originalData, isDirty, onSave, onSuccess, onError]);

  /**
   * Retry last failed save
   */
  const retry = useCallback(async (): Promise<boolean> => {
    if (!error || !pendingSaveDataRef.current) {
      return false;
    }

    // Restore pending data and try to save again
    const dataToRetry = pendingSaveDataRef.current;
    setData(dataToRetry);
    setError(null); // Clear error before retry

    setIsSaving(true);

    try {
      // Call save handler
      const updatedData = await onSave(dataToRetry);

      // Success - update original data to reflect saved state
      setOriginalData(updatedData);
      setData(updatedData);
      setLastSaved(new Date());
      setIsDirty(false);
      pendingSaveDataRef.current = null;

      onSuccess?.(updatedData);

      return true;
    } catch (err) {
      // Failure - set error and keep pending data
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';

      setError(errorMessage);
      onError?.(errorMessage);

      return false;
    } finally {
      setIsSaving(false);
    }
  }, [error, onSave, onSuccess, onError]);

  /**
   * Discard changes and revert to original
   */
  const discard = useCallback(() => {
    setData(originalData);
    setError(null);
    setIsDirty(false);
    pendingSaveDataRef.current = null;

    // Clear auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  }, [originalData]);

  /**
   * Reset to new initial data
   */
  const reset = useCallback((newData: T) => {
    setData(newData);
    setOriginalData(newData);
    setError(null);
    setIsDirty(false);
    pendingSaveDataRef.current = null;

    // Clear auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  }, []);

  // Auto-save functionality (placed after save is defined)
  useEffect(() => {
    if (!autoSaveDelay || !isDirty) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Schedule auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      save();
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isDirty, autoSaveDelay]);

  return {
    data,
    originalData,
    updateData,
    setData,
    save,
    retry,
    discard,
    reset,
    isDirty,
    isSaving,
    error,
    lastSaved,
  };
}
