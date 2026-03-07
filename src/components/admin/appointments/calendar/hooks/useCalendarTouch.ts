'use client';

import { useRef, useCallback } from 'react';
import { TOUCH_CONFIG } from '../constants';

interface TouchCallbacks {
  onLongPress: (e: PointerEvent) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function useCalendarTouch({ onLongPress, onSwipeLeft, onSwipeRight }: TouchCallbacks) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const isLongPress = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      isLongPress.current = false;

      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(e.nativeEvent);
      }, TOUCH_CONFIG.longPressMs);
    },
    [onLongPress]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPos.current) return;
      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);

      // Cancel long press if moved too much
      if (dx > TOUCH_CONFIG.dragThresholdPx || dy > TOUCH_CONFIG.dragThresholdPx) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (startPos.current) {
        const dx = e.clientX - startPos.current.x;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(e.clientY - startPos.current.y);

        // Detect horizontal swipe
        if (absDx > 50 && absDx > absDy * 2) {
          if (dx > 0) onSwipeRight();
          else onSwipeLeft();
        }
      }

      startPos.current = null;
      isLongPress.current = false;
    },
    [onSwipeLeft, onSwipeRight]
  );

  return {
    touchHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    isLongPress,
  };
}
