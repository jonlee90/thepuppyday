'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { SizeBasedPricingInputs } from './SizeBasedPricingInputs';
import type { Service, ServicePrice, PetSize } from '@/types/database';

interface ServiceWithPrices extends Service {
  prices: ServicePrice[];
}

interface ServiceFormProps {
  service?: ServiceWithPrices;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  duration_minutes: number;
  image_url: string;
  is_active: boolean;
  prices: Record<PetSize, number>;
}

interface FormErrors {
  name?: string;
  description?: string;
  duration_minutes?: string;
  prices?: Partial<Record<PetSize, string>>;
}

export function ServiceForm({ service, onClose, onSuccess }: ServiceFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    duration_minutes: 60,
    image_url: '',
    is_active: true,
    prices: { small: 0, medium: 0, large: 0, xlarge: 0 },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load service data if editing
  useEffect(() => {
    if (service) {
      const pricesMap: Record<PetSize, number> = {
        small: 0,
        medium: 0,
        large: 0,
        xlarge: 0,
      };

      service.prices.forEach((price) => {
        pricesMap[price.size] = price.price;
      });

      setFormData({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        image_url: service.image_url || '',
        is_active: service.is_active,
        prices: pricesMap,
      });

      if (service.image_url) {
        setImagePreview(service.image_url);
      }
    }
  }, [service]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setUploadError('');
    setImageFile(file);
    setIsDirty(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    try {
      // In mock mode, simulate upload by using local preview URL
      // In production, this would upload to Supabase Storage
      const mockImageUrl = `/uploads/service-${Date.now()}.${imageFile.name.split('.').pop()}`;
      return mockImageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
      return null;
    }
  };

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

    // Duration validation
    if (formData.duration_minutes < 15 || formData.duration_minutes > 480) {
      newErrors.duration_minutes = 'Duration must be between 15 and 480 minutes';
    }

    // Prices validation
    const priceErrors: Partial<Record<PetSize, string>> = {};
    const sizes: PetSize[] = ['small', 'medium', 'large', 'xlarge'];
    sizes.forEach((size) => {
      const price = formData.prices[size];
      if (price < 0) {
        priceErrors[size] = 'Price must be non-negative';
      }
    });

    if (Object.keys(priceErrors).length > 0) {
      newErrors.prices = priceErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Upload image if new file selected
      const imageUrl = await uploadImage();
      if (imageFile && !imageUrl) {
        // Upload failed
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        duration_minutes: formData.duration_minutes,
        image_url: imageUrl,
        is_active: formData.is_active,
        prices: formData.prices,
      };

      const url = service
        ? `/api/admin/services/${service.id}`
        : '/api/admin/services';
      const method = service ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save service');
      }

      setIsDirty(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      alert(error instanceof Error ? error.message : 'Failed to save service');
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
            {service ? 'Edit Service' : 'Add New Service'}
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
              Service Name <span className="text-red-500">*</span>
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
              placeholder="e.g., Basic Groom"
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
              placeholder="Describe what's included in this service"
              maxLength={500}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-[#434E54] mb-1.5">
              Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              value={formData.duration_minutes}
              onChange={(e) =>
                handleChange('duration_minutes', parseInt(e.target.value))
              }
              className={`w-full py-2.5 px-4 rounded-lg border bg-white
                focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                transition-colors duration-200
                ${errors.duration_minutes ? 'border-red-500' : 'border-gray-200'}
              `}
            />
            {errors.duration_minutes && (
              <p className="text-sm text-red-600 mt-1">
                {errors.duration_minutes}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#434E54] mb-1.5">
              Service Image
            </label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="Service preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                  hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2
                  text-sm font-medium text-[#434E54]"
              >
                <Upload className="w-4 h-4" />
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </button>
              <p className="text-xs text-[#6B7280]">
                JPEG, PNG, or WebP. Max 5MB.
              </p>
              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Size-Based Pricing */}
          <SizeBasedPricingInputs
            prices={formData.prices}
            onChange={(prices) => handleChange('prices', prices)}
            errors={errors.prices}
          />

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
                <>{service ? 'Update Service' : 'Create Service'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
