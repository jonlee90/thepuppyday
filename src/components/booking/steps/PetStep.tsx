/**
 * Pet selection/creation step for booking wizard
 * Extracted from DetailsStep — handles pet selection and new pet form.
 * No inline submit buttons — the modal footer drives all navigation.
 */

'use client';

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { PetCard, AddPetCard } from '../PetCard';
import { PetForm, type PetFormHandle } from '../PetForm';
import { usePets } from '@/hooks/usePets';
import type { Pet, CreatePetInput } from '@/types/database';
import type { PetFormData } from '@/lib/booking/validation';
import type { BookingModalMode } from '@/hooks/useBookingModal';

export interface PetStepHandle {
  /** Validate and save. Returns true if step can proceed. */
  onContinue: () => Promise<boolean>;
}

interface PetStepProps {
  mode?: BookingModalMode;
  /** Callback to override the footer's canContinue state */
  onCanContinueChange?: (override: boolean | null) => void;
}

export const PetStep = forwardRef<PetStepHandle, PetStepProps>(
  function PetStep({ mode = 'customer', onCanContinueChange }, ref) {
    const {
      selectedCustomerId,
      selectedPetId,
      newPetData,
      selectedService,
      selectPet,
      setNewPetData,
    } = useBookingStore();

    const { isAuthenticated, user } = useAuthStore();

    const [showPetForm, setShowPetForm] = useState(false);
    const petFormRef = useRef<PetFormHandle>(null);

    const isNewCustomer = selectedCustomerId === 'new';

    const effectiveOwnerId = (() => {
      if (isNewCustomer) return null;
      if (selectedCustomerId && selectedCustomerId !== '') return selectedCustomerId;
      if (mode === 'customer') return user?.id ?? null;
      return null;
    })();

    const { pets, isLoading: petsLoading, error: petsError, refetch: refetchPets } = usePets(effectiveOwnerId);

    // Auto-show pet form for new customers or customers with no pets
    useEffect(() => {
      if (!petsLoading) {
        const shouldShowForm =
          isNewCustomer ||
          (!isAuthenticated && mode === 'customer') ||
          pets.length === 0 ||
          (mode !== 'customer' && !selectedCustomerId);

        if (shouldShowForm) {
          setShowPetForm(true);
        }
      }
    }, [petsLoading, isNewCustomer, isAuthenticated, pets.length, mode, selectedCustomerId]);

    // --- Sync canContinue override to parent ---
    useEffect(() => {
      if (!onCanContinueChange) return;
      // When pet form is showing, always enable Continue (onContinue validates)
      if (showPetForm) {
        onCanContinueChange(true);
      } else {
        // Use default store-based check
        onCanContinueChange(null);
      }
    }, [onCanContinueChange, showPetForm]);

    // --- Handlers ---
    const handleSelectPet = (pet: Pet) => {
      selectPet(pet);
      setShowPetForm(false);
    };

    const handleAddNewPet = () => {
      setShowPetForm(true);
    };

    const handlePetFormSubmit = (data: PetFormData) => {
      const petInput: CreatePetInput = {
        owner_id: effectiveOwnerId || user?.id || '',
        name: data.name,
        size: data.size,
        breed_id: data.breed_id || undefined,
        breed_custom: data.breed_custom || undefined,
        gender: data.gender,
        color: data.color || undefined,
        birth_date: data.birth_date || undefined,
        notes: data.notes || undefined,
      };

      setNewPetData(petInput);
      setShowPetForm(false);
    };

    const handlePetFormCancel = () => {
      if (pets.length > 0) {
        setShowPetForm(false);
      }
    };

    // --- Imperative handle for footer Continue ---
    useImperativeHandle(ref, () => ({
      onContinue: async () => {
        // If pet form is showing, trigger its submit
        if (showPetForm && petFormRef.current) {
          return petFormRef.current.triggerSubmit();
        }
        // Otherwise, an existing pet is selected or newPetData exists — just proceed
        return true;
      },
    }), [showPetForm]);

    // ============================================
    // RENDER
    // ============================================

    if (petsLoading) {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#EAE0D5]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-[#EAE0D5] rounded w-1/3" />
                    <div className="h-4 bg-[#EAE0D5] rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (petsError) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-[#434E54]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#434E54]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#434E54] mb-2">Failed to Load Pets</h3>
            <p className="text-[#434E54]/70 mb-4">{petsError.message}</p>
            <button
              onClick={() => refetchPets()}
              className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
                       hover:bg-[#434E54]/90 transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Show pet form
    if (showPetForm) {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-[#434E54]/70 leading-relaxed max-w-2xl">
              {isAuthenticated
                ? "Enter your pet's information so we can provide the best care"
                : 'Tell us about your pet so we can provide the best grooming experience'}
            </p>

            <div className="bg-white rounded-xl shadow-md p-4">
              <PetForm
                ref={petFormRef}
                onSubmit={handlePetFormSubmit}
                onCancel={pets.length > 0 ? handlePetFormCancel : undefined}
                initialData={newPetData || undefined}
                selectedService={selectedService}
                hideActions
              />
            </div>
          </div>
        </div>
      );
    }

    // Show pet selection (existing pets as cards)
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-[#434E54]/70 leading-relaxed max-w-2xl">Select your pet for this appointment</p>

          {/* New pet info banner */}
          {newPetData && (
            <div className="bg-[#434E54]/10 border border-[#434E54]/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#434E54]/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#434E54]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#434E54]">New pet: {newPetData.name}</p>
                    <p className="text-sm text-[#434E54]/70">
                      This pet will be created when you confirm your booking
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPetForm(true)}
                  className="text-[#434E54] font-medium py-1.5 px-3 rounded-lg text-sm
                           hover:bg-[#EAE0D5] transition-colors duration-200"
                >
                  Edit
                </button>
              </div>
            </div>
          )}

          {/* Pets list */}
          <div className="space-y-4">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                isSelected={selectedPetId === pet.id}
                onSelect={() => handleSelectPet(pet)}
              />
            ))}
            <AddPetCard onClick={handleAddNewPet} />
          </div>
        </div>
      </div>
    );
  }
);
