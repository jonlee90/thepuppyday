/**
 * SeoPreview Component
 * Task 0163: Real-time visual preview of SEO and Open Graph appearance
 *
 * Features:
 * - Google search result preview
 * - Facebook/Open Graph card preview
 * - Real-time updates
 * - Realistic platform styling
 * - Clean & Elegant Professional design
 */

'use client';

import { Search, Facebook } from 'lucide-react';
import type { SeoSettings } from '@/types/settings';

interface SeoPreviewProps {
  seoData: SeoSettings;
  siteName?: string;
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function SeoPreview({ seoData, siteName = 'The Puppy Day' }: SeoPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[#434E54]">Preview</h3>
        <p className="text-sm text-[#6B7280] mt-1">
          How your site will appear in search results and social media
        </p>
      </div>

      {/* Google Search Result Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <Search className="w-4 h-4" />
          <span className="font-medium">Google Search Result</span>
        </div>

        <div className="space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span className="font-normal">thepuppyday.com</span>
            <span>›</span>
          </div>

          {/* Title (blue, underlined on hover, max 60 chars) */}
          <h3 className="text-xl text-blue-800 hover:underline cursor-pointer line-clamp-1">
            {truncate(seoData.page_title || 'Page Title', 60)}
          </h3>

          {/* Description (gray, max 160 chars) */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
            {truncate(
              seoData.meta_description || 'Meta description will appear here...',
              160
            )}
          </p>
        </div>
      </div>

      {/* Open Graph Card Preview (Facebook/Social Media) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <Facebook className="w-4 h-4" />
          <span className="font-medium">Facebook / Social Media</span>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* OG Image (if provided) */}
          {seoData.og_image_url && (
            <div className="aspect-[1.91/1] bg-gray-100 relative">
              <img
                src={seoData.og_image_url}
                alt="OG Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Show placeholder on error
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-[#EAE0D5]">
                        <svg class="w-16 h-16 text-[#434E54]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          )}

          {/* OG Text Content */}
          <div className="p-3 bg-[#F2F3F5] space-y-1">
            {/* Site name (uppercase, small, gray) */}
            <p className="text-xs uppercase text-gray-500 tracking-wide font-medium">
              {siteName.toUpperCase()}
            </p>

            {/* OG Title (bold, dark) */}
            <h4 className="font-semibold text-[#434E54] text-sm line-clamp-1">
              {truncate(seoData.og_title || seoData.page_title || 'OG Title', 60)}
            </h4>

            {/* OG Description (gray, smaller) */}
            <p className="text-xs text-gray-600 line-clamp-2">
              {truncate(
                seoData.og_description ||
                  seoData.meta_description ||
                  'OG description will appear here...',
                160
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-[#FFFBF7] rounded-lg border border-[#434E54]/10 p-4">
        <h4 className="text-sm font-semibold text-[#434E54] mb-2">SEO Tips</h4>
        <ul className="text-xs text-[#6B7280] space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Keep page title under 60 characters for best display</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Meta description should be 150-160 characters</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Use descriptive, keyword-rich content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>OG image should be 1200x630px for optimal display</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
