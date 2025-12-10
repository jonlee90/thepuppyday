/**
 * Add-ons selection step for booking wizard
 */

'use client';

import { useEffect, useState } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { AddonCard } from '../AddonCard';
import { getMockStore } from '@/mocks/supabase/store';
import type { Addon } from '@/types/database';

export function AddonsStep() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    selectedPet,
    newPetData,
    selectedAddonIds,
    selectedAddons,
    toggleAddon,
    nextStep,
    prevStep,
  } = useBookingStore();

  // Get pet breed for upsell matching
  const petBreedId = selectedPet?.breed_id || null;

  // Load add-ons
  useEffect(() => {
    const loadAddons = () => {
      const store = getMockStore();
      const addonsData = store.select('addons', {
        column: 'is_active',
        value: true,
        order: { column: 'display_order', ascending: true },
      }) as unknown as Addon[];
      setAddons(addonsData);
      setLoading(false);
    };

    loadAddons();
  }, []);

  // Separate upsell add-ons (matching pet's breed)
  const upsellAddons = addons.filter((addon) => {
    if (!petBreedId) return false;
    return addon.upsell_breeds.includes(petBreedId);
  });

  const regularAddons = addons.filter((addon) => {
    if (!petBreedId) return true;
    return !addon.upsell_breeds.includes(petBreedId);
  });

  const handleToggle = (addon: Addon) => {
    toggleAddon(addon);
  };

  const handleContinue = () => {
    nextStep();
  };

  const handleSkip = () => {
    // Clear any selected add-ons and continue
    nextStep();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Add Extra Services</h2>
          <p className="text-base-content/70">Enhance your pet&apos;s grooming experience</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-base-100 rounded-xl border border-base-300 p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded bg-base-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-base-300 rounded w-1/3" />
                  <div className="h-4 bg-base-300 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (addons.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Add Extra Services</h2>
          <p className="text-base-content/70">Enhance your pet&apos;s grooming experience</p>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 p-8 text-center">
          <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <p className="text-base-content/70">No additional services available at this time</p>
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
          <button onClick={handleContinue} className="btn btn-primary btn-lg">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-base-content mb-2">Add Extra Services</h2>
        <p className="text-base-content/70">Enhance your pet&apos;s grooming experience</p>
      </div>

      {/* Selected count */}
      {selectedAddons.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <p className="text-sm text-primary font-medium">
            {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Upsell add-ons */}
      {upsellAddons.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-warning flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            Recommended for your pet
          </h3>
          <div className="space-y-3">
            {upsellAddons.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                isSelected={selectedAddonIds.includes(addon.id)}
                isUpsell
                onToggle={() => handleToggle(addon)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular add-ons */}
      {regularAddons.length > 0 && (
        <div className="space-y-3">
          {upsellAddons.length > 0 && (
            <h3 className="text-sm font-medium text-base-content/70">Other add-ons</h3>
          )}
          <div className="space-y-3">
            {regularAddons.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                isSelected={selectedAddonIds.includes(addon.id)}
                onToggle={() => handleToggle(addon)}
              />
            ))}
          </div>
        </div>
      )}

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

        <div className="flex gap-3">
          {selectedAddons.length === 0 && (
            <button onClick={handleSkip} className="btn btn-ghost">
              Skip
            </button>
          )}
          <button onClick={handleContinue} className="btn btn-primary btn-lg">
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
    </div>
  );
}
