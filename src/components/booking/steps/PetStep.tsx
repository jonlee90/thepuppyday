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

interface PetStepProps {
  customerId?: string | null; // For admin mode - show pets for this customer
}

export function PetStep({ customerId }: PetStepProps = {}) {
  const [showForm, setShowForm] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  // In admin mode, fetch pets for the selected customer; otherwise use current user
  const effectiveOwnerId = customerId || user?.id;
  const { pets, isLoading, error, refetch } = usePets(effectiveOwnerId);
  const {
    selectedPetId,
    newPetData,
    selectedService,
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
        {/* Header with dog theme */}
        <div className="relative">
          {/* Subtle paw print decoration */}
          <div className="absolute -top-2 -left-2 opacity-[0.04] pointer-events-none hidden lg:block">
            <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
            </svg>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#434E54]">Select Your Pet</h2>
          </div>
          <p className="text-[#434E54]/70 leading-relaxed">Tell us which furry family member we'll be pampering today</p>
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
        {/* Header with dog theme */}
        <div className="relative">
          {/* Subtle paw print decoration */}
          <div className="absolute -top-2 -left-2 opacity-[0.04] pointer-events-none hidden lg:block">
            <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
            </svg>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#434E54]">Select Your Pet</h2>
          </div>
          <p className="text-[#434E54]/70 leading-relaxed">Tell us which furry family member we'll be pampering today</p>
        </div>

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
          <p className="text-[#434E54]/70 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#434E54]/90 transition-colors duration-200"
          >
            Retry
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={prevStep}
            className="text-[#434E54] font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#EAE0D5] transition-colors duration-200
                     flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
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
        {/* Header with dog theme */}
        <div className="relative">
          {/* Subtle paw print decoration */}
          <div className="absolute -top-2 -left-2 opacity-[0.04] pointer-events-none hidden lg:block">
            <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
            </svg>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#434E54]">
              {isAuthenticated ? 'Add New Pet' : 'Tell Us About Your Pet'}
            </h2>
          </div>
          <p className="text-[#434E54]/70 leading-relaxed">
            {isAuthenticated
              ? 'Enter your pet\'s information so we can provide the best care'
              : 'We need some details about your furry friend to personalize their grooming experience'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <PetForm
            onSubmit={handleFormSubmit}
            onCancel={pets.length > 0 ? handleFormCancel : undefined}
            initialData={newPetData || undefined}
            selectedService={selectedService}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={prevStep}
            className="text-[#434E54] font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#EAE0D5] transition-colors duration-200
                     flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
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
      {/* Header with dog theme */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute -top-2 -left-2 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Select Your Pet</h2>
        </div>
        <p className="text-[#6B7280] leading-relaxed">Tell us which furry family member we'll be pampering today</p>
      </div>

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
              onClick={() => setShowForm(true)}
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

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={prevStep}
          className="text-[#434E54] font-medium py-2.5 px-5 rounded-lg
                   hover:bg-[#EAE0D5] transition-colors duration-200
                   flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
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
          className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg
                   hover:bg-[#434E54]/90 transition-all duration-200 shadow-md hover:shadow-lg
                   disabled:bg-[#434E54]/40 disabled:cursor-not-allowed disabled:opacity-50
                   flex items-center gap-2"
        >
          Continue
          <svg
            className="w-5 h-5"
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
