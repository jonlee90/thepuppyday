import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SocialLinkProps {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}

export function SocialLink({ href, label, children, className }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'w-10 h-10 bg-white rounded-full flex items-center justify-center',
        'shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5',
        className,
      )}
      aria-label={label}
    >
      {children}
    </a>
  );
}
