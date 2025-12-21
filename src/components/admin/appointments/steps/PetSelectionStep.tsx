/**
 * Pet Selection Step
 * Task 0015: Display existing pets or add new pet
 * Redesigned with mobile-first, touch-friendly UI matching customer booking flow
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, AlertTriangle, Heart, Dog } from 'lucide-react';
import type { ManualAppointmentState } from '@/types/admin-appointments';
import type { PetSize } from '@/types/database';
import { getSizeLabel, getSizeFromWeight } from '@/lib/booking/pricing';

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

export function PetSelectionStep({ state, updateState }: PetSelectionStepProps) {
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

  return (
    <div className="space-y-6">
      {/* Header with icon badge and paw print decoration */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute -top-2 -left-2 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 text-[#434E54]" />
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Select Pet</h2>
        </div>
        <p className="text-[#434E54]/70">Choose an existing pet or add a new one</p>
      </div>

      {/* Existing Pets */}
      {isLoadingPets ? (
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md text-[#434E54]"></span>
        </div>
      ) : existingPets.length > 0 ? (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#434E54]">
            Select Existing Pet ({existingPets.length})
          </label>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {existingPets.map((pet) => (
              <label
                key={pet.id}
                className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPetId === pet.id
                    ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                    : 'border-[#E5E5E5] bg-white hover:border-[#434E54]/30 shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="pet"
                  value={pet.id}
                  checked={selectedPetId === pet.id}
                  onChange={() => handleSelectPet(pet)}
                  className="radio radio-sm radio-primary mt-1 min-w-[20px]"
                  aria-label={`Select ${pet.name}`}
                />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="font-semibold text-[#434E54]">{pet.name}</div>
                  <div className="text-sm text-[#6B7280]">{pet.breed_name}</div>
                  <div className="flex gap-2 mt-2">
                    <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none px-3 py-1 rounded-lg">
                      {getSizeLabel(pet.size)}
                    </span>
                    {pet.weight && (
                      <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none px-3 py-1 rounded-lg">
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
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
            <Dog className="w-8 h-8 text-[#434E54]/60" />
          </div>
          <p className="text-[#6B7280]">No existing pets found. Please add a new pet below.</p>
        </div>
      )}

      {/* Divider */}
      {existingPets.length > 0 && (
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-[#E5E5E5]"></div>
          <span className="px-4 text-sm text-[#9CA3AF] bg-[#F8EEE5]">OR</span>
          <div className="flex-grow border-t border-[#E5E5E5]"></div>
        </div>
      )}

      {/* New Pet Form */}
      <div>
        <button
          onClick={() => setShowNewPetForm(!showNewPetForm)}
          className="flex items-center gap-2 text-[#434E54] font-semibold hover:text-[#363F44] transition-colors duration-200 min-h-[44px]"
          aria-expanded={showNewPetForm}
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
          <div className="mt-4 p-4 md:p-6 bg-[#FFFBF7] rounded-xl border border-[#E5E5E5] space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-2">
                Pet Name <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={newPetForm.name}
                onChange={(e) => setNewPetForm({ ...newPetForm, name: e.target.value })}
                className={`input input-bordered w-full h-12 bg-white rounded-lg ${
                  formErrors.name ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
                placeholder="Max"
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
              />
              {formErrors.name && (
                <p id="name-error" className="text-sm text-[#EF4444] mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-2">
                Breed <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={newPetForm.breed_id}
                onChange={(e) => setNewPetForm({ ...newPetForm, breed_id: e.target.value })}
                className={`select select-bordered w-full h-12 bg-white rounded-lg ${
                  formErrors.breed_id ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
                aria-invalid={!!formErrors.breed_id}
                aria-describedby={formErrors.breed_id ? 'breed-error' : undefined}
              >
                <option value="">Select breed...</option>
                {breeds.map((breed) => (
                  <option key={breed.id} value={breed.id}>
                    {breed.name}
                  </option>
                ))}
              </select>
              {formErrors.breed_id && (
                <p id="breed-error" className="text-sm text-[#EF4444] mt-1">{formErrors.breed_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-2">
                Size <span className="text-[#EF4444]">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['small', 'medium', 'large', 'xlarge'] as PetSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setNewPetForm({ ...newPetForm, size })}
                    className={`btn min-h-[48px] h-12 rounded-lg transition-all duration-200 ${
                      newPetForm.size === size
                        ? 'bg-[#434E54] text-white hover:bg-[#363F44] border-none shadow-md'
                        : 'btn-outline border-[#E5E5E5] hover:border-[#434E54] text-[#434E54]'
                    }`}
                    aria-pressed={newPetForm.size === size}
                  >
                    {getSizeLabel(size)}
                  </button>
                ))}
              </div>
              {formErrors.size && (
                <p className="text-sm text-[#EF4444] mt-1">{formErrors.size}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-2">
                Weight (lbs) <span className="text-[#9CA3AF]">(Optional)</span>
              </label>
              <input
                type="number"
                value={newPetForm.weight}
                onChange={(e) => setNewPetForm({ ...newPetForm, weight: e.target.value })}
                className={`input input-bordered w-full h-12 bg-white rounded-lg ${
                  formErrors.weight ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
                placeholder="25"
                min="1"
                max="300"
                aria-invalid={!!formErrors.weight}
                aria-describedby={formErrors.weight ? 'weight-error' : undefined}
              />
              {formErrors.weight && (
                <p id="weight-error" className="text-sm text-[#EF4444] mt-1">{formErrors.weight}</p>
              )}
              {weightSizeWarning && (
                <div className="alert bg-[#FFB347]/10 border border-[#FFB347] rounded-lg p-3 mt-2" role="alert">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm text-[#434E54]">{weightSizeWarning}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleNewPetSubmit}
              className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none w-full h-12 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Use This Pet
            </button>
          </div>
        )}
      </div>

      {/* Selected Pet Display */}
      {state.selectedPet && (
        <div className="p-4 bg-[#6BCB77]/10 border-2 border-[#6BCB77] rounded-xl" role="status">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#6BCB77] rounded-full"></div>
            <span className="text-sm font-semibold text-[#434E54]">Pet Selected</span>
          </div>
          <div className="font-semibold text-[#434E54]">
            {state.selectedPet.name}
            {state.selectedPet.isNew && (
              <span className="ml-2 badge badge-sm bg-[#434E54] text-white border-none">New</span>
            )}
          </div>
          <div className="text-sm text-[#6B7280]">{state.selectedPet.breed_name}</div>
          <div className="flex gap-2 mt-2">
            <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none px-3 py-1 rounded-lg">
              {getSizeLabel(state.selectedPet.size)}
            </span>
            {state.selectedPet.weight > 0 && (
              <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none px-3 py-1 rounded-lg">
                {state.selectedPet.weight} lbs
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
