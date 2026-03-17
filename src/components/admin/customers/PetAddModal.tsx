/**
 * PetAddModal Component
 * Modal form for adding a new pet to a customer from the customer profile.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, PawPrint, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { createFocusTrap } from '@/lib/accessibility/focus';
import { getSizeShortLabel, getSizeLabel } from '@/lib/booking/pricing';
import { fetchBreedsOnce, getCachedBreeds } from '@/lib/cache/breedsCache';
import type { PetSize } from '@/types/database';
import type { PetWithBreed } from './PetCard';

interface Breed {
  id: string;
  name: string;
}

interface PetAddModalProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (pet: PetWithBreed) => void;
}

const PET_SIZES: PetSize[] = ['small', 'medium', 'large', 'xlarge'];
const PET_GENDERS = ['Male', 'Female'] as const;

export function PetAddModal({ customerId, isOpen, onClose, onSaved }: PetAddModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [breedMode, setBreedMode] = useState<'known' | 'custom'>('known');
  const [breedId, setBreedId] = useState('');
  const [breedCustom, setBreedCustom] = useState('');
  const [size, setSize] = useState<PetSize>('medium');
  const [gender, setGender] = useState('');
  const [color, setColor] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [notes, setNotes] = useState('');

  // Breed search state
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [breedSearch, setBreedSearch] = useState('');
  const [breedsLoading, setBreedsLoading] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setBreedMode('known');
      setBreedId('');
      setBreedCustom('');
      setSize('medium');
      setGender('');
      setColor('');
      setMedicalInfo('');
      setNotes('');
      setBreedSearch('');
      setError('');
    }
  }, [isOpen]);

  // Fetch breeds list
  useEffect(() => {
    if (!isOpen || breedMode !== 'known') return;
    const cached = getCachedBreeds();
    if (cached) { setBreeds(cached); return; }
    setBreedsLoading(true);
    fetchBreedsOnce()
      .then((data) => setBreeds(data))
      .catch(() => setBreeds([]))
      .finally(() => setBreedsLoading(false));
  }, [isOpen, breedMode]);

  // Focus trap + scroll lock
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const trap = createFocusTrap(panelRef.current);
    trap.activate();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      trap.deactivate();
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleBreedModeChange = (mode: 'known' | 'custom') => {
    setBreedMode(mode);
    if (mode === 'known') {
      setBreedCustom('');
    } else {
      setBreedId('');
      setBreedSearch('');
    }
  };

  const filteredBreeds = breedSearch.trim()
    ? breeds.filter((b) => b.name.toLowerCase().includes(breedSearch.toLowerCase()))
    : breeds;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Pet name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        size,
        gender: gender || null,
        color: color.trim() || null,
        medical_info: medicalInfo.trim() || null,
        notes: notes.trim() || null,
      };

      if (breedMode === 'known') {
        payload.breed_id = breedId || null;
        payload.breed_custom = null;
      } else {
        payload.breed_id = null;
        payload.breed_custom = breedCustom.trim() || null;
      }

      const response = await fetch(`/api/admin/customers/${customerId}/pets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add pet');

      toast.success('Pet added');
      onSaved(result.data as PetWithBreed);
    } catch (err) {
      console.error('[PetAddModal] save error:', err);
      toast.error('Failed to add pet');
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Add Pet"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-[#EAE0D5] rounded-t-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/60">
                  <PawPrint className="w-5 h-5 text-[#434E54]" />
                </div>
                <h2 className="text-lg font-semibold text-[#434E54]">Add Pet</h2>
              </div>
              <AdminButton
                variant="ghost"
                size="xs"
                onClick={handleClose}
                disabled={loading}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </AdminButton>
            </div>

            {/* Form body */}
            <form id="pet-add-form" onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="pet-add-name" className="block text-sm font-medium text-[#434E54] mb-1.5">
                  Name <span className="text-[#D4A574]">*</span>
                </label>
                <input
                  id="pet-add-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]
                             transition-colors"
                  placeholder="Pet name"
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>

              {/* Breed */}
              <div>
                <span className="block text-sm font-medium text-[#434E54] mb-2">Breed</span>
                <div className="flex gap-2 mb-3">
                  {(['known', 'custom'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleBreedModeChange(m)}
                      className={[
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        breedMode === m
                          ? 'bg-[#434E54] text-white'
                          : 'bg-[#EAE0D5] text-[#434E54] hover:bg-[#D4C4B4]',
                      ].join(' ')}
                      disabled={loading}
                    >
                      {m === 'known' ? 'Known breed' : 'Custom / mixed'}
                    </button>
                  ))}
                </div>

                {breedMode === 'known' ? (
                  <div>
                    <input
                      type="text"
                      value={breedSearch}
                      onChange={(e) => setBreedSearch(e.target.value)}
                      placeholder={breedsLoading ? 'Loading breeds...' : 'Search breed...'}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54]
                                 focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]
                                 transition-colors"
                      disabled={loading || breedsLoading}
                    />
                    {breedSearch.trim() && filteredBreeds.length > 0 && (
                      <div className="mt-1 border border-[#EAE0D5] rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                        {filteredBreeds.slice(0, 10).map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setBreedId(b.id);
                              setBreedSearch(b.name);
                            }}
                            className={[
                              'w-full text-left px-3 py-2 text-sm transition-colors',
                              breedId === b.id
                                ? 'bg-[#EAE0D5] text-[#434E54] font-medium'
                                : 'text-[#434E54] hover:bg-[#FFFBF7]',
                            ].join(' ')}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {breedId && (
                      <p className="mt-1 text-xs text-[#434E54]/60">
                        Selected: {breedSearch || breedId}
                      </p>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={breedCustom}
                    onChange={(e) => setBreedCustom(e.target.value)}
                    placeholder="e.g. Golden Doodle mix"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54]
                               focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]
                               transition-colors"
                    disabled={loading}
                  />
                )}
              </div>

              {/* Size */}
              <div>
                <span className="block text-sm font-medium text-[#434E54] mb-2">
                  Size <span className="text-[#D4A574]">*</span>
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PET_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={[
                        'py-2.5 rounded-lg text-sm font-medium transition-colors text-center leading-tight',
                        size === s
                          ? 'bg-[#434E54] text-white'
                          : 'bg-[#EAE0D5] text-[#434E54] hover:bg-[#D4C4B4]',
                      ].join(' ')}
                      disabled={loading}
                    >
                      <span className="block">{getSizeShortLabel(s)}</span>
                      <span className="block text-xs font-normal opacity-70">
                        {getSizeLabel(s).match(/\(([^)]+)\)/)?.[1] ?? ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <span className="block text-sm font-medium text-[#434E54] mb-2">Gender</span>
                <div className="flex gap-2">
                  {PET_GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(gender === g.toLowerCase() ? '' : g.toLowerCase())}
                      className={[
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        gender === g.toLowerCase()
                          ? 'bg-[#434E54] text-white'
                          : 'bg-[#EAE0D5] text-[#434E54] hover:bg-[#D4C4B4]',
                      ].join(' ')}
                      disabled={loading}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label htmlFor="pet-add-color" className="block text-sm font-medium text-[#434E54] mb-1.5">
                  Color
                </label>
                <input
                  id="pet-add-color"
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Golden, Black & White"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]
                             transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Medical Info */}
              <div>
                <label htmlFor="pet-add-medical" className="block text-sm font-medium text-[#434E54] mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                  Medical Info
                </label>
                <textarea
                  id="pet-add-medical"
                  value={medicalInfo}
                  onChange={(e) => setMedicalInfo(e.target.value)}
                  rows={3}
                  placeholder="Allergies, medications, health conditions..."
                  className="w-full px-3 py-2.5 rounded-lg border border-amber-300 bg-amber-50/50 text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400
                             transition-colors resize-none placeholder:text-amber-400/70"
                  disabled={loading}
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="pet-add-notes" className="block text-sm font-medium text-[#434E54] mb-1.5">
                  Notes
                </label>
                <textarea
                  id="pet-add-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Grooming preferences, behavior notes..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[#434E54]/20 bg-white text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]
                             transition-colors resize-none"
                  disabled={loading}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="bg-[#EAE0D5]/30 rounded-b-2xl px-5 py-4 flex items-center justify-end gap-3">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                type="submit"
                form="pet-add-form"
                isLoading={loading}
                loadingText="Adding..."
                disabled={loading || !name.trim()}
              >
                Add Pet
              </AdminButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
