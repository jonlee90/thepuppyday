'use client';

import { useState, useCallback } from 'react';
import type { CalendarAppointment, DragState, ResizeState } from '../types';
import { TOUCH_CONFIG, SLOT_CONFIG } from '../constants';

interface DragDropCallbacks {
  onReschedule: (appointmentId: string, newTime: Date, newGroomerId: string | null) => Promise<void>;
  onResize: (appointmentId: string, newDuration: number) => Promise<void>;
}

export function useCalendarDragDrop({ onReschedule, onResize }: DragDropCallbacks) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    appointment: null,
    sourceGroomerId: null,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
    snapTime: null,
    snapGroomerId: null,
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    appointment: null,
    startY: 0,
    originalDuration: 0,
    currentDuration: 0,
  });

  const startDrag = useCallback(
    (e: React.PointerEvent, appointment: CalendarAppointment) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = (e.target as HTMLElement).getBoundingClientRect();

      // Wait for threshold before starting drag
      const startX = e.clientX;
      const startY = e.clientY;

      const handleMove = (moveEvent: PointerEvent) => {
        const dx = Math.abs(moveEvent.clientX - startX);
        const dy = Math.abs(moveEvent.clientY - startY);

        if (dx > TOUCH_CONFIG.dragThresholdPx || dy > TOUCH_CONFIG.dragThresholdPx) {
          document.removeEventListener('pointermove', handleMove);
          document.removeEventListener('pointerup', handleUp);

          setDragState({
            isDragging: true,
            appointment,
            sourceGroomerId: appointment.groomer_id,
            currentX: moveEvent.clientX,
            currentY: moveEvent.clientY,
            offsetX: startX - rect.left,
            offsetY: startY - rect.top,
            snapTime: null,
            snapGroomerId: null,
          });

          // Attach drag handlers
          const onDragMove = (ev: PointerEvent) => {
            setDragState((prev) => ({
              ...prev,
              currentX: ev.clientX,
              currentY: ev.clientY,
            }));
          };

          const onDragEnd = () => {
            document.removeEventListener('pointermove', onDragMove);
            document.removeEventListener('pointerup', onDragEnd);
            setDragState((prev) => {
              if (prev.isDragging && prev.appointment && prev.snapTime) {
                onReschedule(
                  prev.appointment.id,
                  prev.snapTime,
                  prev.snapGroomerId
                );
              }
              return {
                isDragging: false,
                appointment: null,
                sourceGroomerId: null,
                currentX: 0,
                currentY: 0,
                offsetX: 0,
                offsetY: 0,
                snapTime: null,
                snapGroomerId: null,
              };
            });
          };

          document.addEventListener('pointermove', onDragMove);
          document.addEventListener('pointerup', onDragEnd);
        }
      };

      const handleUp = () => {
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    },
    [onReschedule]
  );

  const startResize = useCallback(
    (e: React.PointerEvent, appointment: CalendarAppointment) => {
      e.preventDefault();
      e.stopPropagation();

      const startY = e.clientY;

      setResizeState({
        isResizing: true,
        appointment,
        startY,
        originalDuration: appointment.duration_minutes,
        currentDuration: appointment.duration_minutes,
      });

      const onResizeMove = (moveEvent: PointerEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const deltaMinutes = Math.round(deltaY / SLOT_CONFIG.pixelsPerMinute / SLOT_CONFIG.snapMinutes) * SLOT_CONFIG.snapMinutes;
        const newDuration = Math.max(
          SLOT_CONFIG.snapMinutes,
          appointment.duration_minutes + deltaMinutes
        );
        setResizeState((prev) => ({ ...prev, currentDuration: newDuration }));
      };

      const onResizeEnd = () => {
        document.removeEventListener('pointermove', onResizeMove);
        document.removeEventListener('pointerup', onResizeEnd);
        setResizeState((prev) => {
          if (prev.isResizing && prev.appointment && prev.currentDuration !== prev.originalDuration) {
            onResize(prev.appointment.id, prev.currentDuration);
          }
          return {
            isResizing: false,
            appointment: null,
            startY: 0,
            originalDuration: 0,
            currentDuration: 0,
          };
        });
      };

      document.addEventListener('pointermove', onResizeMove);
      document.addEventListener('pointerup', onResizeEnd);
    },
    [onResize]
  );

  return {
    dragState,
    resizeState,
    startDrag,
    startResize,
  };
}
