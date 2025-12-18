/**
 * Settings Grid Component
 * Task 0158: Responsive grid layout for settings sections
 */

'use client';

import { SettingsCard } from './SettingsCard';
import type { SettingsSectionMetadata } from '@/types/settings-dashboard';

interface SettingsGridProps {
  sections: SettingsSectionMetadata[];
}

export function SettingsGrid({ sections }: SettingsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sections.map((section) => (
        <SettingsCard key={section.id} section={section} />
      ))}
    </div>
  );
}
