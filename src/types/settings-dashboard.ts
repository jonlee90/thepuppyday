/**
 * Settings Dashboard Types
 * Task 0157-0158: TypeScript definitions
 */

export type SettingsSectionStatus = 'configured' | 'needs_attention' | 'not_configured';

export type SettingsSectionIcon = 'FileText' | 'Image' | 'Calendar' | 'Gift' | 'Users';

export interface SettingsSectionMetadata {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: SettingsSectionIcon;
  status: SettingsSectionStatus;
  summary: string;
  lastUpdated: string | null;
}
