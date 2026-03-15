'use client';

/**
 * Channel toggle component with optimistic updates
 * Toggle for email notification channel
 */

import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';

export interface ChannelToggleProps {
  channel: 'email';
  enabled: boolean;
  notificationType: string;
  notificationLabel: string;
  onToggle: (enabled: boolean) => Promise<void>;
  disabled?: boolean;
}

export function ChannelToggle({
  channel,
  enabled,
  notificationType,
  notificationLabel,
  onToggle,
  disabled = false,
}: ChannelToggleProps) {
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [isLoading, setIsLoading] = useState(false);

  // Sync localEnabled when parent prop changes (e.g. after re-fetch)
  useEffect(() => {
    setLocalEnabled(enabled);
  }, [enabled]);

  const handleToggle = async () => {
    if (disabled || isLoading) {
      return;
    }

    const previousState = localEnabled;
    const newState = !localEnabled;

    // Optimistic update
    setLocalEnabled(newState);
    setIsLoading(true);

    try {
      await onToggle(newState);
      // Success - state already updated optimistically
    } catch (error) {
      // Rollback on error
      setLocalEnabled(previousState);
      // Error toast is handled by parent component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-[#6B7280]" aria-hidden="true" />
        <span className="text-sm font-medium text-[#434E54]">Email</span>
      </div>

      <div className="flex items-center gap-2">
        {isLoading && (
          <span className="loading loading-spinner loading-xs text-[#434E54]" aria-label="Saving" />
        )}

        <input
          type="checkbox"
          className="toggle toggle-sm"
          checked={localEnabled}
          onChange={handleToggle}
          disabled={disabled || isLoading}
          aria-label={`Toggle Email notifications for ${notificationLabel}`}
          style={{
            '--tglbg': localEnabled ? '#434E54' : '#E5E5E5',
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
