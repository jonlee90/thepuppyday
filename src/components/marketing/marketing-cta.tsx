/**
 * Reusable CTA button for marketing pages
 * Consolidates shared button styling: rounded-xl, shadows, hover lift, cursor-pointer
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type MarketingCTAVariant = 'primary' | 'light';
type MarketingCTASize = 'md' | 'lg';

interface BaseProps {
  variant?: MarketingCTAVariant;
  size?: MarketingCTASize;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

interface ButtonProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> {
  as?: 'button';
  href?: never;
}

interface LinkProps extends BaseProps {
  as: 'link';
  href: string;
}

interface ScrollProps extends BaseProps {
  as: 'scroll';
  href: string; // #section-id
}

export type MarketingCTAProps = ButtonProps | LinkProps | ScrollProps;

const variantStyles: Record<MarketingCTAVariant, string> = {
  primary: 'bg-[#434E54] text-white hover:bg-[#363F44] shadow-md hover:shadow-xl',
  light: 'bg-[#F8EEE5] text-[#434E54] hover:bg-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]',
};

const sizeStyles: Record<MarketingCTASize, string> = {
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

function getSharedClasses(variant: MarketingCTAVariant, size: MarketingCTASize, fullWidth: boolean) {
  return cn(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
    'transition-all duration-200 hover:-translate-y-1 cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/30 focus-visible:ring-offset-2',
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full'
  );
}

export function MarketingCTA(props: MarketingCTAProps) {
  const {
    variant = 'primary',
    size = 'lg',
    fullWidth = false,
    children,
    className,
  } = props;

  const classes = cn(getSharedClasses(variant, size, fullWidth), className);

  // Smooth scroll to anchor
  if (props.as === 'scroll') {
    const sectionId = props.href.replace('#', '');
    return (
      <button
        type="button"
        onClick={() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }}
        className={classes}
      >
        {children}
      </button>
    );
  }

  // Next.js Link
  if (props.as === 'link') {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  // Regular button
  const { as: _, variant: _v, size: _s, fullWidth: _fw, ...buttonProps } = props as ButtonProps;
  return (
    <button type="button" {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
