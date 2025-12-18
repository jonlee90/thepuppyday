/**
 * HeroEditor Component
 * Task 0160: Edit hero section headline, subheadline, and CTA buttons
 *
 * Features:
 * - Headline/subheadline with character counters
 * - CTA button management (up to 2 buttons)
 * - URL validation
 * - Clean & Elegant Professional design
 */

'use client';

import { Type, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import type { HeroContent, CtaButton } from '@/types/settings';

interface HeroEditorProps {
  value: HeroContent;
  onChange: (value: Partial<HeroContent>) => void;
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

/**
 * Validate URL (allow full URLs or relative paths)
 */
function isValidUrl(url: string): boolean {
  // Allow relative paths
  if (url.startsWith('/')) {
    return !url.includes('..') && !url.toLowerCase().includes('javascript:');
  }

  // Validate full URLs
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function HeroEditor({ value, onChange, disabled = false }: HeroEditorProps) {
  /**
   * Update headline
   */
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeadline = e.target.value.slice(0, 100); // Enforce max length
    onChange({ headline: newHeadline });
  };

  /**
   * Update subheadline
   */
  const handleSubheadlineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSubheadline = e.target.value.slice(0, 200); // Enforce max length
    onChange({ subheadline: newSubheadline });
  };

  /**
   * Update CTA button
   */
  const handleCtaChange = (index: number, updates: Partial<CtaButton>) => {
    const newButtons = [...value.cta_buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    onChange({ cta_buttons: newButtons });
  };

  /**
   * Add new CTA button
   */
  const handleAddCta = () => {
    if (value.cta_buttons.length >= 2) return; // Max 2 buttons

    const newButton: CtaButton = {
      text: '',
      url: '',
      style: 'primary',
    };

    onChange({ cta_buttons: [...value.cta_buttons, newButton] });
  };

  /**
   * Remove CTA button
   */
  const handleRemoveCta = (index: number) => {
    const newButtons = value.cta_buttons.filter((_, i) => i !== index);
    onChange({ cta_buttons: newButtons });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2">
          <Type className="w-5 h-5" />
          Hero Section Content
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Main headline and call-to-action for the homepage
        </p>
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-[#434E54]">
            Hero Headline
          </label>
          <CharacterCounter current={value.headline.length} max={100} />
        </div>
        <input
          type="text"
          value={value.headline}
          onChange={handleHeadlineChange}
          disabled={disabled}
          maxLength={100}
          placeholder="e.g., Professional Dog Grooming in La Mirada"
          className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                   placeholder:text-gray-400 transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-[#6B7280]">
          Main headline for the homepage hero section
        </p>
      </div>

      {/* Subheadline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-[#434E54]">
            Hero Subheadline
          </label>
          <CharacterCounter current={value.subheadline.length} max={200} warningThreshold={0.8} dangerThreshold={0.95} />
        </div>
        <textarea
          value={value.subheadline}
          onChange={handleSubheadlineChange}
          disabled={disabled}
          maxLength={200}
          rows={3}
          placeholder="e.g., Expert grooming services for dogs of all sizes. Book your appointment today!"
          className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                   placeholder:text-gray-400 transition-colors duration-200 resize-none
                   disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-[#6B7280]">
          Supporting text below the headline
        </p>
      </div>

      {/* CTA Buttons Section */}
      <div className="space-y-4 pt-4 border-t border-[#434E54]/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#434E54]">Call-to-Action Buttons</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Add up to 2 CTA buttons</p>
          </div>
          {value.cta_buttons.length < 2 && (
            <button
              onClick={handleAddCta}
              disabled={disabled}
              className="btn btn-sm bg-transparent text-[#434E54] border-[#434E54]/20
                       hover:bg-[#EAE0D5] hover:border-[#434E54]/30 transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add CTA
            </button>
          )}
        </div>

        {/* CTA Button List */}
        <div className="space-y-4">
          {value.cta_buttons.map((cta, index) => {
            const urlError = cta.url && !isValidUrl(cta.url);

            return (
              <div
                key={index}
                className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#434E54]">
                    Button {index + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveCta(index)}
                    disabled={disabled}
                    className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Button Text */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#434E54]">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={cta.text}
                    onChange={(e) => handleCtaChange(index, { text: e.target.value.slice(0, 50) })}
                    disabled={disabled}
                    maxLength={50}
                    placeholder="e.g., Book Appointment"
                    className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             placeholder:text-gray-400 transition-colors duration-200 text-sm
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Button URL */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#434E54] flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Button URL
                  </label>
                  <input
                    type="text"
                    value={cta.url}
                    onChange={(e) => handleCtaChange(index, { url: e.target.value })}
                    disabled={disabled}
                    placeholder="/booking or https://..."
                    className={`w-full py-2 px-3 rounded-lg border bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             placeholder:text-gray-400 transition-colors duration-200 text-sm
                             disabled:opacity-50 disabled:cursor-not-allowed
                             ${urlError ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {urlError && (
                    <p className="text-xs text-red-600">
                      Please enter a valid URL or path starting with /
                    </p>
                  )}
                </div>

                {/* Button Style */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#434E54]">
                    Button Style
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`cta-style-${index}`}
                        value="primary"
                        checked={cta.style === 'primary'}
                        onChange={() => handleCtaChange(index, { style: 'primary' })}
                        disabled={disabled}
                        className="radio radio-sm radio-primary"
                      />
                      <span className="text-sm text-[#434E54]">Primary</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`cta-style-${index}`}
                        value="secondary"
                        checked={cta.style === 'secondary'}
                        onChange={() => handleCtaChange(index, { style: 'secondary' })}
                        disabled={disabled}
                        className="radio radio-sm"
                      />
                      <span className="text-sm text-[#434E54]">Secondary</span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}

          {value.cta_buttons.length === 0 && (
            <div className="text-center py-8 text-sm text-[#6B7280]">
              No CTA buttons added yet. Click "Add CTA" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
