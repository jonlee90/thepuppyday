/**
 * CustomerFlagForm Component
 * Modal form for adding/editing customer flags
 * Task 0064: Upgrade to admin pattern (AnimatePresence, focus trap, warm header/footer)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { createFocusTrap } from '@/lib/accessibility/focus';
import type { CustomerFlag, CustomerFlagType, CustomerFlagColor } from '@/types/database';
import { getFlagLabel } from './CustomerFlagBadge';

interface CustomerFlagFormProps {
  customerId: string;
  flag?: CustomerFlag | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FLAG_TYPE_OPTIONS: { value: CustomerFlagType; label: string; defaultColor: CustomerFlagColor }[] = [
  { value: 'aggressive_dog', label: 'Aggressive Dog', defaultColor: 'red' },
  { value: 'payment_issues', label: 'Payment Issues', defaultColor: 'red' },
  { value: 'vip', label: 'VIP', defaultColor: 'green' },
  { value: 'special_needs', label: 'Special Needs', defaultColor: 'yellow' },
  { value: 'grooming_notes', label: 'Grooming Notes', defaultColor: 'yellow' },
  { value: 'other', label: 'Other', defaultColor: 'yellow' },
];

const MAX_DESCRIPTION_LENGTH = 500;

export function CustomerFlagForm({
  customerId,
  flag,
  isOpen,
  onClose,
  onSuccess,
}: CustomerFlagFormProps) {
  const [flagType, setFlagType] = useState<CustomerFlagType>(flag?.flag_type || 'special_needs');
  const [description, setDescription] = useState(flag?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const isEditing = !!flag;
  const remainingChars = MAX_DESCRIPTION_LENGTH - description.length;

  // Focus trap + scroll lock
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const trap = createFocusTrap(panelRef.current);
    trap.activate();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      trap.deactivate();
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedOption = FLAG_TYPE_OPTIONS.find((opt) => opt.value === flagType);
      const color = selectedOption?.defaultColor || 'yellow';

      const url = isEditing
        ? `/api/admin/customers/${customerId}/flags/${flag.id}`
        : `/api/admin/customers/${customerId}/flags`;

      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag_type: flagType, description: description.trim(), color }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} flag`);
      }

      toast.success('Flag saved');
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('[CustomerFlagForm] save error:', err);
      toast.error('Failed to save flag');
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFlagType(flag?.flag_type || 'special_needs');
    setDescription(flag?.description || '');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={isEditing ? 'Edit Flag' : 'Add Customer Flag'}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Warm header */}
            <div className="bg-[#EAE0D5] rounded-t-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/60">
                  <Flag className="w-5 h-5 text-[#434E54]" />
                </div>
                <h2 className="text-lg font-semibold text-[#434E54]">
                  {isEditing ? 'Edit Flag' : 'Add Customer Flag'}
                </h2>
              </div>
              <AdminButton variant="ghost" size="xs" onClick={handleClose} aria-label="Close">
                <X className="w-4 h-4" />
              </AdminButton>
            </div>

            {/* Form body */}
            <form id="flag-form" onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Flag Type */}
              <div>
                <label htmlFor="flag-type" className="block text-sm font-medium text-[#434E54] mb-2">
                  Flag Type <span className="text-[#D4A574]">*</span>
                </label>
                <select
                  id="flag-type"
                  value={flagType}
                  onChange={(e) => setFlagType(e.target.value as CustomerFlagType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]
                             transition-colors"
                  disabled={loading}
                >
                  {FLAG_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#434E54] mb-2">
                  Description <span className="text-[#D4A574]">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Provide details about this flag..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]
                             transition-colors resize-none"
                  disabled={loading}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-[#434E54]/50">Required for all flag types</p>
                  <p className={`text-xs ${remainingChars < 50 ? 'text-orange-600' : 'text-[#434E54]/50'}`}>
                    {remainingChars} remaining
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </form>

            {/* Warm footer */}
            <div className="bg-[#EAE0D5]/30 rounded-b-2xl px-5 py-4 flex items-center justify-end gap-3">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                type="submit"
                form="flag-form"
                isLoading={loading}
                loadingText="Saving..."
                disabled={loading || !description.trim()}
              >
                {isEditing ? 'Update Flag' : 'Add Flag'}
              </AdminButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Remove Flag Confirmation Modal
 */
interface RemoveFlagConfirmationProps {
  flag: CustomerFlag;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function RemoveFlagConfirmation({
  flag,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: RemoveFlagConfirmationProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap + scroll lock
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const trap = createFocusTrap(panelRef.current);
    trap.activate();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      trap.deactivate();
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, loading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Remove Flag"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            {/* Warm header */}
            <div className="bg-[#EAE0D5] rounded-t-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/60">
                  <AlertTriangle className="w-5 h-5 text-[#434E54]" />
                </div>
                <h2 className="text-lg font-semibold text-[#434E54]">Remove Flag</h2>
              </div>
              <AdminButton
                variant="ghost"
                size="xs"
                onClick={onClose}
                disabled={loading}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </AdminButton>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <p className="text-[#434E54]/80">
                Are you sure you want to remove the{' '}
                <strong>{getFlagLabel(flag.flag_type)}</strong> flag?
              </p>
              <div className="p-3 rounded-lg bg-[#FFFBF7] border border-[#EAE0D5]">
                <p className="text-sm text-[#434E54]/80">{flag.description}</p>
              </div>
              <p className="text-sm text-[#434E54]/60">
                This action will deactivate the flag. It will no longer appear on the customer profile.
              </p>
            </div>

            {/* Warm footer */}
            <div className="bg-[#EAE0D5]/30 rounded-b-2xl px-5 py-4 flex items-center justify-end gap-3">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                onClick={onConfirm}
                isLoading={loading}
                loadingText="Removing..."
              >
                Remove Flag
              </AdminButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
