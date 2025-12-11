/**
 * Pet selection step for booking wizard
 */

'use client';

import { useEffect, useState } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { PetCard, AddPetCard } from '../PetCard';
import { PetForm } from '../PetForm';
import { usePets } from '@/hooks/usePets';
import type { Pet, CreatePetInput } from '@/types/database';
import type { PetFormData } from '@/lib/booking/validation';

export function PetStep() {
  const [showForm, setShowForm] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const { pets, isLoading, error, refetch } = usePets();
  const {
    selectedPetId,
    newPetData,
    selectPet,
    setNewPetData,
    nextStep,
    prevStep,
  } = useBookingStore();

  // Show form for guests or when no pets available
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || pets.length === 0)) {
      setShowForm(true);
    }
  }, [isAuthenticated, pets.length, isLoading]);

  const handleSelectPet = (pet: Pet) => {
    selectPet(pet);
    setShowForm(false);
  };

  const handleAddNewPet = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (data: PetFormData) => {
    // Convert form data to CreatePetInput
    const petInput: CreatePetInput = {
      owner_id: user?.id || '', // Will be set on booking confirmation for guests
      name: data.name,
      size: data.size,
      breed_id: data.breed_id || undefined,
      breed_custom: data.breed_custom || undefined,
      weight: data.weight || undefined,
      notes: data.notes || undefined,
    };

    setNewPetData(petInput);
    setShowForm(false);
  };

  const handleFormCancel = () => {
    if (pets.length > 0) {
      setShowForm(false);
    }
  };

  const handleContinue = () => {
    if (selectedPetId || newPetData) {
      nextStep();
    }
  };

  const canContinue = selectedPetId !== null || newPetData !== null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select Your Pet</h2>
          <p className="text-[#6B7280]">Choose which pet is getting groomed</p>
        </div>
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select Your Pet</h2>
          <p className="text-[#6B7280]">Choose which pet is getting groomed</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#EF4444]"
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
          <p className="text-[#6B7280] mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#363F44] transition-colors duration-200"
          >
            Retry
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button onClick={prevStep} className="btn btn-ghost">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>
    );
  }

  // Show form for guests or when adding new pet
  if (showForm && (!isAuthenticated || pets.length === 0 || showForm)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">
            {isAuthenticated ? 'Add New Pet' : 'Tell Us About Your Pet'}
          </h2>
          <p className="text-[#6B7280]">
            {isAuthenticated
              ? 'Enter your pet\'s information'
              : 'We need some details about your furry friend'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <PetForm
            onSubmit={handleFormSubmit}
            onCancel={pets.length > 0 ? handleFormCancel : undefined}
            initialData={newPetData || undefined}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button onClick={prevStep} className="btn btn-ghost">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>
    );
  }

  // Show pet selection for authenticated users
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#434E54] mb-2">Select Your Pet</h2>
        <p className="text-[#6B7280]">Choose which pet is getting groomed</p>
      </div>

      {/* New pet info banner */}
      {newPetData && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-success">New pet: {newPetData.name}</p>
                <p className="text-sm text-base-content/60">
                  This pet will be created when you confirm your booking
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-ghost btn-sm"
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

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="btn btn-ghost">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="btn btn-primary btn-lg"
        >
          Continue
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
