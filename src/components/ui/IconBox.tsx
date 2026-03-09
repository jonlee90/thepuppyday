import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const sizeStyles = {
  sm: 'w-9 h-9',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
} as const;

const roundedStyles = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
} as const;

interface IconBoxProps {
  children: ReactNode;
  size?: keyof typeof sizeStyles;
  gradient?: string;
  rounded?: keyof typeof roundedStyles;
  shadow?: boolean;
  hoverScale?: boolean;
  className?: string;
}

export function IconBox({
  children,
  size = 'md',
  gradient = 'from-[#EAE0D5] to-[#DCD2C7]',
  rounded = 'xl',
  shadow = false,
  hoverScale = false,
  className,
}: IconBoxProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 bg-gradient-to-br flex items-center justify-center',
        sizeStyles[size],
        roundedStyles[rounded],
        gradient,
        shadow && 'shadow-md',
        hoverScale && 'group-hover:scale-110 transition-transform duration-200',
        className,
      )}
    >
      {children}
    </div>
  );
}
