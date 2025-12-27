/**
 * Navigation Popover
 * Popover menu for tablet sidebar submenu items
 */

'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavPopoverProps {
  items: NavItem[];
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

export function NavPopover({ items, onClose, anchorRef }: NavPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Close on ESC key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, anchorRef]);

  // Position popover relative to anchor
  useEffect(() => {
    if (popoverRef.current && anchorRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popover = popoverRef.current;

      // Position to the right of the anchor with 8px gap
      popover.style.left = `${anchorRect.right + 8}px`;
      popover.style.top = `${anchorRect.top}px`;
    }
  }, [anchorRef]);

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-[#434E54]/10 py-2 w-52"
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`
              flex items-center gap-3 px-4 py-2.5 transition-colors
              ${
                active
                  ? 'bg-[#434E54] text-white'
                  : 'text-[#434E54] hover:bg-[#EAE0D5]'
              }
            `}
            role="menuitem"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
