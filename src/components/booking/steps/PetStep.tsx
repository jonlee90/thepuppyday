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
import type { BookingModalMode } from '@/hooks/useBookingModal';

interface PetStepProps {
  customerId?: string | null; // For admin mode - show pets for this customer
  mode?: BookingModalMode; // Booking mode affects fallback behavior
}

export function PetStep({ customerId, mode = 'customer' }: PetStepProps) {
  const [showForm, setShowForm] = useState(false);

  const { user, isAuthenticated } = useAuthStore();

  // Check if this is a new customer (created in CustomerStep)
  const isNewCustomer = customerId === 'new';

  // Determine effective owner ID based on mode:
  // - Customer mode: use customerId if set, otherwise fall back to current user
  // - Admin/Walkin mode: only use customerId, never fall back to admin's own user
  const effectiveOwnerId = (() => {
    if (isNewCustomer) return null; // New customer has no pets yet
    if (customerId) return customerId; // Valid customer ID provided
    if (mode === 'customer') return user?.id ?? null; // Customer mode fallback
    return null; // Admin/Walkin mode with no customer selected
  })();

  const { pets, isLoading, error, refetch } = usePets(effectiveOwnerId);
  const {
    selectedPetId,
    newPetData,
    selectedService,
    selectPet,
    setNewPetData,
  } = useBookingStore();

  // Show form for: guests, new customers, or customers with no pets
  useEffect(() => {
    if (!isLoading) {
      // Show form if:
      // 1. New customer (no pets yet)
      // 2. Not authenticated (guest in customer mode)
      // 3. No existing pets for this customer
      // 4. Admin/walkin mode with no customer selected yet
      const shouldShowForm =
        isNewCustomer ||
        (!isAuthenticated && mode === 'customer') ||
        pets.length === 0 ||
        (mode !== 'customer' && !customerId);

      if (shouldShowForm) {
        setShowForm(true);
      }
    }
  }, [isAuthenticated, isNewCustomer, pets.length, isLoading, mode, customerId]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-[#434E54]/70 leading-relaxed">Tell us which furry family member we&apos;ll be pampering today</p>

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
        <p className="text-[#434E54]/70 leading-relaxed">Tell us which furry family member we&apos;ll be pampering today</p>

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
      </div>
    );
  }

  // Show form for guests, new customers, or when adding new pet
  if (showForm) {
    return (
      <div className="space-y-6">
        <p className="text-[#434E54]/70 leading-relaxed">
          {isAuthenticated
            ? 'Enter your pet\'s information so we can provide the best care'
            : 'We need some details about your furry friend to personalize their grooming experience'}
        </p>

        <div className="bg-white rounded-xl shadow-md p-6">
          <PetForm
            onSubmit={handleFormSubmit}
            onCancel={pets.length > 0 ? handleFormCancel : undefined}
            initialData={newPetData || undefined}
            selectedService={selectedService}
          />
        </div>
      </div>
    );
  }

  // Show pet selection for authenticated users
  return (
    <div className="space-y-6">
      <p className="text-[#6B7280] leading-relaxed">Tell us which furry family member we&apos;ll be pampering today</p>

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
    </div>
  );
}
