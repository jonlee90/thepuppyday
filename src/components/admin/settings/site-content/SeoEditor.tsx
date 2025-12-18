/**
 * SeoEditor Component
 * Task 0162: Edit SEO meta tags and Open Graph settings
 *
 * Features:
 * - Page title and meta description
 * - Open Graph settings
 * - Character counters with color coding
 * - Real-time preview integration
 * - Clean & Elegant Professional design
 */

'use client';

import { Globe, FileText, Image as ImageIcon, Share2 } from 'lucide-react';
import type { SeoSettings } from '@/types/settings';
import { SeoPreview } from './SeoPreview';

interface SeoEditorProps {
  value: SeoSettings;
  onChange: (value: Partial<SeoSettings>) => void;
  disabled?: boolean;
}

/**
 * Character counter badge with color coding
 */
function CharacterCounter({
  current,
  max,
  warningThreshold = 0.85,
  dangerThreshold = 0.95,
}: {
  current: number;
  max: number;
  warningThreshold?: number;
  dangerThreshold?: number;
}) {
  const ratio = current / max;
  const color =
    ratio >= dangerThreshold
      ? 'badge-error'
      : ratio >= warningThreshold
      ? 'badge-warning'
      : 'badge-success';

  return (
    <span className={`badge badge-sm ${color}`}>
      {current}/{max}
    </span>
  );
}

export function SeoEditor({ value, onChange, disabled = false }: SeoEditorProps) {
  /**
   * Update page title
   */
  const handlePageTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value.slice(0, 60); // Enforce max length
    onChange({ page_title: newTitle });
  };

  /**
   * Update meta description
   */
  const handleMetaDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value.slice(0, 160); // Enforce max length
    onChange({ meta_description: newDescription });
  };

  /**
   * Update OG title
   */
  const handleOgTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value.slice(0, 60); // Enforce max length
    onChange({ og_title: newTitle });
  };

  /**
   * Update OG description
   */
  const handleOgDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value.slice(0, 160); // Enforce max length
    onChange({ og_description: newDescription });
  };

  /**
   * Update OG image URL
   */
  const handleOgImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    onChange({ og_image_url: url || null });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Editor */}
      <div className="space-y-6">
        {/* Basic SEO Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2">
              <Globe className="w-5 h-5" />
              SEO Settings
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Optimize how your site appears in search results
            </p>
          </div>

          {/* Page Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#434E54]">
                Page Title
              </label>
              <CharacterCounter
                current={value.page_title.length}
                max={60}
                warningThreshold={0.83}
                dangerThreshold={0.95}
              />
            </div>
            <input
              type="text"
              value={value.page_title}
              onChange={handlePageTitleChange}
              disabled={disabled}
              maxLength={60}
              placeholder="e.g., Dog Grooming La Mirada | The Puppy Day"
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-[#6B7280]">
              Appears in browser tabs and search results (max 60 chars)
            </p>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#434E54]">
                Meta Description
              </label>
              <CharacterCounter
                current={value.meta_description.length}
                max={160}
                warningThreshold={0.875}
                dangerThreshold={0.9875}
              />
            </div>
            <textarea
              value={value.meta_description}
              onChange={handleMetaDescriptionChange}
              disabled={disabled}
              maxLength={160}
              rows={3}
              placeholder="e.g., Professional dog grooming services in La Mirada. Expert care for all breeds and sizes. Book your appointment today!"
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200 resize-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-[#6B7280]">
              Brief description for search results (max 160 chars)
            </p>
          </div>
        </div>

        {/* Open Graph Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Open Graph (Social Sharing)
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              How your site appears when shared on social media
            </p>
          </div>

          {/* OG Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#434E54]">
                OG Title
              </label>
              <CharacterCounter
                current={value.og_title.length}
                max={60}
                warningThreshold={0.83}
                dangerThreshold={0.95}
              />
            </div>
            <input
              type="text"
              value={value.og_title}
              onChange={handleOgTitleChange}
              disabled={disabled}
              maxLength={60}
              placeholder="Usually same as page title"
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-[#6B7280]">
              Title shown on social media cards (max 60 chars)
            </p>
          </div>

          {/* OG Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#434E54]">
                OG Description
              </label>
              <CharacterCounter
                current={value.og_description.length}
                max={160}
                warningThreshold={0.875}
                dangerThreshold={0.9875}
              />
            </div>
            <textarea
              value={value.og_description}
              onChange={handleOgDescriptionChange}
              disabled={disabled}
              maxLength={160}
              rows={3}
              placeholder="Usually same as meta description"
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200 resize-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-[#6B7280]">
              Description shown on social media cards (max 160 chars)
            </p>
          </div>

          {/* OG Image URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#434E54] flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              OG Image URL
            </label>
            <input
              type="url"
              value={value.og_image_url || ''}
              onChange={handleOgImageUrlChange}
              disabled={disabled}
              placeholder="https://..."
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-[#6B7280]">
              Recommended: 1200x630px image for social media sharing
            </p>

            {/* Image Preview */}
            {value.og_image_url && (
              <div className="mt-2 aspect-[1.91/1] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={value.og_image_url}
                  alt="OG Image Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-red-50 text-red-600">
                          <div class="text-center p-4">
                            <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p class="text-sm">Failed to load image</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Preview (Sticky) */}
      <div className="lg:sticky lg:top-6 h-fit">
        <SeoPreview seoData={value} />
      </div>
    </div>
  );
}
