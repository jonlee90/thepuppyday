/**
 * Site Content Client Component
 * Task 0160-0165: Client-side component for site content management
 *
 * Features:
 * - Tab navigation (Hero, SEO, Business Info)
 * - Integrates all editor components
 * - useSettingsForm hook integration
 * - Unsaved changes handling
 * - Clean & Elegant Professional design
 */

'use client';

import { useState } from 'react';
import { useSettingsForm } from '@/hooks/admin/use-settings-form';
import { UnsavedChangesIndicator } from '@/components/admin/settings/UnsavedChangesIndicator';
import { LeaveConfirmDialog } from '@/components/admin/settings/LeaveConfirmDialog';
import { HeroEditor } from '@/components/admin/settings/site-content/HeroEditor';
import { HeroImageUpload } from '@/components/admin/settings/site-content/HeroImageUpload';
import { SeoEditor } from '@/components/admin/settings/site-content/SeoEditor';
import { BusinessInfoEditor } from '@/components/admin/settings/site-content/BusinessInfoEditor';
import type { HeroContent, SeoSettings, BusinessInfo } from '@/types/settings';

interface SiteContentSettings {
  hero: HeroContent;
  seo: SeoSettings;
  business: BusinessInfo;
}

interface SiteContentClientProps {
  initialSettings: SiteContentSettings;
}

export function SiteContentClient({ initialSettings }: SiteContentClientProps) {
  const [activeTab, setActiveTab] = useState<'hero' | 'seo' | 'business'>('hero');

  const form = useSettingsForm<SiteContentSettings>({
    initialData: initialSettings,
    onSave: async (data) => {
      // TODO: Replace with actual API call when endpoint is created
      // For now, simulate save with delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      /* Future implementation when API is ready:
      const response = await fetch('/api/admin/settings/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      return result.data;
      */

      // For now, just return the data as-is
      return data;
    },
    onSuccess: (data) => {
      console.log('Site content saved successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to save site content:', error);
    },
  });

  return (
    <div className="space-y-6">
      {/* Navigation protection */}
      <LeaveConfirmDialog
        isDirty={form.isDirty}
        isSaving={form.isSaving}
        onSave={form.save}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Site Content</h1>
        <p className="mt-2 text-[#6B7280]">
          Manage homepage content, SEO settings, and business information
        </p>
      </div>

      {/* Unsaved changes indicator (sticky) */}
      <div className="sticky top-0 z-10 bg-[#F8EEE5] pb-4">
        <UnsavedChangesIndicator
          isDirty={form.isDirty}
          isSaving={form.isSaving}
          error={form.error}
          lastSaved={form.lastSaved}
          onSave={form.save}
          onDiscard={form.discard}
          onRetry={form.retry}
        />
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-white p-1 rounded-lg shadow-sm border border-[#434E54]/10">
        <button
          className={`tab ${
            activeTab === 'hero'
              ? 'tab-active bg-[#434E54] text-white'
              : 'text-[#6B7280] hover:bg-[#EAE0D5]/30'
          } transition-colors duration-200`}
          onClick={() => setActiveTab('hero')}
          disabled={form.isSaving}
        >
          Hero Section
        </button>
        <button
          className={`tab ${
            activeTab === 'seo'
              ? 'tab-active bg-[#434E54] text-white'
              : 'text-[#6B7280] hover:bg-[#EAE0D5]/30'
          } transition-colors duration-200`}
          onClick={() => setActiveTab('seo')}
          disabled={form.isSaving}
        >
          SEO & Meta
        </button>
        <button
          className={`tab ${
            activeTab === 'business'
              ? 'tab-active bg-[#434E54] text-white'
              : 'text-[#6B7280] hover:bg-[#EAE0D5]/30'
          } transition-colors duration-200`}
          onClick={() => setActiveTab('business')}
          disabled={form.isSaving}
        >
          Business Info
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'hero' && (
          <>
            <HeroEditor
              value={form.data.hero}
              onChange={(updates) =>
                form.updateData({ hero: { ...form.data.hero, ...updates } })
              }
              disabled={form.isSaving}
            />
            <HeroImageUpload
              currentImageUrl={form.data.hero.background_image_url}
              onUploadComplete={(url) =>
                form.updateData({
                  hero: { ...form.data.hero, background_image_url: url },
                })
              }
              disabled={form.isSaving}
            />
          </>
        )}

        {activeTab === 'seo' && (
          <SeoEditor
            value={form.data.seo}
            onChange={(updates) =>
              form.updateData({ seo: { ...form.data.seo, ...updates } })
            }
            disabled={form.isSaving}
          />
        )}

        {activeTab === 'business' && (
          <BusinessInfoEditor
            value={form.data.business}
            onChange={(updates) =>
              form.updateData({ business: { ...form.data.business, ...updates } })
            }
            disabled={form.isSaving}
          />
        )}
      </div>
    </div>
  );
}
