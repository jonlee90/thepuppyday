/**
 * CustomerFlagForm Component
 * Modal form for adding/editing customer flags
 * Task 0021: Create CustomerFlagForm modal
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
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

  const isEditing = !!flag;
  const remainingChars = MAX_DESCRIPTION_LENGTH - description.length;

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
        body: JSON.stringify({
          flag_type: flagType,
          description: description.trim(),
          color,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} flag`);
      }

      onSuccess();
      handleClose();
    } catch (err) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#434E54]">
            {isEditing ? 'Edit Flag' : 'Add Customer Flag'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Flag Type */}
          <div>
            <label htmlFor="flag-type" className="block text-sm font-medium text-[#434E54] mb-2">
              Flag Type <span className="text-red-500">*</span>
            </label>
            <select
              id="flag-type"
              value={flagType}
              onChange={(e) => setFlagType(e.target.value as CustomerFlagType)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                         transition-colors text-[#434E54]"
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
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="Provide details about this flag..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                         transition-colors text-[#434E54] resize-none"
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Required for all flag types
              </p>
              <p className={`text-xs ${remainingChars < 50 ? 'text-orange-600' : 'text-gray-500'}`}>
                {remainingChars} characters remaining
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-[#434E54]
                         font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#434E54] text-white
                         font-medium hover:bg-[#363F44] transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !description.trim()}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Flag' : 'Add Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#434E54]">Remove Flag</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-[#6B7280]">
            Are you sure you want to remove the <strong>{getFlagLabel(flag.flag_type)}</strong> flag?
          </p>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-700">{flag.description}</p>
          </div>
          <p className="text-sm text-[#6B7280]">
            This action will deactivate the flag. It will no longer appear on the customer profile.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-[#434E54]
                       font-medium hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white
                       font-medium hover:bg-red-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Remove Flag'}
          </button>
        </div>
      </div>
    </div>
  );
}
