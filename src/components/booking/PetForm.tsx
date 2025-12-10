/**
 * Pet creation form for booking wizard
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petFormSchema, type PetFormData } from '@/lib/booking/validation';
import { getSizeLabel } from '@/lib/booking/pricing';
import { getMockStore } from '@/mocks/supabase/store';
import type { Breed, PetSize } from '@/types/database';

interface PetFormProps {
  onSubmit: (data: PetFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<PetFormData>;
}

const PET_SIZES: PetSize[] = ['small', 'medium', 'large', 'xlarge'];

export function PetForm({ onSubmit, onCancel, initialData }: PetFormProps) {
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
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Pet Name *</span>
        </label>
        <input
          type="text"
          placeholder="Enter your pet's name"
          className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
          {...register('name')}
        />
        {errors.name && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.name.message}</span>
          </label>
        )}
      </div>

      {/* Pet size */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Pet Size *</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PET_SIZES.map((size) => (
            <label
              key={size}
              className={`
                flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors
                ${
                  selectedSize === size
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-base-300 hover:border-primary/50'
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
                <span className="block font-medium">{getSizeLabel(size)}</span>
              </div>
            </label>
          ))}
        </div>
        {errors.size && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.size.message}</span>
          </label>
        )}
      </div>

      {/* Breed selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Breed</span>
          <span className="label-text-alt text-base-content/50">Optional</span>
        </label>
        <select
          className="select select-bordered w-full"
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
            className="input input-bordered w-full mt-2"
            {...register('breed_custom')}
          />
        )}
      </div>

      {/* Weight */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Weight (lbs)</span>
          <span className="label-text-alt text-base-content/50">Optional</span>
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="300"
          placeholder="Enter weight in pounds"
          className={`input input-bordered w-full ${errors.weight ? 'input-error' : ''}`}
          {...register('weight', { valueAsNumber: true })}
        />
        {errors.weight && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.weight.message}</span>
          </label>
        )}
      </div>

      {/* Notes */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Special Notes</span>
          <span className="label-text-alt text-base-content/50">Optional</span>
        </label>
        <textarea
          placeholder="Any special instructions or notes about your pet"
          className={`textarea textarea-bordered w-full ${errors.notes ? 'textarea-error' : ''}`}
          rows={3}
          {...register('notes')}
        />
        {errors.notes && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.notes.message}</span>
          </label>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost flex-1">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-primary ${onCancel ? 'flex-1' : 'w-full'}`}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm" />
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
