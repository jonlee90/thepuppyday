/**
 * Banner editor modal for create/edit with scheduling
 * Tasks 0175-0176: Banner editor and scheduling
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PromoBanner } from '@/types/database';
import { cn } from '@/lib/utils';
import { BannerImageUpload } from './BannerImageUpload';
import { utcToLocalDateTime, localDateTimeToUTC, formatDateTime } from '@/lib/utils/banner-helpers';

interface BannerEditorProps {
  bannerId: string | null; // null = create mode, string = edit mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  image_url: string;
  alt_text: string;
  click_url: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  image_url?: string;
  alt_text?: string;
  click_url?: string;
  start_date?: string;
  end_date?: string;
}

export function BannerEditor({ bannerId, isOpen, onClose, onSuccess }: BannerEditorProps) {
  const isEditMode = bannerId !== null && bannerId !== 'new';

  const [formData, setFormData] = useState<FormData>({
    image_url: '',
    alt_text: '',
    click_url: '',
    is_active: false,
    start_date: '',
    end_date: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  // Fetch banner data in edit mode
  useEffect(() => {
    if (isOpen && isEditMode) {
      fetchBanner();
    } else if (isOpen && !isEditMode) {
      // Reset form for create mode
      setFormData({
        image_url: '',
        alt_text: '',
        click_url: '',
        is_active: false,
        start_date: '',
        end_date: ''
      });
      setErrors({});
      setHasUnsavedChanges(false);
    }
  }, [isOpen, bannerId]);

  const fetchBanner = async () => {
    if (!bannerId || bannerId === 'new') return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/settings/banners/${bannerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch banner');
      }

      const banner: PromoBanner = data.banner;
      setFormData({
        image_url: banner.image_url,
        alt_text: banner.alt_text || '',
        click_url: banner.click_url || '',
        is_active: banner.is_active,
        start_date: banner.start_date ? utcToLocalDateTime(banner.start_date) : '',
        end_date: banner.end_date ? utcToLocalDateTime(banner.end_date) : ''
      });
    } catch (err) {
      console.error('Error fetching banner:', err);
      alert('Failed to load banner. Please try again.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Image URL required
    if (!formData.image_url) {
      newErrors.image_url = 'Banner image is required';
    }

    // Alt text required
    if (!formData.alt_text.trim()) {
      newErrors.alt_text = 'Alt text is required';
    } else if (formData.alt_text.length > 200) {
      newErrors.alt_text = 'Alt text must be 200 characters or less';
    }

    // Click URL optional but must be valid if provided
    if (formData.click_url && !isValidUrl(formData.click_url)) {
      newErrors.click_url = 'Please enter a valid URL';
    }

    // Date validation
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = isEditMode
        ? `/api/admin/settings/banners/${bannerId}`
        : '/api/admin/settings/banners';

      const method = isEditMode ? 'PATCH' : 'POST';

      // Prepare payload
      const payload = {
        image_url: formData.image_url,
        alt_text: formData.alt_text,
        click_url: formData.click_url || null,
        start_date: localDateTimeToUTC(formData.start_date),
        end_date: localDateTimeToUTC(formData.end_date),
        is_active: formData.is_active
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save banner');
      }

      setHasUnsavedChanges(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving banner:', err);
      alert(err instanceof Error ? err.message : 'Failed to save banner. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  const handleImageUploaded = (imageUrl: string) => {
    handleInputChange('image_url', imageUrl);
    setShowImageUpload(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#434E54]/10">
          <h2 className="text-xl font-semibold text-[#434E54]">
            {isEditMode ? 'Edit Banner' : 'Create New Banner'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#434E54] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-[#434E54] mb-2">
                  Banner Image <span className="text-red-500">*</span>
                </label>

                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-[#434E54]/10"
                    />
                    <button
                      onClick={() => setShowImageUpload(true)}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-[#434E54] hover:bg-white transition-colors shadow-md"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="w-full border-2 border-dashed border-[#434E54]/30 rounded-lg p-8 hover:border-[#434E54]/50 transition-colors"
                  >
                    <Upload className="w-12 h-12 mx-auto mb-3 text-[#434E54]/40" />
                    <p className="text-sm font-medium text-[#434E54]">Click to upload image</p>
                    <p className="text-xs text-[#6B7280] mt-1">JPEG, PNG, WebP, GIF (max 2MB)</p>
                  </button>
                )}

                {errors.image_url && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.image_url}
                  </p>
                )}
              </div>

              {/* Alt Text */}
              <div>
                <label htmlFor="alt-text" className="block text-sm font-semibold text-[#434E54] mb-2">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  id="alt-text"
                  type="text"
                  value={formData.alt_text}
                  onChange={(e) => handleInputChange('alt_text', e.target.value)}
                  className={cn(
                    "input input-bordered w-full",
                    errors.alt_text && "input-error"
                  )}
                  placeholder="Describe the banner for accessibility"
                  maxLength={200}
                />
                <div className="flex items-center justify-between mt-1">
                  <div>
                    {errors.alt_text && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.alt_text}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {formData.alt_text.length}/200
                  </p>
                </div>
              </div>

              {/* Click URL */}
              <div>
                <label htmlFor="click-url" className="block text-sm font-semibold text-[#434E54] mb-2">
                  Click URL (Optional)
                </label>
                <input
                  id="click-url"
                  type="url"
                  value={formData.click_url}
                  onChange={(e) => handleInputChange('click_url', e.target.value)}
                  className={cn(
                    "input input-bordered w-full",
                    errors.click_url && "input-error"
                  )}
                  placeholder="https://example.com/promotion"
                />
                {errors.click_url && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.click_url}
                  </p>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#EAE0D5]/30 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-[#434E54]">Banner Active</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Enable to show banner on site (respects scheduling dates)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="toggle toggle-success"
                />
              </div>

              {/* Scheduling Section */}
              <div className="space-y-4 p-4 bg-[#F8EEE5] rounded-lg border border-[#434E54]/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#434E54]">Schedule (Optional)</h3>
                  <span className="text-xs text-[#6B7280]">Pacific Time (PT)</span>
                </div>

                <p className="text-xs text-[#6B7280]">
                  Leave dates empty for immediate activation (when banner is active) or indefinite duration.
                </p>

                {/* Start Date */}
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-[#434E54] mb-2">
                    Start Date & Time
                  </label>
                  <input
                    id="start-date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={cn(
                      "input input-bordered w-full",
                      errors.start_date && "input-error"
                    )}
                  />
                  {errors.start_date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.start_date}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-[#434E54] mb-2">
                    End Date & Time
                  </label>
                  <input
                    id="end-date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={cn(
                      "input input-bordered w-full",
                      errors.end_date && "input-error"
                    )}
                  />
                  {errors.end_date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.end_date}
                    </p>
                  )}
                </div>

                {/* Scheduling Status Preview */}
                <SchedulingStatusPreview
                  isActive={formData.is_active}
                  startDate={formData.start_date}
                  endDate={formData.end_date}
                />
              </div>

              {/* Preview Section */}
              <div className="bg-[#F8EEE5] rounded-lg p-4 border border-[#434E54]/10">
                <p className="text-xs font-semibold text-[#434E54] mb-2">Preview</p>
                {formData.image_url ? (
                  <div className="bg-white rounded-lg overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt={formData.alt_text || 'Banner preview'}
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-sm text-[#6B7280] italic">Upload an image to see preview</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#434E54]/10">
          <button
            onClick={handleClose}
            className="btn btn-ghost"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="btn btn-primary"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {isEditMode ? 'Update Banner' : 'Create Banner'}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Image Upload Modal */}
      <AnimatePresence>
        {showImageUpload && (
          <BannerImageUpload
            isOpen={showImageUpload}
            onClose={() => setShowImageUpload(false)}
            onSuccess={handleImageUploaded}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Scheduling Status Preview Component
interface SchedulingStatusPreviewProps {
  isActive: boolean;
  startDate: string;
  endDate: string;
}

function SchedulingStatusPreview({ isActive, startDate, endDate }: SchedulingStatusPreviewProps) {
  const { statusText, statusColor, statusBadge } = getSchedulingStatus(isActive, startDate, endDate);

  return (
    <div className={cn(
      "p-3 rounded-lg border",
      statusColor === 'green' && "bg-green-50 border-green-200",
      statusColor === 'blue' && "bg-blue-50 border-blue-200",
      statusColor === 'gray' && "bg-gray-50 border-gray-200",
      statusColor === 'red' && "bg-red-50 border-red-200"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#434E54]">Scheduling Status</span>
        <span className={cn(
          "badge badge-sm",
          statusColor === 'green' && "badge-success",
          statusColor === 'blue' && "badge-info",
          statusColor === 'gray' && "badge-ghost",
          statusColor === 'red' && "badge-error"
        )}>
          {statusBadge}
        </span>
      </div>
      <p className="text-xs text-[#434E54]/70">{statusText}</p>
    </div>
  );
}

function getSchedulingStatus(
  isActive: boolean,
  startDate: string,
  endDate: string
): { statusText: string; statusColor: string; statusBadge: string } {
  const now = new Date();

  // Draft: not active and no dates
  if (!isActive && !startDate && !endDate) {
    return {
      statusText: 'This banner is saved as a draft and will not be shown on the site.',
      statusColor: 'gray',
      statusBadge: 'Draft'
    };
  }

  // Check expiration
  if (endDate) {
    const end = new Date(endDate);
    if (now > end) {
      return {
        statusText: `This banner expired on ${formatDateTime(end)} and will not be shown.`,
        statusColor: 'red',
        statusBadge: 'Expired'
      };
    }
  }

  // Check scheduled
  if (startDate) {
    const start = new Date(startDate);
    if (now < start) {
      return {
        statusText: `This banner is scheduled to go live on ${formatDateTime(start)}.`,
        statusColor: 'blue',
        statusBadge: 'Scheduled'
      };
    }
  }

  // Active
  if (isActive) {
    if (startDate && endDate) {
      return {
        statusText: `This banner is active from ${formatDateTime(new Date(startDate))} to ${formatDateTime(new Date(endDate))}.`,
        statusColor: 'green',
        statusBadge: 'Active'
      };
    } else if (startDate) {
      return {
        statusText: `This banner has been active since ${formatDateTime(new Date(startDate))} with no end date.`,
        statusColor: 'green',
        statusBadge: 'Active'
      };
    } else if (endDate) {
      return {
        statusText: `This banner is active and will expire on ${formatDateTime(new Date(endDate))}.`,
        statusColor: 'green',
        statusBadge: 'Active'
      };
    } else {
      return {
        statusText: 'This banner is active with no scheduling restrictions.',
        statusColor: 'green',
        statusBadge: 'Active'
      };
    }
  }

  // Inactive
  return {
    statusText: 'This banner is inactive and will not be shown on the site.',
    statusColor: 'gray',
    statusBadge: 'Inactive'
  };
}

// URL validation helper
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
