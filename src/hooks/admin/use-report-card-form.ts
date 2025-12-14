'use client';

/**
 * useReportCardForm Hook
 * Manages report card form state with auto-save functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReportCardFormState, HealthObservation, ReportCardMood, CoatCondition, BehaviorRating } from '@/types/report-card';

interface UseReportCardFormOptions {
  appointmentId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

const AUTO_SAVE_DELAY = 5000; // 5 seconds
const LOCAL_STORAGE_KEY_PREFIX = 'report-card-draft-';

export function useReportCardForm({
  appointmentId,
  onSuccess,
  onError,
}: UseReportCardFormOptions) {
  const [formState, setFormState] = useState<ReportCardFormState>({
    appointment_id: appointmentId,
    mood: null,
    coat_condition: null,
    behavior: null,
    health_observations: [],
    groomer_notes: '',
    before_photo_url: '',
    after_photo_url: '',
  });

  const [dontSend, setDontSend] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  // Load existing report card or draft from localStorage
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        // Try to load from server first
        const response = await fetch(`/api/admin/report-cards?appointment_id=${appointmentId}`);
        const data = await response.json();

        if (data.reportCard) {
          setFormState({
            appointment_id: appointmentId,
            mood: data.reportCard.mood,
            coat_condition: data.reportCard.coat_condition,
            behavior: data.reportCard.behavior,
            health_observations: data.reportCard.health_observations || [],
            groomer_notes: data.reportCard.groomer_notes || '',
            before_photo_url: data.reportCard.before_photo_url || '',
            after_photo_url: data.reportCard.after_photo_url || '',
          });
          setSaveStatus((prev) => ({
            ...prev,
            lastSaved: new Date(data.reportCard.updated_at || data.reportCard.created_at),
          }));
          return;
        }

        // Fallback to localStorage if no server data
        const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${appointmentId}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          const parsed = JSON.parse(localData);
          setFormState(parsed.formState);
          setDontSend(parsed.dontSend || false);
        }
      } catch (error) {
        console.error('Failed to load report card:', error);
        // Try localStorage fallback
        const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${appointmentId}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          const parsed = JSON.parse(localData);
          setFormState(parsed.formState);
          setDontSend(parsed.dontSend || false);
        }
      }
    };

    loadData();
  }, [appointmentId]);

  // Auto-save to localStorage
  const saveToLocalStorage = useCallback(() => {
    const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${appointmentId}`;
    localStorage.setItem(
      localKey,
      JSON.stringify({
        formState,
        dontSend,
        timestamp: new Date().toISOString(),
      })
    );
  }, [appointmentId, formState, dontSend]);

  // Auto-save to server (debounced)
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Save to localStorage immediately
    saveToLocalStorage();

    // Schedule server auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave();
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formState, dontSend]);

  // Auto-save function
  const autoSave = async () => {
    setSaveStatus((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const response = await fetch('/api/admin/report-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formState,
          isDraft: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Auto-save failed');
      }

      setSaveStatus({
        isSaving: false,
        lastSaved: new Date(),
        error: null,
      });
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Auto-save failed',
      }));
    }
  };

  // Submit final report card
  const submit = async (isDraft: boolean = false): Promise<boolean> => {
    setSaveStatus((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const response = await fetch('/api/admin/report-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formState,
          isDraft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSaveStatus({
        isSaving: false,
        lastSaved: new Date(),
        error: null,
      });

      // Clear localStorage on successful submission
      if (!isDraft) {
        const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${appointmentId}`;
        localStorage.removeItem(localKey);
      }

      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setSaveStatus((prev) => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
      return false;
    }
  };

  // Update form field helpers
  const updateField = <K extends keyof ReportCardFormState>(
    field: K,
    value: ReportCardFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const setMood = (mood: ReportCardMood) => updateField('mood', mood);
  const setCoatCondition = (condition: CoatCondition) => updateField('coat_condition', condition);
  const setBehavior = (behavior: BehaviorRating) => updateField('behavior', behavior);
  const setHealthObservations = (observations: HealthObservation[]) =>
    updateField('health_observations', observations);
  const setGroomerNotes = (notes: string) => updateField('groomer_notes', notes);
  const setBeforePhoto = (url: string) => updateField('before_photo_url', url);
  const setAfterPhoto = (url: string) => updateField('after_photo_url', url);

  return {
    formState,
    dontSend,
    setDontSend,
    saveStatus,
    setMood,
    setCoatCondition,
    setBehavior,
    setHealthObservations,
    setGroomerNotes,
    setBeforePhoto,
    setAfterPhoto,
    submit,
  };
}
