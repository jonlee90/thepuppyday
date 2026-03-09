/**
 * AdminButton Component
 * Admin-specific button with design system defaults and visible loading state.
 * Uses aria-busy for loading instead of disabled to prevent DaisyUI opacity reduction.
 */

'use client';

import { forwardRef, memo, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

const VARIANT_CLASSES = {
  primary: 'bg-[#434E54] text-white hover:bg-[#363F44] border-none',
  secondary: 'btn-outline text-[#434E54] border-[#434E54] hover:bg-[#434E54] hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-none',
  ghost: 'btn-ghost text-[#434E54] hover:bg-[#EAE0D5]',
} as const;

const SIZE_CLASSES = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
} as const;

const SPINNER_CLASSES = {
  primary: '!text-white',
  secondary: '!text-[#434E54]',
  danger: '!text-white',
  ghost: '!text-[#434E54]',
} as const;

const AdminButton = memo(
  forwardRef<HTMLButtonElement, AdminButtonProps>(
    (
      {
        variant = 'primary',
        size = 'md',
        isLoading = false,
        loadingText,
        children,
        className,
        disabled,
        ...props
      },
      ref
    ) => {
      return (
        <button
          ref={ref}
          className={cn(
            'btn',
            VARIANT_CLASSES[variant],
            SIZE_CLASSES[size],
            className
          )}
          disabled={disabled}
          aria-busy={isLoading || undefined}
          aria-disabled={isLoading || disabled || undefined}
          {...props}
          onClick={isLoading ? undefined : props.onClick}
        >
          {isLoading ? (
            <>
              <span
                className={cn(
                  'loading loading-spinner loading-sm !opacity-100',
                  SPINNER_CLASSES[variant]
                )}
              />
              {loadingText || children}
            </>
          ) : (
            children
          )}
        </button>
      );
    }
  )
);

AdminButton.displayName = 'AdminButton';

export { AdminButton };
