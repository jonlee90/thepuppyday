'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Search, XCircle } from 'lucide-react';
import type { Addon, Breed } from '@/types/database';

interface AddOnFormProps {
  addon?: Addon;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  price: number;
  upsell_breeds: string[];
  upsell_prompt: string;
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
}

export function AddOnForm({ addon, onClose, onSuccess }: AddOnFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: 0,
    upsell_breeds: [],
    upsell_prompt: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Breed selection
  const [allBreeds, setAllBreeds] = useState<Breed[]>([]);
  const [breedSearch, setBreedSearch] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);

  // Load breeds
  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        // In a real implementation, this would call an API
        // For now, we'll use a mock list
        const mockBreeds: Breed[] = [
          { id: '1', name: 'Golden Retriever', grooming_frequency_weeks: 6, reminder_message: '', created_at: '' },
          { id: '2', name: 'Labrador Retriever', grooming_frequency_weeks: 8, reminder_message: '', created_at: '' },
          { id: '3', name: 'Poodle', grooming_frequency_weeks: 6, reminder_message: '', created_at: '' },
          { id: '4', name: 'Shih Tzu', grooming_frequency_weeks: 4, reminder_message: '', created_at: '' },
          { id: '5', name: 'Yorkshire Terrier', grooming_frequency_weeks: 4, reminder_message: '', created_at: '' },
          { id: '6', name: 'Maltese', grooming_frequency_weeks: 4, reminder_message: '', created_at: '' },
          { id: '7', name: 'Cocker Spaniel', grooming_frequency_weeks: 6, reminder_message: '', created_at: '' },
          { id: '8', name: 'French Bulldog', grooming_frequency_weeks: 6, reminder_message: '', created_at: '' },
          { id: '9', name: 'German Shepherd', grooming_frequency_weeks: 8, reminder_message: '', created_at: '' },
          { id: '10', name: 'Beagle', grooming_frequency_weeks: 8, reminder_message: '', created_at: '' },
        ];
        setAllBreeds(mockBreeds);
      } catch (error) {
        console.error('Error fetching breeds:', error);
      }
    };

    fetchBreeds();
  }, []);

  // Load addon data if editing
  useEffect(() => {
    if (addon) {
      setFormData({
        name: addon.name,
        description: addon.description || '',
        price: addon.price,
        upsell_breeds: addon.upsell_breeds || [],
        upsell_prompt: addon.upsell_prompt || '',
        is_active: addon.is_active,
      });
    }
  }, [addon]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAddBreed = (breedName: string) => {
    if (!formData.upsell_breeds.includes(breedName)) {
      handleChange('upsell_breeds', [...formData.upsell_breeds, breedName]);
    }
    setBreedSearch('');
    setShowBreedDropdown(false);
  };

  const handleRemoveBreed = (breedName: string) => {
    handleChange(
      'upsell_breeds',
      formData.upsell_breeds.filter((b) => b !== breedName)
    );
  };

  const filteredBreeds = allBreeds.filter((breed) =>
    breed.name.toLowerCase().includes(breedSearch.toLowerCase())
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    // Description validation
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    // Price validation
    if (formData.price < 0) {
      newErrors.price = 'Price must be non-negative';
    }

    const priceStr = formData.price.toString();
    const decimalIndex = priceStr.indexOf('.');
    if (decimalIndex !== -1 && priceStr.length - decimalIndex - 1 > 2) {
      newErrors.price = 'Price must have at most 2 decimal places';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price,
        upsell_breeds: formData.upsell_breeds,
        upsell_prompt: formData.upsell_prompt.trim() || null,
        is_active: formData.is_active,
      };

      const url = addon ? `/api/admin/addons/${addon.id}` : '/api/admin/addons';
      const method = addon ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save add-on');
      }

      setIsDirty(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving add-on:', error);
      alert(error instanceof Error ? error.message : 'Failed to save add-on');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      const confirmed = confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-[#434E54]">
            {addon ? 'Edit Add-On' : 'Add New Add-On'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-[#434E54] mb-1.5">
              Add-On Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full py-2.5 px-4 rounded-lg border bg-white
                focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                placeholder:text-gray-400 transition-colors duration-200
                ${errors.name ? 'border-red-500' : 'border-gray-200'}
              `}
              placeholder="e.g., Teeth Brushing"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#434E54] mb-1.5">
              Description
              <span className="text-xs text-[#6B7280] ml-2">
                ({formData.description.length}/500)
              </span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full py-2.5 px-4 rounded-lg border bg-white
                focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                placeholder:text-gray-400 transition-colors duration-200 resize-none
                ${errors.description ? 'border-red-500' : 'border-gray-200'}
              `}
              placeholder="Describe what's included in this add-on"
              maxLength={500}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-[#434E54] mb-1.5">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  handleChange('price', parseFloat(e.target.value) || 0)
                }
                className={`w-full pl-8 pr-4 py-2.5 rounded-lg border bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                  transition-colors duration-200
                  ${errors.price ? 'border-red-500' : 'border-gray-200'}
                `}
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="text-sm text-red-600 mt-1">{errors.price}</p>
            )}
          </div>

          {/* Breed-Based Upsell */}
          <div>
            <label className="block text-sm font-semibold text-[#434E54] mb-1.5">
              Breed-Based Upsell (Optional)
            </label>
            <p className="text-xs text-[#6B7280] mb-3">
              Select breeds that should see this add-on as a recommendation
            </p>

            {/* Selected Breeds */}
            {formData.upsell_breeds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.upsell_breeds.map((breed) => (
                  <div
                    key={breed}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      bg-[#EAE0D5] text-sm font-medium text-[#434E54]"
                  >
                    {breed}
                    <button
                      type="button"
                      onClick={() => handleRemoveBreed(breed)}
                      className="hover:bg-[#DCD2C7] rounded-full p-0.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Breed Search */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="text"
                  value={breedSearch}
                  onChange={(e) => setBreedSearch(e.target.value)}
                  onFocus={() => setShowBreedDropdown(true)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                    placeholder:text-gray-400 transition-colors duration-200"
                  placeholder="Search breeds..."
                />
              </div>

              {/* Dropdown */}
              {showBreedDropdown && breedSearch && filteredBreeds.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200
                  rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredBreeds.map((breed) => (
                    <button
                      key={breed.id}
                      type="button"
                      onClick={() => handleAddBreed(breed.name)}
                      className="w-full text-left px-4 py-2 hover:bg-[#EAE0D5] transition-colors
                        text-sm text-[#434E54]"
                    >
                      {breed.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upsell Prompt */}
          <div>
            <label className="block text-sm font-semibold text-[#434E54] mb-1.5">
              Upsell Prompt (Optional)
            </label>
            <input
              type="text"
              value={formData.upsell_prompt}
              onChange={(e) => handleChange('upsell_prompt', e.target.value)}
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                placeholder:text-gray-400 transition-colors duration-200"
              placeholder="e.g., Recommended for long-haired breeds"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#434E54]
                focus:ring-[#434E54]/20"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-[#434E54]">
              Active (visible to customers)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-5 rounded-lg border border-[#434E54] bg-transparent
                text-[#434E54] font-medium hover:bg-[#434E54] hover:text-white
                transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-5 rounded-lg bg-[#434E54] text-white font-medium
                hover:bg-[#363F44] transition-colors duration-200 disabled:opacity-50
                disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{addon ? 'Update Add-On' : 'Create Add-On'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
