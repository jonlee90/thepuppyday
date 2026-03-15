/**
 * Pet creation form for booking wizard
 */

'use client';

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petFormSchema, type PetFormData } from '@/lib/booking/validation';
import { getSizeLabel, getServicePriceForSize, formatCurrency } from '@/lib/booking/pricing';
import type { Breed, PetSize, ServiceWithPrices } from '@/types/database';

export interface PetFormHandle {
  /** Programmatically trigger form validation + submit. Returns true if valid. */
  triggerSubmit: () => Promise<boolean>;
}

interface PetFormProps {
  onSubmit: (data: PetFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<PetFormData>;
  selectedService?: ServiceWithPrices | null;
  /** Hide the Save Pet / Cancel buttons (footer handles submission) */
  hideActions?: boolean;
}

const PET_SIZES: PetSize[] = ['small', 'medium', 'large', 'xlarge'];

export const PetForm = forwardRef<PetFormHandle, PetFormProps>(function PetForm(
  { onSubmit, onCancel, initialData, selectedService, hideActions },
  ref
) {
  const [breeds, setBreeds] = useState<Breed[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      size: initialData?.size,
      breed_id: initialData?.breed_id || '',
      breed_custom: initialData?.breed_custom || '',
      gender: initialData?.gender || '',
      color: initialData?.color || '',
      birth_date: initialData?.birth_date || '',
      notes: initialData?.notes || '',
    },
  });

  const selectedSize = watch('size');
  const selectedBreedId = watch('breed_id');

  // Expose imperative handle for programmatic submit
  useImperativeHandle(ref, () => ({
    triggerSubmit: () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          (data) => {
            onSubmit(data);
            resolve(true);
          },
          () => resolve(false)
        )();
      }),
  }), [handleSubmit, onSubmit]);

  // Load breeds on mount
  useEffect(() => {
    const loadBreeds = async () => {
      try {
        const response = await fetch('/api/breeds');
        if (response.ok) {
          const data = await response.json();
          setBreeds(data.breeds || []);
        } else {
          console.error('Failed to load breeds:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading breeds:', error);
      }
    };
    loadBreeds();
  }, []);

  // Clear custom breed when selecting from dropdown
  useEffect(() => {
    if (selectedBreedId) {
      setValue('breed_custom', '');
    }
  }, [selectedBreedId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Pet name */}
      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-semibold text-[#434E54]">Pet Name *</span>
        </label>
        <input
          type="text"
          placeholder="Enter your pet's name"
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1
                     ${errors.name
                       ? 'border-[#434E54] bg-[#434E54]/5'
                       : 'border-[#EAE0D5] hover:border-[#434E54]/40 bg-white'}`}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-[#434E54] font-medium mt-1.5">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Breed selection */}
      <div className="space-y-2">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#434E54]">Breed</span>
            <span className="text-xs text-[#434E54]/60">Optional</span>
          </div>
        </label>
        <select
          className="w-full px-4 py-3 rounded-lg border-2 border-[#EAE0D5]
                   hover:border-[#434E54]/40 bg-white text-[#434E54] transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1"
          {...register('breed_id')}
        >
          <option value="">Select a breed or enter custom</option>
          {breeds.map((breed) => (
            <option key={breed.id} value={breed.id}>
              {breed.name}
            </option>
          ))}
        </select>

        {/* Custom breed input */}
        {!selectedBreedId && (
          <input
            type="text"
            placeholder="Or enter breed name"
            className="w-full px-4 py-3 rounded-lg border-2 border-[#EAE0D5]
                     hover:border-[#434E54]/40 bg-white transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1 mt-2"
            {...register('breed_custom')}
          />
        )}
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-semibold text-[#434E54]">Gender *</span>
        </label>
        <select
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1
                     ${errors.gender ? 'border-[#434E54] bg-[#434E54]/5' : 'border-[#EAE0D5] hover:border-[#434E54]/40 bg-white'}`}
          {...register('gender')}
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {errors.gender && (
          <p className="text-sm text-[#434E54] font-medium mt-1.5">{errors.gender.message}</p>
        )}
      </div>

      {/* Color / Markings */}
      <div className="space-y-2">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#434E54]">Color / Markings</span>
            <span className="text-xs text-[#434E54]/60">Optional</span>
          </div>
        </label>
        <input
          type="text"
          placeholder="e.g. Golden, Black & White, Brown with spots"
          className="w-full px-4 py-3 rounded-lg border-2 border-[#EAE0D5] hover:border-[#434E54]/40 bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1"
          {...register('color')}
        />
      </div>

      {/* Birth Date */}
      <div className="space-y-2">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#434E54]">Birth Date</span>
            <span className="text-xs text-[#434E54]/60">Optional</span>
          </div>
        </label>
        <input
          type="date"
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 rounded-lg border-2 border-[#EAE0D5] hover:border-[#434E54]/40 bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1"
          {...register('birth_date')}
        />
      </div>

      {/* Pet size */}
      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-semibold text-[#434E54]">Pet Size *</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PET_SIZES.map((size) => {
            const price = selectedService ? getServicePriceForSize(selectedService, size) : null;
            return (
              <label
                key={size}
                className={`
                  flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  min-h-[72px] hover:scale-[1.02]
                  ${
                    selectedSize === size
                      ? 'border-[#434E54] bg-[#434E54]/10 text-[#434E54] shadow-md ring-2 ring-[#434E54]/20'
                      : 'border-[#EAE0D5] hover:border-[#434E54]/50 bg-white'
                  }
                `}
              >
                <input
                  type="radio"
                  value={size}
                  className="sr-only"
                  {...register('size')}
                />
                <div className="text-center">
                  <span className="block font-semibold text-[#434E54]">{getSizeLabel(size)}</span>
                  {price !== null && (
                    <span className="block text-sm font-bold text-[#434E54] mt-1.5">
                      {formatCurrency(price)}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        {errors.size && (
          <p className="text-sm text-[#434E54] font-medium mt-1.5">
            {errors.size.message}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#434E54]">Special Notes</span>
            <span className="text-xs text-[#434E54]/60">Optional</span>
          </div>
        </label>
        <textarea
          placeholder="Any special instructions or notes about your pet"
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 resize-none
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1
                     ${errors.notes
                       ? 'border-[#434E54] bg-[#434E54]/5'
                       : 'border-[#EAE0D5] hover:border-[#434E54]/40 bg-white'}`}
          rows={3}
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-sm text-[#434E54] font-medium mt-1.5">
            {errors.notes.message}
          </p>
        )}
      </div>

      {/* Actions */}
      {!hideActions && (
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[#434E54] font-medium py-2.5 px-5 rounded-lg
                       hover:bg-[#EAE0D5] transition-colors duration-200
                       flex-1"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg
                       hover:bg-[#434E54]/90 transition-all duration-200 shadow-md hover:shadow-lg
                       disabled:bg-[#434E54]/40 disabled:cursor-not-allowed disabled:opacity-50
                       flex items-center justify-center gap-2 ${onCancel ? 'flex-1' : 'w-full'}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Pet'
            )}
          </button>
        </div>
      )}
    </form>
  );
});
