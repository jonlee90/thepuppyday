# Tasks 0157-0158: Settings Dashboard Implementation Plan

## Overview

This document provides a comprehensive implementation plan for creating the Settings Dashboard hub page with navigation cards. This is part of Phase 9: Admin Settings & Content Management.

**Tasks:**
- **Task 0157:** Settings dashboard page structure
- **Task 0158:** Settings dashboard navigation cards

**Design System:** Clean & Elegant Professional with subtle dog theme
- Background: `#F8EEE5` (warm cream)
- Primary/Buttons: `#434E54` (charcoal)
- Cards: `#FFFFFF` or `#FFFBF7`
- Soft shadows, subtle borders, gentle corners
- Professional typography

---

## Current State Analysis

### Existing Settings Structure

**Current Files:**
- `src/app/admin/settings/page.tsx` - Server component that fetches business hours
- `src/app/admin/settings/SettingsClient.tsx` - Client component with tabs for Business Hours, Report Cards, Waitlist, Marketing, Templates

**Problem:**
The current `/admin/settings` page is a **detailed settings editor** with tabs for specific settings. However, Tasks 0157-0158 require a **dashboard hub page** that provides navigation to different settings sections.

**Solution:**
We need to **refactor the structure** to follow this pattern:
```
/admin/settings                    → Dashboard hub (NEW - Tasks 0157-0158)
/admin/settings/business-hours     → Business hours editor (MOVE existing code)
/admin/settings/site-content       → Site content editor
/admin/settings/banners            → Promo banners management
/admin/settings/booking            → Booking settings
/admin/settings/loyalty            → Loyalty program settings
/admin/settings/staff              → Staff management
```

### Reference Patterns

**Admin Page Patterns (from existing codebase):**

1. **Server Component Pattern** (`src/app/admin/dashboard/page.tsx`):
   ```tsx
   // Server component fetches initial data
   async function getDashboardData() {
     const supabase = await createServerSupabaseClient();
     // Fetch data...
     return { stats, appointments, activity };
   }

   export default async function Page() {
     const data = await getDashboardData();
     return <ClientComponent initialData={data} />;
   }
   ```

2. **Layout Structure** (`src/app/admin/layout.tsx`):
   - Admin access is verified in the layout
   - No need to call `requireAdmin()` again in page components
   - However, `requireAdmin()` is used in some pages like `analytics/page.tsx`

3. **Component Architecture** (`src/components/admin/`):
   - Dashboard uses card-based navigation (`QuickAccess.tsx`)
   - Cards have hover effects: `hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`
   - Cards use icon + title + description pattern
   - Background color: `bg-white` with `rounded-xl shadow-sm`

4. **Error Handling** (`src/components/admin/ErrorState.tsx`):
   - Provides retry functionality
   - Motion animations with Framer Motion
   - Typed error states: `network`, `auth`, `permission`, `server`, `validation`, `generic`

5. **Loading States** (`src/components/admin/skeletons/GallerySkeleton.tsx`):
   - Uses `Skeleton` component from `@/components/ui/skeletons/Skeleton`
   - Skeleton has `animate-pulse` and `bg-[#EAE0D5]`
   - Grid layouts match the actual content structure

### Database Schema (from Task 0155)

**Relevant Tables:**
- `settings` - Key-value store for system settings
- `site_content` - Content for marketing pages
- `promo_banners` - Promotional banners with impression tracking
- `staff_commissions` - Commission rates for groomers
- `referral_codes` - Customer referral codes
- `settings_audit_log` - Audit trail for admin changes

**Default Settings Keys (from migration):**
- `booking_settings` - Cancellation policy, advance booking limits
- `loyalty_earning_rules` - Points earning configuration
- `loyalty_redemption_rules` - Points redemption rules
- `referral_program` - Referral program configuration

**Default Site Content Keys:**
- `hero` - Homepage hero section
- `seo` - SEO metadata
- `business_info` - Business details

### Utilities Available

**Time Formatting:**
- `formatRelativeTime()` from `src/app/admin/notifications/log/utils.ts`
- Returns "2 hours ago", "3 days ago", etc.

**Class Merging:**
- `cn()` from `src/lib/utils.ts` - Merges Tailwind classes with `clsx` and `twMerge`

**Currency/Date Formatting:**
- `formatCurrency()`, `formatDate()`, `formatTime()`, `formatDateTime()` from `src/lib/utils.ts`

---

## Implementation Plan

### Phase 1: File Structure Reorganization

**CRITICAL:** We need to refactor the existing settings structure before implementing the dashboard.

#### Step 1.1: Create New Directory Structure

```bash
src/app/admin/settings/
├── page.tsx                          # NEW: Dashboard hub (Task 0157)
├── business-hours/
│   └── page.tsx                      # MOVE: Current settings/page.tsx content
├── site-content/
│   └── page.tsx                      # NEW: Site content editor
├── banners/
│   └── page.tsx                      # NEW: Promo banners management
├── booking/
│   └── page.tsx                      # NEW: Booking settings
├── loyalty/
│   └── page.tsx                      # NEW: Loyalty program
└── staff/
    └── page.tsx                      # NEW: Staff management
```

#### Step 1.2: Move Existing Business Hours Code

**Action:** Rename and move files
1. Move `src/app/admin/settings/page.tsx` → `src/app/admin/settings/business-hours/page.tsx`
2. Move `src/app/admin/settings/SettingsClient.tsx` → Keep in place, refactor later OR move to `business-hours/BusinessHoursClient.tsx`

**Reason:** The current settings page is actually the business hours editor. We need to clear the main `/admin/settings` route for the dashboard hub.

#### Step 1.3: Update Imports and Routes

**Files to update:**
- Any components that link to `/admin/settings` (e.g., `QuickAccess.tsx`)
- Navigation components (check `AdminSidebar.tsx`, `AdminMobileNav.tsx`)

**Note:** The `QuickAccess` component already links to `/admin/settings`, which is correct for the dashboard hub.

---

### Phase 2: Create Settings Dashboard Components (Task 0157-0158)

#### File 1: `src/app/admin/settings/page.tsx` (NEW)

**Purpose:** Server component that fetches settings metadata and renders dashboard hub

**Implementation:**

```tsx
/**
 * Admin Settings Dashboard Page
 * Task 0157: Settings dashboard page structure
 * Hub page with navigation cards to different settings sections
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { SettingsDashboardClient } from '@/components/admin/settings/SettingsDashboardClient';
import type { SettingsSectionMetadata } from '@/types/settings-dashboard';

async function getSettingsMetadata(): Promise<{
  sections: SettingsSectionMetadata[];
  error: boolean;
}> {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch relevant data for status indicators
    const [settingsResult, siteContentResult, bannersResult] = await Promise.all([
      // Fetch key settings to determine status
      (supabase as any)
        .from('settings')
        .select('key, updated_at')
        .in('key', [
          'booking_settings',
          'loyalty_earning_rules',
          'loyalty_redemption_rules',
        ]),

      // Fetch site content to determine status
      (supabase as any)
        .from('site_content')
        .select('key, updated_at')
        .in('key', ['hero', 'seo', 'business_info']),

      // Fetch promo banners to count active banners
      (supabase as any)
        .from('promo_banners')
        .select('id, is_active')
        .eq('is_active', true),
    ]);

    // Build metadata for each section
    const sections: SettingsSectionMetadata[] = [
      {
        id: 'site-content',
        title: 'Site Content',
        description: 'Manage homepage content, SEO, and business information',
        href: '/admin/settings/site-content',
        icon: 'FileText',
        status: siteContentResult.data && siteContentResult.data.length > 0
          ? 'configured'
          : 'needs_attention',
        summary: siteContentResult.data
          ? `${siteContentResult.data.length} content sections configured`
          : 'No content configured',
        lastUpdated: siteContentResult.data?.[0]?.updated_at || null,
      },
      {
        id: 'banners',
        title: 'Promo Banners',
        description: 'Create and manage promotional banners',
        href: '/admin/settings/banners',
        icon: 'Image',
        status: bannersResult.data && bannersResult.data.length > 0
          ? 'configured'
          : 'not_configured',
        summary: bannersResult.data
          ? `${bannersResult.data.length} active banner${bannersResult.data.length !== 1 ? 's' : ''}`
          : 'No active banners',
        lastUpdated: null, // We'd need to fetch this separately if needed
      },
      {
        id: 'booking',
        title: 'Booking Settings',
        description: 'Configure appointment booking rules and policies',
        href: '/admin/settings/booking',
        icon: 'Calendar',
        status: settingsResult.data?.some((s) => s.key === 'booking_settings')
          ? 'configured'
          : 'needs_attention',
        summary: '24-hour cancellation policy',
        lastUpdated: settingsResult.data?.find((s) => s.key === 'booking_settings')?.updated_at || null,
      },
      {
        id: 'loyalty',
        title: 'Loyalty Program',
        description: 'Manage loyalty rewards and redemption rules',
        href: '/admin/settings/loyalty',
        icon: 'Gift',
        status: settingsResult.data?.some((s) => s.key === 'loyalty_earning_rules')
          ? 'configured'
          : 'not_configured',
        summary: 'Points earning and redemption rules',
        lastUpdated: settingsResult.data?.find((s) => s.key === 'loyalty_earning_rules')?.updated_at || null,
      },
      {
        id: 'staff',
        title: 'Staff Management',
        description: 'Manage staff accounts and permissions',
        href: '/admin/settings/staff',
        icon: 'Users',
        status: 'configured',
        summary: 'Team member access control',
        lastUpdated: null,
      },
    ];

    return { sections, error: false };
  } catch (error) {
    console.error('[Settings Dashboard] Error fetching metadata:', error);
    return {
      sections: [],
      error: true,
    };
  }
}

export const metadata = {
  title: 'Settings | The Puppy Day',
  description: 'Configure system settings and preferences',
};

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();

  // Verify admin access (optional, as layout already checks)
  await requireAdmin(supabase);

  const { sections, error } = await getSettingsMetadata();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Settings</h1>
        <p className="mt-2 text-[#434E54]/60">
          Configure system settings, content, and preferences
        </p>
      </div>

      {/* Dashboard Client Component */}
      <SettingsDashboardClient sections={sections} hasError={error} />
    </div>
  );
}
```

**Key Decisions:**
1. ✅ Use `requireAdmin()` for security (following `analytics/page.tsx` pattern)
2. ✅ Fetch metadata server-side for better SEO and initial load
3. ✅ Pass data to client component for interactivity
4. ✅ Use `dynamic = 'force-dynamic'` for authentication
5. ✅ Return error state for graceful handling

**TypeScript Types Needed:**
```tsx
// src/types/settings-dashboard.ts
export type SettingsSectionStatus = 'configured' | 'needs_attention' | 'not_configured';

export interface SettingsSectionMetadata {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: 'FileText' | 'Image' | 'Calendar' | 'Gift' | 'Users';
  status: SettingsSectionStatus;
  summary: string;
  lastUpdated: string | null;
}
```

---

#### File 2: `src/components/admin/settings/SettingsDashboardClient.tsx` (NEW)

**Purpose:** Client component with loading states, error handling, and interactivity

**Implementation:**

```tsx
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
```

**Key Features:**
1. ✅ Loading state with skeleton
2. ✅ Error state with retry functionality
3. ✅ Uses existing `ErrorState` component
4. ✅ Simple refresh on retry (server component will re-fetch)

---

#### File 3: `src/components/admin/settings/SettingsGrid.tsx` (NEW)

**Purpose:** Responsive grid layout for settings cards

**Implementation:**

```tsx
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
```

**Design Notes:**
- ✅ Single column on mobile
- ✅ 2 columns on desktop (md breakpoint)
- ✅ Gap of 6 (1.5rem) for visual breathing room

---

#### File 4: `src/components/admin/settings/SettingsCard.tsx` (NEW - Task 0158)

**Purpose:** Individual navigation card with status, summary, and last updated

**Implementation:**

```tsx
/**
 * Settings Card Component
 * Task 0158: Navigation card for settings sections
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Image,
  Calendar,
  Gift,
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { formatRelativeTime } from '@/app/admin/notifications/log/utils';
import type { SettingsSectionMetadata } from '@/types/settings-dashboard';

interface SettingsCardProps {
  section: SettingsSectionMetadata;
}

const iconMap = {
  FileText,
  Image,
  Calendar,
  Gift,
  Users,
};

const statusConfig = {
  configured: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Configured',
  },
  needs_attention: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Needs Attention',
  },
  not_configured: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    label: 'Not Configured',
  },
};

export function SettingsCard({ section }: SettingsCardProps) {
  const Icon = iconMap[section.icon];
  const statusDetails = statusConfig[section.status];
  const StatusIcon = statusDetails.icon;

  return (
    <Link href={section.href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className="
          bg-white rounded-xl shadow-sm border border-[#434E54]/10
          p-6 hover:shadow-lg transition-all duration-200
          group cursor-pointer
        "
      >
        {/* Header: Icon + Title + Arrow */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-12 h-12 bg-[#EAE0D5] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Icon className="w-6 h-6 text-[#434E54]" />
            </div>

            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-[#434E54] group-hover:text-[#363F44] transition-colors">
                {section.title}
              </h3>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-[#434E54]/40 group-hover:text-[#434E54] group-hover:translate-x-1 transition-all" />
        </div>

        {/* Description */}
        <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
          {section.description}
        </p>

        {/* Status Badge + Summary */}
        <div className="space-y-2">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusDetails.bgColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusDetails.color}`} />
              <span className={`text-xs font-medium ${statusDetails.color}`}>
                {statusDetails.label}
              </span>
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm text-[#434E54]/70">
            {section.summary}
          </p>

          {/* Last Updated */}
          {section.lastUpdated && (
            <p className="text-xs text-[#434E54]/50">
              Last updated {formatRelativeTime(section.lastUpdated)}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
```

**Design Features:**
1. ✅ **Hover Effects:**
   - Scale animation (`whileHover={{ scale: 1.02 }}`)
   - Shadow increase
   - Icon scale on hover
   - Arrow translation on hover
   - Title color change

2. ✅ **Status Indicators:**
   - `configured`: Green with checkmark (✓)
   - `needs_attention`: Yellow with alert (⚠)
   - `not_configured`: Gray with circle (○)

3. ✅ **Visual Hierarchy:**
   - Icon + Title at top
   - Description below
   - Status badge + summary + last updated at bottom

4. ✅ **Accessibility:**
   - Semantic `<Link>` wrapper
   - Clear focus states (DaisyUI provides default focus rings)
   - Motion respects user preferences

5. ✅ **Clean & Elegant Design:**
   - Soft shadows (`shadow-sm` → `shadow-lg` on hover)
   - Subtle borders (`border-[#434E54]/10`)
   - Gentle corners (`rounded-xl`)
   - Professional spacing

**Dependencies:**
- ✅ `framer-motion` - Already in use (existing components)
- ✅ `lucide-react` - Already in use (existing components)
- ✅ `formatRelativeTime()` - Available in codebase

---

#### File 5: `src/components/admin/settings/SettingsDashboardSkeleton.tsx` (NEW)

**Purpose:** Loading skeleton for dashboard grid

**Implementation:**

```tsx
/**
 * Settings Dashboard Skeleton Loader
 * Task 0157: Loading state for settings dashboard
 */

import { Skeleton } from '@/components/ui/skeletons/Skeleton';

export function SettingsDashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <SettingsCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SettingsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6">
      {/* Header: Icon + Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon skeleton */}
          <Skeleton className="w-12 h-12 rounded-lg" />

          {/* Title skeleton */}
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Arrow skeleton */}
        <Skeleton className="w-5 h-5" />
      </div>

      {/* Description skeleton */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />

      {/* Status and summary */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
```

**Design Notes:**
- ✅ Matches exact layout of `SettingsCard`
- ✅ Uses existing `Skeleton` component
- ✅ Shows 5 cards (same as actual count)

---

#### File 6: `src/types/settings-dashboard.ts` (NEW)

**Purpose:** TypeScript types for settings dashboard

**Implementation:**

```tsx
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
```

---

### Phase 3: Create Placeholder Pages for Navigation

We need to create placeholder pages for the new routes so the navigation doesn't 404.

#### File 7: `src/app/admin/settings/site-content/page.tsx` (PLACEHOLDER)

```tsx
/**
 * Site Content Settings Page
 * TODO: Implement in future task
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export default async function SiteContentPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Site Content</h1>
        <p className="mt-2 text-[#434E54]/60">
          Manage homepage content, SEO, and business information
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-[#6B7280]">
          This page is under construction. Site content management will be available soon.
        </p>
      </div>
    </div>
  );
}
```

**Repeat for:**
- `src/app/admin/settings/banners/page.tsx`
- `src/app/admin/settings/booking/page.tsx`
- `src/app/admin/settings/loyalty/page.tsx`
- `src/app/admin/settings/staff/page.tsx`

**Note:** These are temporary placeholders. Actual implementation will come in future tasks.

---

### Phase 4: Update Navigation and Links

#### File 8: Update `src/components/admin/dashboard/QuickAccess.tsx`

**Current Code:**
```tsx
{
  title: 'Settings',
  description: 'Configure system settings and preferences',
  href: '/admin/settings',
  icon: Settings,
  color: 'bg-[#EAE0D5]',
}
```

**Action:** No change needed! Already points to `/admin/settings` ✅

---

### Phase 5: Testing Checklist

After implementation, verify:

**Functional Tests:**
- [ ] Navigate to `/admin/settings` shows dashboard hub (not business hours editor)
- [ ] All 5 cards render correctly
- [ ] Cards display correct status badges (green/yellow/gray)
- [ ] Cards show "Last updated X ago" for sections with data
- [ ] Clicking a card navigates to the correct route
- [ ] Placeholder pages load without errors
- [ ] Loading skeleton displays during initial load
- [ ] Error state shows with retry button if data fetch fails
- [ ] Retry button refreshes the page

**Visual Tests:**
- [ ] Cards have hover effects (scale, shadow, icon scale, arrow translate)
- [ ] Responsive layout: 1 column on mobile, 2 columns on desktop
- [ ] Status badges have correct colors (green, yellow, gray)
- [ ] Icons are correct for each section
- [ ] Typography follows design system (font sizes, weights, colors)
- [ ] Spacing and padding match design system

**Accessibility Tests:**
- [ ] All links are keyboard navigable
- [ ] Focus states are visible
- [ ] Screen readers announce card content correctly
- [ ] Motion animations respect `prefers-reduced-motion`

**Performance Tests:**
- [ ] Initial load time is fast (server-side data fetch)
- [ ] No layout shift during load
- [ ] Skeleton matches actual content layout

---

## Implementation Order

### Day 1: Refactor and Core Structure
1. ✅ Create new directory structure
2. ✅ Move existing business hours code to `/business-hours/`
3. ✅ Create TypeScript types (`settings-dashboard.ts`)
4. ✅ Create skeleton component (`SettingsDashboardSkeleton.tsx`)

### Day 2: Dashboard Components
5. ✅ Create `SettingsCard.tsx` with full styling and animations
6. ✅ Create `SettingsGrid.tsx` layout component
7. ✅ Create `SettingsDashboardClient.tsx` with error/loading states
8. ✅ Create server component `page.tsx` with data fetching

### Day 3: Integration and Testing
9. ✅ Create placeholder pages for new routes
10. ✅ Test all navigation flows
11. ✅ Verify responsive design
12. ✅ Test error and loading states

---

## Important Notes

### 1. DaisyUI Usage

**Question:** Should we use DaisyUI components?

**Answer:** Mix of DaisyUI and custom Tailwind:
- ✅ Use DaisyUI utilities where helpful (`card`, `btn`, `badge` for consistent theming)
- ✅ Use custom Tailwind for precise control (cards, grid, animations)
- ✅ Use `cn()` for conditional class merging

**Current Implementation:**
- Cards: Custom Tailwind (more control over hover effects)
- Status Badges: Custom Tailwind with semantic colors
- Grid: Custom Tailwind (simple 1-2 column layout)

**Recommendation:** Continue with custom Tailwind for this component. DaisyUI `card` class is too opinionated for our specific hover effects and animations.

### 2. Framer Motion Usage

**Current Usage:** Extensively used in existing components
- `ErrorState.tsx` uses Motion for fade-in animations
- Other dashboard components use Motion

**Recommendation:** Continue using Framer Motion for:
- Card hover scale animations
- Stagger effects (optional for grid)
- Entrance animations

### 3. Data Fetching Strategy

**Server-Side Fetching:**
- ✅ Fetch metadata in server component
- ✅ Pass to client component as props
- ✅ Benefits: SEO, faster initial load, no loading flash

**Client-Side Refresh:**
- Simple `window.location.reload()` on retry
- Server component will re-fetch data
- No need for complex client-side data fetching

### 4. Status Logic

**Status Determination:**
- `configured`: Data exists and is valid
- `needs_attention`: Data exists but may need review (e.g., incomplete)
- `not_configured`: No data or disabled

**Example Logic:**
```tsx
// Site Content: Configured if at least one content section exists
status: siteContentResult.data && siteContentResult.data.length > 0
  ? 'configured'
  : 'needs_attention'

// Booking: Configured if booking_settings exists
status: settingsResult.data?.some((s) => s.key === 'booking_settings')
  ? 'configured'
  : 'needs_attention'
```

### 5. Summary Text

**Dynamic Summaries:**
- Site Content: "3 content sections configured"
- Banners: "2 active banners" or "No active banners"
- Booking: "24-hour cancellation policy" (hardcoded default)
- Loyalty: "Points earning and redemption rules" (generic)
- Staff: "Team member access control" (generic)

**Future Enhancement:** Fetch more specific data to display dynamic summaries (e.g., "Earn 1 punch per $50 spent").

### 6. Last Updated Logic

**Implementation:**
- Use `updated_at` from database
- Format with `formatRelativeTime()` utility
- Show "Last updated 2 days ago"
- Handle `null` case (don't show if never updated)

**Example:**
```tsx
{section.lastUpdated && (
  <p className="text-xs text-[#434E54]/50">
    Last updated {formatRelativeTime(section.lastUpdated)}
  </p>
)}
```

---

## Potential Issues and Solutions

### Issue 1: Existing Business Hours Route Conflict

**Problem:** Current `/admin/settings` is the business hours editor, but we need it for the dashboard.

**Solution:** Move business hours to `/admin/settings/business-hours/` as part of Phase 1.

**Impact:** Breaking change for any direct links to `/admin/settings`

**Mitigation:** Update `QuickAccess` and any other navigation components.

### Issue 2: Data Fetching Performance

**Problem:** Fetching metadata for all sections might be slow.

**Solution:**
- Use `Promise.all()` for parallel fetching ✅
- Only fetch minimal data (counts, last updated)
- Add caching if needed (future enhancement)

### Issue 3: Placeholder Pages UX

**Problem:** Users might be confused by "under construction" pages.

**Solution:**
- Clear messaging: "This page is under construction"
- Breadcrumb navigation back to dashboard
- Estimated availability date (optional)

### Issue 4: Status Logic Complexity

**Problem:** Determining status requires complex business logic.

**Solution:** Start simple:
- `configured`: Data exists
- `needs_attention`: Data exists but might need review
- `not_configured`: No data

**Future:** Create helper functions for more sophisticated status checks.

---

## File Checklist

**New Files to Create:**
- [ ] `src/app/admin/settings/page.tsx` (Dashboard hub)
- [ ] `src/components/admin/settings/SettingsDashboardClient.tsx`
- [ ] `src/components/admin/settings/SettingsGrid.tsx`
- [ ] `src/components/admin/settings/SettingsCard.tsx`
- [ ] `src/components/admin/settings/SettingsDashboardSkeleton.tsx`
- [ ] `src/types/settings-dashboard.ts`
- [ ] `src/app/admin/settings/site-content/page.tsx` (Placeholder)
- [ ] `src/app/admin/settings/banners/page.tsx` (Placeholder)
- [ ] `src/app/admin/settings/booking/page.tsx` (Placeholder)
- [ ] `src/app/admin/settings/loyalty/page.tsx` (Placeholder)
- [ ] `src/app/admin/settings/staff/page.tsx` (Placeholder)

**Files to Move/Rename:**
- [ ] `src/app/admin/settings/page.tsx` → `src/app/admin/settings/business-hours/page.tsx`
- [ ] Optionally: `src/app/admin/settings/SettingsClient.tsx` → `src/app/admin/settings/business-hours/BusinessHoursClient.tsx`

**Files to Update:**
- [ ] `src/components/admin/dashboard/QuickAccess.tsx` (Verify link is correct - likely no change needed)

---

## Dependencies

**Existing Utilities (Already Available):**
- ✅ `cn()` from `src/lib/utils.ts`
- ✅ `formatRelativeTime()` from `src/app/admin/notifications/log/utils.ts`
- ✅ `ErrorState` from `src/components/admin/ErrorState.tsx`
- ✅ `Skeleton` from `src/components/ui/skeletons/Skeleton.tsx`
- ✅ `requireAdmin()` from `src/lib/admin/auth.ts`
- ✅ `createServerSupabaseClient()` from `src/lib/supabase/server.ts`

**External Libraries (Already Installed):**
- ✅ `framer-motion` - For animations
- ✅ `lucide-react` - For icons
- ✅ `clsx` and `tailwind-merge` - For class merging

**No New Dependencies Required** ✅

---

## Database Queries

**Queries Needed in Server Component:**

```tsx
// 1. Fetch key settings
const settingsResult = await supabase
  .from('settings')
  .select('key, updated_at')
  .in('key', [
    'booking_settings',
    'loyalty_earning_rules',
    'loyalty_redemption_rules',
  ]);

// 2. Fetch site content
const siteContentResult = await supabase
  .from('site_content')
  .select('key, updated_at')
  .in('key', ['hero', 'seo', 'business_info']);

// 3. Fetch active banners count
const bannersResult = await supabase
  .from('promo_banners')
  .select('id, is_active')
  .eq('is_active', true);
```

**Performance:** All queries are indexed and lightweight (no joins, minimal columns).

---

## Security Considerations

**Authentication:**
- ✅ Use `requireAdmin()` in server component
- ✅ Layout already verifies admin access
- ✅ All routes are protected by middleware

**Data Exposure:**
- ✅ Only expose metadata (not sensitive settings values)
- ✅ No PII or secrets in status summaries
- ✅ RLS policies enforce access control

**XSS Prevention:**
- ✅ All text content is sanitized by React
- ✅ No `dangerouslySetInnerHTML` usage
- ✅ User input is validated before display

---

## Future Enhancements

**Phase 1 (Current):** Basic dashboard with static summaries
**Phase 2:** Dynamic summaries with detailed status logic
**Phase 3:** Real-time updates when settings change
**Phase 4:** Search and filter functionality
**Phase 5:** Quick edit functionality from dashboard cards

---

## Success Criteria

**Task 0157 Complete When:**
- [ ] Dashboard hub page renders at `/admin/settings`
- [ ] Server component fetches metadata successfully
- [ ] Client component handles loading and error states
- [ ] Skeleton loader displays during load
- [ ] Error state shows retry button
- [ ] Admin authentication is enforced

**Task 0158 Complete When:**
- [ ] All 5 navigation cards render correctly
- [ ] Status badges show correct colors (green/yellow/gray)
- [ ] Summaries display relevant information
- [ ] Last updated timestamps are formatted correctly
- [ ] Hover effects work smoothly
- [ ] Cards navigate to correct routes
- [ ] Responsive layout works (1 col mobile, 2 col desktop)
- [ ] All accessibility requirements met

---

## Estimated Effort

**Implementation Time:**
- Refactoring existing structure: 1 hour
- Creating TypeScript types: 30 minutes
- Creating skeleton component: 30 minutes
- Creating SettingsCard component: 2 hours (includes styling and animations)
- Creating grid and client components: 1 hour
- Creating server component with data fetching: 1.5 hours
- Creating placeholder pages: 1 hour
- Testing and refinement: 2 hours

**Total: ~9-10 hours**

---

## Final Notes for Implementation

### Before You Start
1. ✅ Read this entire document
2. ✅ Review existing admin page patterns
3. ✅ Check that Task 0155 (database migration) is complete
4. ✅ Verify pnpm is used (NOT bun or npm)
5. ✅ Check that dev server is NOT running (this is a planning task)

### During Implementation
1. ✅ Create files in the order listed in "Implementation Order"
2. ✅ Test each component individually before integration
3. ✅ Use browser dev tools to verify responsive design
4. ✅ Check console for any errors or warnings
5. ✅ Verify TypeScript types are correct (no `any` types)

### After Implementation
1. ✅ Run through testing checklist
2. ✅ Verify all links work
3. ✅ Test on different screen sizes
4. ✅ Test loading and error states
5. ✅ Create a git commit with clear message

### If You Encounter Issues
1. ✅ Check existing patterns in codebase for reference
2. ✅ Verify imports are correct (absolute paths with `@/`)
3. ✅ Check console for detailed error messages
4. ✅ Verify database schema matches expected structure
5. ✅ Ask for clarification if requirements are unclear

---

## Conclusion

This implementation plan provides a comprehensive guide for Tasks 0157-0158. The architecture follows existing patterns in the codebase, uses established utilities and components, and maintains the Clean & Elegant Professional design system.

**Key Success Factors:**
1. ✅ Refactor existing structure before adding new dashboard
2. ✅ Use server-side data fetching for performance
3. ✅ Follow existing component patterns
4. ✅ Implement proper error and loading states
5. ✅ Create placeholder pages to prevent 404s
6. ✅ Use Framer Motion for smooth animations
7. ✅ Maintain design system consistency

**No action required from you** - this is a planning document. The parent agent will handle the actual implementation and running the dev server.
