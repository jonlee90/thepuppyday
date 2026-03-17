/**
 * Google OAuth Button Component
 * Task 0039: OAuth connection button with loading states
 */

'use client';

import { useState } from 'react';
import { Lock, Loader } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdminButton } from '@/components/admin/ui/AdminButton';

interface GoogleOAuthButtonProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function GoogleOAuthButton({
  onError,
  disabled = false,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
}: GoogleOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);

    try {
      // Call backend to initiate OAuth flow
      const response = await fetch('/api/admin/calendar/auth/start', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start OAuth flow');
      }

      const data = await response.json();

      if (!data.authUrl) {
        throw new Error('No authorization URL received');
      }

      // Redirect to Google OAuth consent screen
      // Note: onSuccess callback will be handled after OAuth redirect completes
      // via the callback URL parameters (see CalendarSettingsClient)
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('OAuth connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed. Please try again.';

      toast.error('Connection Failed', {
        description: errorMessage,
      });

      if (onError) {
        onError(errorMessage);
      }

      setIsLoading(false);
    }
  };

  const sizeMap = { sm: 'sm' as const, md: 'md' as const, lg: 'lg' as const };

  return (
    <AdminButton
      variant="primary"
      size={sizeMap[size]}
      onClick={handleConnect}
      disabled={disabled}
      isLoading={isLoading}
      loadingText="Connecting..."
      className={`${fullWidth ? 'w-full' : ''} shadow-sm hover:shadow-md transition-all duration-200 gap-2`}
      type="button"
    >
      <Lock className="w-5 h-5" />
      <span>{variant === 'secondary' ? 'Reconnect Calendar' : 'Connect Google Calendar'}</span>
    </AdminButton>
  );
}
