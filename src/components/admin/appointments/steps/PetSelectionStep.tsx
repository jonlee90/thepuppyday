/**
 * Pet Selection Step
 * Task 0015: Display existing pets or add new pet
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, AlertTriangle } from 'lucide-react';
import type { ManualAppointmentState, SelectedPet } from '@/types/admin-appointments';
import type { PetSize } from '@/types/database';
import { getSizeLabel, getSizeFromWeight } from '@/lib/booking/pricing';
import { z } from 'zod';

interface PetSelectionStepProps {
  state: ManualAppointmentState;
  updateState: (updates: Partial<ManualAppointmentState>) => void;
  onNext: () => void;
}

interface Pet {
  id: string;
  name: string;
  breed_id: string;
  breed_name: string;
  size: PetSize;
  weight: number | null;
}

interface Breed {
  id: string;
  name: string;
}

export function PetSelectionStep({ state, updateState, onNext }: PetSelectionStepProps) {
  const [existingPets, setExistingPets] = useState<Pet[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [showNewPetForm, setShowNewPetForm] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(
    state.selectedPet?.id || null
  );

  // New pet form state
  const [newPetForm, setNewPetForm] = useState({
    name: '',
    breed_id: '',
    size: '' as PetSize | '',
    weight: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [weightSizeWarning, setWeightSizeWarning] = useState('');

  // Load existing pets
  useEffect(() => {
    if (!state.selectedCustomer?.id) return;

    const fetchPets = async () => {
      setIsLoadingPets(true);
      try {
        const response = await fetch(
          `/api/admin/customers/${state.selectedCustomer.id}/pets`
        );
        if (response.ok) {
          const data = await response.json();
          setExistingPets(data.pets || []);
        }
      } catch (error) {
        console.error('Fetch pets error:', error);
      } finally {
        setIsLoadingPets(false);
      }
    };

    fetchPets();
  }, [state.selectedCustomer?.id]);

  // Load breeds
  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const response = await fetch('/api/admin/breeds');
        if (response.ok) {
          const data = await response.json();
          setBreeds(data.breeds || []);
        }
      } catch (error) {
        console.error('Fetch breeds error:', error);
      }
    };

    fetchBreeds();
  }, []);

  // Handle existing pet selection
  const handleSelectPet = useCallback(
    (pet: Pet) => {
      setSelectedPetId(pet.id);
      updateState({
        selectedPet: {
          id: pet.id,
          name: pet.name,
          breed_id: pet.breed_id,
          breed_name: pet.breed_name,
          size: pet.size,
          weight: pet.weight || 0,
          isNew: false,
        },
      });
    },
    [updateState]
  );

  // Check weight/size mismatch
  useEffect(() => {
    if (newPetForm.weight && newPetForm.size) {
      const weight = parseFloat(newPetForm.weight);
      const expectedSize = getSizeFromWeight(weight);
      if (expectedSize !== newPetForm.size) {
        setWeightSizeWarning(
          `Weight ${weight} lbs typically corresponds to ${getSizeLabel(expectedSize)}, but you selected ${getSizeLabel(newPetForm.size as PetSize)}`
        );
      } else {
        setWeightSizeWarning('');
      }
    } else {
      setWeightSizeWarning('');
    }
  }, [newPetForm.weight, newPetForm.size]);

  // Validate new pet form
  const validateNewPetForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!newPetForm.name.trim()) {
      errors.name = 'Pet name is required';
    }

    if (!newPetForm.size) {
      errors.size = 'Size is required';
    }

    if (!newPetForm.breed_id) {
      errors.breed_id = 'Breed is required';
    }

    if (newPetForm.weight) {
      const weight = parseFloat(newPetForm.weight);
      if (isNaN(weight) || weight <= 0) {
        errors.weight = 'Weight must be a positive number';
      } else if (weight > 300) {
        errors.weight = 'Weight seems too high';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newPetForm]);

  // Handle new pet form submission
  const handleNewPetSubmit = useCallback(() => {
    if (!validateNewPetForm()) return;

    const selectedBreed = breeds.find((b) => b.id === newPetForm.breed_id);

    updateState({
      selectedPet: {
        name: newPetForm.name,
        breed_id: newPetForm.breed_id,
        breed_name: selectedBreed?.name || '',
        size: newPetForm.size as PetSize,
        weight: newPetForm.weight ? parseFloat(newPetForm.weight) : 0,
        isNew: true,
      },
    });
    setSelectedPetId('new');
  }, [newPetForm, breeds, validateNewPetForm, updateState]);

  // Handle next button
  const handleNext = useCallback(() => {
    if (state.selectedPet) {
      onNext();
    }
  }, [state.selectedPet, onNext]);

  const canProceed = state.selectedPet !== null;

  return (
    <div className="space-y-6">
      {/* Existing Pets */}
      {isLoadingPets ? (
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md text-[#434E54]"></span>
        </div>
      ) : existingPets.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#434E54]">
            Select Existing Pet ({existingPets.length})
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {existingPets.map((pet) => (
              <label
                key={pet.id}
                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPetId === pet.id
                    ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                    : 'border-gray-200 bg-white hover:border-[#434E54]/30'
                }`}
              >
                <input
                  type="radio"
                  name="pet"
                  value={pet.id}
                  checked={selectedPetId === pet.id}
                  onChange={() => handleSelectPet(pet)}
                  className="radio radio-sm radio-primary mt-1"
                />
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-[#434E54]">{pet.name}</div>
                  <div className="text-sm text-[#6B7280]">{pet.breed_name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54]">
                      {getSizeLabel(pet.size)}
                    </span>
                    {pet.weight && (
                      <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54]">
                        {pet.weight} lbs
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-[#6B7280]">
          No existing pets found. Please add a new pet below.
        </div>
      )}

      {/* Divider */}
      {existingPets.length > 0 && <div className="divider text-[#9CA3AF]">OR</div>}

      {/* New Pet Form */}
      <div>
        <button
          onClick={() => setShowNewPetForm(!showNewPetForm)}
          className="flex items-center gap-2 text-[#434E54] font-semibold hover:text-[#363F44] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Pet
          {showNewPetForm ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showNewPetForm && (
          <div className="mt-4 p-6 bg-[#FFFBF7] rounded-xl border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-1">
                Pet Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPetForm.name}
                onChange={(e) => setNewPetForm({ ...newPetForm, name: e.target.value })}
                className={`input input-bordered w-full bg-white ${
                  formErrors.name ? 'border-red-500' : ''
                }`}
                placeholder="Max"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-1">
                Breed <span className="text-red-500">*</span>
              </label>
              <select
                value={newPetForm.breed_id}
                onChange={(e) => setNewPetForm({ ...newPetForm, breed_id: e.target.value })}
                className={`select select-bordered w-full bg-white ${
                  formErrors.breed_id ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select breed...</option>
                {breeds.map((breed) => (
                  <option key={breed.id} value={breed.id}>
                    {breed.name}
                  </option>
                ))}
              </select>
              {formErrors.breed_id && (
                <p className="text-sm text-red-500 mt-1">{formErrors.breed_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-2">
                Size <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['small', 'medium', 'large', 'xlarge'] as PetSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setNewPetForm({ ...newPetForm, size })}
                    className={`btn ${
                      newPetForm.size === size
                        ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
                        : 'btn-outline border-gray-200 hover:border-[#434E54] text-[#434E54]'
                    }`}
                  >
                    {getSizeLabel(size)}
                  </button>
                ))}
              </div>
              {formErrors.size && (
                <p className="text-sm text-red-500 mt-1">{formErrors.size}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-1">
                Weight (lbs) <span className="text-[#9CA3AF]">(Optional)</span>
              </label>
              <input
                type="number"
                value={newPetForm.weight}
                onChange={(e) => setNewPetForm({ ...newPetForm, weight: e.target.value })}
                className={`input input-bordered w-full bg-white ${
                  formErrors.weight ? 'border-red-500' : ''
                }`}
                placeholder="25"
                min="1"
                max="300"
              />
              {formErrors.weight && (
                <p className="text-sm text-red-500 mt-1">{formErrors.weight}</p>
              )}
              {weightSizeWarning && (
                <div className="alert alert-warning mt-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{weightSizeWarning}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleNewPetSubmit}
              className="btn bg-[#434E54] text-white hover:bg-[#363F44] w-full"
            >
              Use This Pet
            </button>
          </div>
        )}
      </div>

      {/* Selected Pet Display */}
      {state.selectedPet && (
        <div className="p-4 bg-[#6BCB77]/10 border-2 border-[#6BCB77] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#6BCB77] rounded-full"></div>
            <span className="text-sm font-semibold text-[#434E54]">Pet Selected</span>
          </div>
          <div className="font-semibold text-[#434E54]">
            {state.selectedPet.name}
            {state.selectedPet.isNew && (
              <span className="ml-2 badge badge-sm bg-[#434E54] text-white">New</span>
            )}
          </div>
          <div className="text-sm text-[#6B7280]">{state.selectedPet.breed_name}</div>
          <div className="flex gap-2 mt-1">
            <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54]">
              {getSizeLabel(state.selectedPet.size)}
            </span>
            {state.selectedPet.weight > 0 && (
              <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54]">
                {state.selectedPet.weight} lbs
              </span>
            )}
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`btn ${
            canProceed
              ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
              : 'btn-disabled bg-gray-300 text-gray-500'
          }`}
        >
          Next: Select Service
        </button>
      </div>
    </div>
  );
}
