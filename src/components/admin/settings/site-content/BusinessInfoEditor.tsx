/**
 * BusinessInfoEditor Component
 * Task 0164: Edit business contact information and social links
 *
 * Features:
 * - Business name and address
 * - Phone input with auto-formatting
 * - Email validation
 * - Social links with HTTPS validation
 * - Google Maps link generator
 * - Clean & Elegant Professional design
 */

'use client';

import { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  ExternalLink,
} from 'lucide-react';
import type { BusinessInfo } from '@/types/settings';
import {
  formatPhoneNumber,
  generateMapsUrl,
  validateField,
} from '@/lib/validation/business-info';

interface BusinessInfoEditorProps {
  value: BusinessInfo;
  onChange: (value: Partial<BusinessInfo>) => void;
  disabled?: boolean;
}

export function BusinessInfoEditor({
  value,
  onChange,
  disabled = false,
}: BusinessInfoEditorProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  /**
   * Mark field as touched
   */
  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
  };

  /**
   * Validate field on change
   */
  const validateAndUpdate = (
    fieldName: keyof BusinessInfo | 'social_links.instagram' | 'social_links.facebook' | 'social_links.yelp' | 'social_links.twitter',
    value: unknown
  ) => {
    const validation = validateField(fieldName, value);

    if (!validation.valid && validation.error) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: validation.error || '' }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  /**
   * Update business name
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value.slice(0, 100);
    onChange({ name });
    validateAndUpdate('name', name);
  };

  /**
   * Update address
   */
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value.slice(0, 200);
    onChange({ address });
    validateAndUpdate('address', address);
  };

  /**
   * Update city
   */
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const city = e.target.value.slice(0, 100);
    onChange({ city });
    validateAndUpdate('city', city);
  };

  /**
   * Update state
   */
  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const state = e.target.value.toUpperCase().slice(0, 2);
    onChange({ state });
    validateAndUpdate('state', state);
  };

  /**
   * Update ZIP code
   */
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zip = e.target.value;
    onChange({ zip });
    validateAndUpdate('zip', zip);
  };

  /**
   * Update phone with auto-formatting
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange({ phone: formatted });
    validateAndUpdate('phone', formatted);
  };

  /**
   * Update email
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    onChange({ email });
    validateAndUpdate('email', email);
  };

  /**
   * Update social link
   */
  const handleSocialLinkChange = (
    platform: 'instagram' | 'facebook' | 'yelp' | 'twitter',
    url: string
  ) => {
    const newSocialLinks = { ...value.social_links, [platform]: url };
    onChange({ social_links: newSocialLinks });
    validateAndUpdate(`social_links.${platform}`, url);
  };

  // Generate Google Maps URL
  const mapsUrl = generateMapsUrl(value);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Business Information
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Contact details and social media links for your business
        </p>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#434E54]">
          Business Name
        </label>
        <input
          type="text"
          value={value.name}
          onChange={handleNameChange}
          onBlur={() => handleBlur('name')}
          disabled={disabled}
          maxLength={100}
          placeholder="e.g., The Puppy Day"
          className={`w-full py-2.5 px-4 rounded-lg border bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                   placeholder:text-gray-400 transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed
                   ${fieldErrors.name && touchedFields.has('name') ? 'border-red-500' : 'border-gray-200'}`}
        />
        {fieldErrors.name && touchedFields.has('name') && (
          <p className="text-xs text-red-600">{fieldErrors.name}</p>
        )}
      </div>

      {/* Address Section */}
      <div className="space-y-4 pt-4 border-t border-[#434E54]/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#434E54] flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Address
          </h3>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View in Google Maps
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Street Address */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#434E54]">
            Street Address
          </label>
          <input
            type="text"
            value={value.address}
            onChange={handleAddressChange}
            onBlur={() => handleBlur('address')}
            disabled={disabled}
            maxLength={200}
            placeholder="e.g., 14936 Leffingwell Rd"
            className={`w-full py-2.5 px-4 rounded-lg border bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     placeholder:text-gray-400 transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${fieldErrors.address && touchedFields.has('address') ? 'border-red-500' : 'border-gray-200'}`}
          />
          {fieldErrors.address && touchedFields.has('address') && (
            <p className="text-xs text-red-600">{fieldErrors.address}</p>
          )}
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* City */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-[#434E54]">City</label>
            <input
              type="text"
              value={value.city}
              onChange={handleCityChange}
              onBlur={() => handleBlur('city')}
              disabled={disabled}
              maxLength={100}
              placeholder="e.g., La Mirada"
              className={`w-full py-2.5 px-4 rounded-lg border bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${fieldErrors.city && touchedFields.has('city') ? 'border-red-500' : 'border-gray-200'}`}
            />
            {fieldErrors.city && touchedFields.has('city') && (
              <p className="text-xs text-red-600">{fieldErrors.city}</p>
            )}
          </div>

          {/* State */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#434E54]">State</label>
            <input
              type="text"
              value={value.state}
              onChange={handleStateChange}
              onBlur={() => handleBlur('state')}
              disabled={disabled}
              maxLength={2}
              placeholder="e.g., CA"
              className={`w-full py-2.5 px-4 rounded-lg border bg-white uppercase
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${fieldErrors.state && touchedFields.has('state') ? 'border-red-500' : 'border-gray-200'}`}
            />
            {fieldErrors.state && touchedFields.has('state') && (
              <p className="text-xs text-red-600">{fieldErrors.state}</p>
            )}
          </div>

          {/* ZIP */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#434E54]">ZIP Code</label>
            <input
              type="text"
              value={value.zip}
              onChange={handleZipChange}
              onBlur={() => handleBlur('zip')}
              disabled={disabled}
              placeholder="e.g., 90638"
              className={`w-full py-2.5 px-4 rounded-lg border bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                       placeholder:text-gray-400 transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${fieldErrors.zip && touchedFields.has('zip') ? 'border-red-500' : 'border-gray-200'}`}
            />
            {fieldErrors.zip && touchedFields.has('zip') && (
              <p className="text-xs text-red-600">{fieldErrors.zip}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 pt-4 border-t border-[#434E54]/10">
        <h3 className="text-sm font-semibold text-[#434E54]">Contact Information</h3>

        {/* Phone */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#434E54] flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </label>
          <input
            type="tel"
            value={value.phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('phone')}
            disabled={disabled}
            placeholder="(657) 252-2903"
            className={`w-full py-2.5 px-4 rounded-lg border bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     placeholder:text-gray-400 transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${fieldErrors.phone && touchedFields.has('phone') ? 'border-red-500' : 'border-gray-200'}`}
          />
          {fieldErrors.phone && touchedFields.has('phone') && (
            <p className="text-xs text-red-600">{fieldErrors.phone}</p>
          )}
          <p className="text-xs text-[#6B7280]">
            Format: (XXX) XXX-XXXX (auto-formats as you type)
          </p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#434E54] flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </label>
          <input
            type="email"
            value={value.email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            disabled={disabled}
            placeholder="puppyday14936@gmail.com"
            className={`w-full py-2.5 px-4 rounded-lg border bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     placeholder:text-gray-400 transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${fieldErrors.email && touchedFields.has('email') ? 'border-red-500' : 'border-gray-200'}`}
          />
          {fieldErrors.email && touchedFields.has('email') && (
            <p className="text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4 pt-4 border-t border-[#434E54]/10">
        <div>
          <h3 className="text-sm font-semibold text-[#434E54] flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Social Media Links
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Full URLs to your social media profiles (must use HTTPS)
          </p>
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#434E54] flex items-center gap-2">
            <Instagram className="w-4 h-4" />
            Instagram
          </label>
          <input
            type="url"
            value={value.social_links.instagram || ''}
            onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
            onBlur={() => handleBlur('social_links.instagram')}
            disabled={disabled}
            placeholder="https://instagram.com/puppyday_lm"
            className={`w-full py-2.5 px-4 rounded-lg border bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     placeholder:text-gray-400 transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${fieldErrors['social_links.instagram'] && touchedFields.has('social_links.instagram') ? 'border-red-500' : 'border-gray-200'}`}
          />
          {fieldErrors['social_links.instagram'] && touchedFields.has('social_links.instagram') && (
            <p className="text-xs text-red-600">{fieldErrors['social_links.instagram']}</p>
          )}
        </div>

        {/* Facebook */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#434E54] flex items-center gap-2">
            <Facebook className="w-4 h-4" />
            Facebook
          </label>
          <input
            type="url"
            value={value.social_links.facebook || ''}
            onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
            onBlur={() => handleBlur('social_links.facebook')}
            disabled={disabled}
            placeholder="https://facebook.com/..."
            className={`w-full py-2.5 px-4 rounded-lg border bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     placeholder:text-gray-400 transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${fieldErrors['social_links.facebook'] && touchedFields.has('social_links.facebook') ? 'border-red-500' : 'border-gray-200'}`}
          />
          {fieldErrors['social_links.facebook'] && touchedFields.has('social_links.facebook') && (
            <p className="text-xs text-red-600">{fieldErrors['social_links.facebook']}</p>
          )}
        </div>

        {/* Yelp */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#434E54] flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Yelp
          </label>
          <input
            type="url"
            value={value.social_links.yelp || ''}
            onChange={(e) => handleSocialLinkChange('yelp', e.target.value)}
            onBlur={() => handleBlur('social_links.yelp')}
            disabled={disabled}
            placeholder="https://yelp.com/biz/..."
            className={`w-full py-2.5 px-4 rounded-lg border bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                     placeholder:text-gray-400 transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${fieldErrors['social_links.yelp'] && touchedFields.has('social_links.yelp') ? 'border-red-500' : 'border-gray-200'}`}
          />
          {fieldErrors['social_links.yelp'] && touchedFields.has('social_links.yelp') && (
            <p className="text-xs text-red-600">{fieldErrors['social_links.yelp']}</p>
          )}
        </div>
      </div>
    </div>
  );
}
