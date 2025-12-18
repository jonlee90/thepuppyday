/**
 * Settings Dashboard Client Component
 * Task 0157: Interactive dashboard with loading and error states
 */

'use client';

import { useState } from 'react';
import { SettingsGrid } from './SettingsGrid';
import { ErrorState } from '@/components/admin/ErrorState';
import { SettingsDashboardSkeleton } from './SettingsDashboardSkeleton';
import type { SettingsSectionMetadata } from '@/types/settings-dashboard';

interface SettingsDashboardClientProps {
  sections: SettingsSectionMetadata[];
  hasError: boolean;
}

export function SettingsDashboardClient({
  sections: initialSections,
  hasError: initialError,
}: SettingsDashboardClientProps) {
  const [sections, setSections] = useState(initialSections);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(false);

    try {
      // Refresh the page to re-fetch data
      window.location.reload();
    } catch (err) {
      console.error('[Settings Dashboard] Retry failed:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading skeleton
  if (isLoading) {
    return <SettingsDashboardSkeleton />;
  }

  // Show error state with retry
  if (error || sections.length === 0) {
    return (
      <ErrorState
        type="server"
        title="Failed to Load Settings"
        message="Unable to load settings metadata. Please try again."
        onRetry={handleRetry}
        isRetrying={isLoading}
      />
    );
  }

  // Render settings grid
  return <SettingsGrid sections={sections} />;
}
