'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';

export interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onApply?: () => void;
  onReset?: () => void;
}

export function MobileFilterSheet({
  isOpen,
  onClose,
  title,
  children,
  onApply,
  onReset,
}: MobileFilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Simple focus trap
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;
    const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const elements = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ));
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[#F8EEE5] rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-[#434E54]/20 mx-auto mt-3 mb-1 flex-shrink-0" />

            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between flex-shrink-0">
              <span className="text-base font-semibold text-[#434E54]">{title}</span>
              <button
                onClick={onClose}
                aria-label="Close filters"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EAE0D5] transition-colors text-[#434E54]/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {children}
            </div>

            {/* Footer */}
            {(onReset || onApply) && (
              <div className="bg-[#EAE0D5]/30 px-5 py-4 border-t border-[#E5E5E5] flex gap-3 flex-shrink-0">
                {onReset && (
                  <AdminButton variant="secondary" className="flex-1" onClick={onReset}>
                    Reset
                  </AdminButton>
                )}
                {onApply && (
                  <AdminButton variant="primary" className="flex-1" onClick={onApply}>
                    Apply
                  </AdminButton>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
