/**
 * Add-ons selection step for booking wizard
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/stores/bookingStore';
import { AddonCard } from '../AddonCard';
import { useAddons } from '@/hooks/useAddons';
import { formatCurrency } from '@/lib/booking/pricing';
import type { Addon } from '@/types/database';

export function AddonsStep() {
  const { addons, isLoading, error, getUpsellAddons } = useAddons();

  const {
    selectedPet,
    selectedAddonIds,
    selectedAddons,
    toggleAddon,
    nextStep,
    prevStep,
  } = useBookingStore();

  // Get pet breed for upsell matching
  const petBreedId = selectedPet?.breed_id || null;

  // Separate upsell add-ons (matching pet's breed)
  const upsellAddons = getUpsellAddons(petBreedId);

  const regularAddons = addons.filter((addon) => {
    if (!petBreedId) return true;
    return !upsellAddons.some((upsell) => upsell.id === addon.id);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Add Extra Services</h2>
          <p className="text-[#434E54]/70">Enhance your pet&apos;s grooming experience</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded bg-[#EAE0D5]" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-[#EAE0D5] rounded w-1/3" />
                  <div className="h-4 bg-[#EAE0D5] rounded w-2/3" />
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
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Add Extra Services</h2>
          <p className="text-[#434E54]/70">Enhance your pet&apos;s grooming experience</p>
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
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">Failed to Load Add-ons</h3>
          <p className="text-[#434E54]/70 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
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
          <button
            onClick={handleContinue}
            className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg
                     hover:bg-[#434E54]/90 transition-all duration-200 shadow-md hover:shadow-lg
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

  if (addons.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54] mb-2">Add Extra Services</h2>
          <p className="text-[#434E54]/70">Enhance your pet&apos;s grooming experience</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#434E54]/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <p className="text-[#434E54]/70">No additional services available at this time</p>
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
            className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg
                     hover:bg-[#434E54]/90 transition-all duration-200 shadow-md hover:shadow-lg
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

  return (
    <div className="space-y-6">
      {/* Header with dog theme */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute -bottom-2 left-1/2 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Add Extra Services</h2>
        </div>
        <p className="text-[#434E54]/70 leading-relaxed">Give your pup the ultimate spa experience with these add-ons</p>
      </div>

      {/* Selected add-ons summary with animation */}
      <AnimatePresence>
        {selectedAddons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#434E54]/10 border border-[#434E54]/30 rounded-lg p-4 overflow-hidden"
          >
            <p className="text-sm text-[#434E54] font-medium mb-2">
              {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected
            </p>
            <div className="space-y-1.5">
              {selectedAddons.map((addon) => (
                <motion.div
                  key={addon.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex justify-between text-sm"
                >
                  <span className="text-[#434E54]">{addon.name}</span>
                  <span className="text-[#434E54] font-semibold">+{formatCurrency(addon.price)}</span>
                </motion.div>
              ))}
              <div className="border-t border-[#434E54]/20 pt-2 mt-2">
                <motion.div
                  key={selectedAddons.reduce((sum, addon) => sum + addon.price, 0)}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="flex justify-between font-semibold"
                >
                  <span className="text-[#434E54]">Add-ons Total</span>
                  <span className="text-[#434E54] text-lg">
                    +{formatCurrency(selectedAddons.reduce((sum, addon) => sum + addon.price, 0))}
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upsell add-ons */}
      {upsellAddons.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#434E54] flex items-center gap-2 bg-[#434E54]/5 px-3 py-2 rounded-lg">
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
            <h3 className="text-sm font-medium text-[#434E54]/60">Other add-ons</h3>
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

        <div className="flex gap-3">
          {selectedAddons.length === 0 && (
            <button
              onClick={handleSkip}
              className="text-[#434E54] font-medium py-2.5 px-5 rounded-lg
                       hover:bg-[#EAE0D5] transition-colors duration-200"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleContinue}
            className="bg-[#434E54] text-white font-semibold py-3 px-8 rounded-lg
                     hover:bg-[#434E54]/90 transition-all duration-200 shadow-md hover:shadow-lg
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
    </div>
  );
}
