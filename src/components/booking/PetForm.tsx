/**
 * Pet creation form for booking wizard
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petFormSchema, type PetFormData } from '@/lib/booking/validation';
import { getSizeLabel, getServicePriceForSize, formatCurrency } from '@/lib/booking/pricing';
import { getMockStore } from '@/mocks/supabase/store';
import type { Breed, PetSize, ServiceWithPrices } from '@/types/database';

interface PetFormProps {
  onSubmit: (data: PetFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<PetFormData>;
  selectedService?: ServiceWithPrices | null;
}

const PET_SIZES: PetSize[] = ['small', 'medium', 'large', 'xlarge'];

export function PetForm({ onSubmit, onCancel, initialData, selectedService }: PetFormProps) {
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
      weight: initialData?.weight || null,
      notes: initialData?.notes || '',
    },
  });

  const selectedSize = watch('size');
  const selectedBreedId = watch('breed_id');

  // Load breeds on mount
  useEffect(() => {
    const store = getMockStore();
    const breedsData = store.select('breeds', {
      order: { column: 'name', ascending: true },
    }) as unknown as Breed[];
    setBreeds(breedsData);
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

      {/* Weight */}
      <div className="space-y-2">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#434E54]">Weight (lbs)</span>
            <span className="text-xs text-[#434E54]/60">Optional</span>
          </div>
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="300"
          placeholder="Enter weight in pounds"
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1
                     ${errors.weight
                       ? 'border-[#434E54] bg-[#434E54]/5'
                       : 'border-[#EAE0D5] hover:border-[#434E54]/40 bg-white'}`}
          {...register('weight', { valueAsNumber: true })}
        />
        {errors.weight && (
          <p className="text-sm text-[#434E54] font-medium mt-1.5">
            {errors.weight.message}
          </p>
        )}
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
    </form>
  );
}
