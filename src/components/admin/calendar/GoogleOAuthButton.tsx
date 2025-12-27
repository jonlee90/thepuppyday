/**
 * Google OAuth Button Component
 * Task 0039: OAuth connection button with loading states
 */

'use client';

import { useState } from 'react';
import { Lock, Loader } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

  const sizeClasses = {
    sm: 'btn-sm py-2 px-4 text-sm',
    md: 'py-2.5 px-5 text-base',
    lg: 'btn-lg py-3 px-6 text-base',
  };

  const variantClasses = {
    primary: 'bg-[#F59E0B] hover:bg-[#D97706] text-white border-none',
    secondary: 'bg-[#434E54] hover:bg-[#363F44] text-white border-none',
  };

  return (
    <button
      onClick={handleConnect}
      disabled={disabled || isLoading}
      className={`
        btn ${sizeClasses[size]} ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        shadow-sm hover:shadow-md transition-all duration-200
        disabled:bg-[#E5E5E5] disabled:text-[#9CA3AF] disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      `}
      type="button"
    >
      {isLoading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Lock className="w-5 h-5" />
          <span>{variant === 'secondary' ? 'Reconnect Calendar' : 'Connect Google Calendar'}</span>
        </>
      )}
    </button>
  );
}
