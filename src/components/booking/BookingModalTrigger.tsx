/**
 * Booking Modal Trigger Button Component
 * Multiple variants for different contexts
 */

'use client';

import { forwardRef } from 'react';
import { Calendar, UserPlus, Plus, Loader2 } from 'lucide-react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useBookingModal, type BookingModalMode } from '@/hooks/useBookingModal';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'walkin' | 'admin';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BookingModalTriggerProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  mode?: BookingModalMode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  preSelectedServiceId?: string;
  preSelectedCustomerId?: string;
  onSuccess?: (appointmentId: string) => void;
  children?: React.ReactNode;
  isLoading?: boolean;
  showIcon?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[#434E54] text-white
    hover:bg-[#363F44]
    shadow-[0_4px_14px_rgba(67,78,84,0.25)]
    hover:shadow-[0_6px_20px_rgba(67,78,84,0.3)]
  `,
  secondary: `
    bg-[#434E54] text-white
    hover:bg-[#363F44]
    shadow-md hover:shadow-lg
  `,
  outline: `
    bg-transparent text-[#434E54]
    border-2 border-[#434E54]
    hover:bg-[#434E54] hover:text-white
  `,
  walkin: `
    bg-amber-500 text-white
    hover:bg-amber-600
    shadow-[0_4px_14px_rgba(245,158,11,0.3)]
    hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)]
  `,
  admin: `
    bg-[#434E54] text-white
    hover:bg-[#363F44]
    shadow-sm hover:shadow-md
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-3 text-base gap-2',
  lg: 'px-8 py-4 text-lg gap-2.5',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-5 h-5',
};

const defaultLabels: Record<BookingModalMode, string> = {
  customer: 'Book Now',
  admin: 'Create Appointment',
  walkin: 'Walk In',
};

const defaultIcons: Record<BookingModalMode, typeof Calendar> = {
  customer: Calendar,
  admin: Plus,
  walkin: UserPlus,
};

export const BookingModalTrigger = forwardRef<HTMLButtonElement, BookingModalTriggerProps>(
  (
    {
      mode = 'customer',
      variant,
      size = 'md',
      preSelectedServiceId,
      preSelectedCustomerId,
      onSuccess,
      children,
      isLoading = false,
      showIcon = true,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const { open } = useBookingModal();

    // Determine variant based on mode if not specified
    const effectiveVariant = variant || (mode === 'walkin' ? 'walkin' : mode === 'admin' ? 'admin' : 'primary');

    const Icon = defaultIcons[mode];
    const label = children || defaultLabels[mode];

    const handleClick = () => {
      open({
        mode,
        preSelectedServiceId,
        preSelectedCustomerId,
        onSuccess,
      });
    };

    return (
      <motion.button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[effectiveVariant],
          sizeStyles[size],
          className
        )}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : showIcon ? (
          <Icon className={iconSizes[size]} />
        ) : null}
        <span>{label}</span>
      </motion.button>
    );
  }
);

BookingModalTrigger.displayName = 'BookingModalTrigger';

/**
 * Pre-configured trigger variants for common use cases
 */

// Hero CTA for marketing page
export function HeroBookingButton({ className, ...props }: Omit<BookingModalTriggerProps, 'mode' | 'variant' | 'size'>) {
  return (
    <BookingModalTrigger
      mode="customer"
      variant="primary"
      size="lg"
      className={cn('min-w-[200px]', className)}
      {...props}
    >
      Book Your Appointment
    </BookingModalTrigger>
  );
}

// Inline CTA for service cards
export function ServiceBookingButton({
  serviceId,
  className,
  ...props
}: Omit<BookingModalTriggerProps, 'mode' | 'variant'> & { serviceId: string }) {
  return (
    <BookingModalTrigger
      mode="customer"
      variant="secondary"
      size="md"
      preSelectedServiceId={serviceId}
      className={className}
      {...props}
    >
      Book This Service
    </BookingModalTrigger>
  );
}

// Admin create appointment button
export function AdminCreateButton({ className, ...props }: Omit<BookingModalTriggerProps, 'mode' | 'variant'>) {
  return (
    <BookingModalTrigger
      mode="admin"
      variant="admin"
      size="md"
      showIcon={true}
      className={className}
      {...props}
    >
      Create Appointment
    </BookingModalTrigger>
  );
}

// Walk-in button for dashboard
export function WalkInButton({ className, ...props }: Omit<BookingModalTriggerProps, 'mode' | 'variant'>) {
  return (
    <BookingModalTrigger
      mode="walkin"
      variant="walkin"
      size="md"
      showIcon={true}
      className={className}
      {...props}
    >
      Walk In
    </BookingModalTrigger>
  );
}

export default BookingModalTrigger;
