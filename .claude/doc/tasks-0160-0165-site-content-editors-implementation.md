# Tasks 0160-0165: Site Content Editor Components - Implementation Plan

**Status**: 📋 Implementation Plan
**Date**: 2025-12-17
**Phase**: 9 - Admin Settings & Content Management

---

## Overview

This document provides a detailed implementation plan for creating all site content editor components for The Puppy Day admin panel. These components will allow administrators to manage hero content, SEO settings, and business information through a clean, user-friendly interface.

**Key Features**:
- Hero section editor with CTA button management
- Image upload with drag-drop support and validation
- SEO settings with real-time preview
- Business info editor with phone/email/address validation
- Consistent use of `useSettingsForm` hook pattern
- Clean & Elegant Professional design system

---

## Design System Reference

### Color Palette
```css
/* Background */
--background: #F8EEE5;
--background-light: #FFFBF7;

/* Primary/Accent */
--primary: #434E54;
--primary-hover: #363F44;

/* Secondary */
--secondary: #EAE0D5;

/* Text */
--text-primary: #434E54;
--text-secondary: #6B7280;

/* Semantic */
--warning: #FFB347;
--error: #EF4444;
--success: #6BCB77;
```

### DaisyUI Components to Use
- `btn`, `btn-sm` - Buttons
- `input` - Text inputs
- `textarea` - Multi-line text
- `toggle` - Boolean toggles
- `badge` - Character counters
- `loading`, `loading-spinner` - Loading states
- `file-input` - File uploads

### Design Principles
- Soft shadows: `shadow-sm`, `shadow-md`, `shadow-lg`
- Rounded corners: `rounded-lg`, `rounded-xl`
- Smooth transitions: `transition-colors duration-200`
- Professional typography: Semibold headers, regular body
- Generous padding: `p-4`, `p-6`
- Clean spacing: `space-y-4`, `gap-4`

---

## TypeScript Types Reference

All types are defined in `C:\Users\Jon\Documents\claude projects\thepuppyday\src\types\settings.ts`:

### HeroContent (lines 354-366)
```typescript
interface CtaButton {
  text: string;
  url: string;
  style: 'primary' | 'secondary';
}

interface HeroContent {
  headline: string;          // max 100 chars
  subheadline: string;       // max 200 chars
  background_image_url: string | null;
  cta_buttons: CtaButton[];  // max 3 buttons
}

const HeroContentSchema = z.object({
  headline: z.string().min(1).max(100),
  subheadline: z.string().min(1).max(200),
  background_image_url: z.string().url().nullable(),
  cta_buttons: z.array(CtaButtonSchema).max(3),
});
```

### SeoSettings (lines 369-385)
```typescript
interface SeoSettings {
  page_title: string;        // max 60 chars
  meta_description: string;  // max 160 chars
  og_title: string;          // max 60 chars
  og_description: string;    // max 160 chars
  og_image_url: string | null;
}

const SeoSettingsSchema = z.object({
  page_title: z.string().min(1).max(60),
  meta_description: z.string().min(1).max(160),
  og_title: z.string().min(1).max(60),
  og_description: z.string().min(1).max(160),
  og_image_url: z.string().url().nullable(),
});
```

### BusinessInfo (lines 388-427)
```typescript
interface SocialLinks {
  instagram?: string;
  facebook?: string;
  yelp?: string;
  twitter?: string;
}

interface BusinessInfo {
  name: string;              // max 100 chars
  address: string;           // max 200 chars
  city: string;              // max 100 chars
  state: string;             // exactly 2 chars (e.g., "CA")
  zip: string;               // 5 digits or 5+4 format
  phone: string;             // format: (XXX) XXX-XXXX
  email: string;
  social_links: SocialLinks;
}

const BusinessInfoSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/),
  email: z.string().email(),
  social_links: SocialLinksSchema,
});
```

---

## Available Hooks & Components

### `useSettingsForm` Hook
**Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\hooks\admin\use-settings-form.ts`

**Usage Pattern**:
```typescript
const form = useSettingsForm({
  initialData: yourData,
  onSave: async (data) => {
    const response = await fetch('/api/admin/settings/endpoint', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return (await response.json()).data;
  },
  onSuccess: (data) => console.log('Saved!'),
  onError: (error) => console.error(error),
});

// Returns:
// - form.data, form.originalData
// - form.updateData(partial), form.setData(full)
// - form.save(), form.retry(), form.discard()
// - form.isDirty, form.isSaving, form.error, form.lastSaved
```

### `UnsavedChangesIndicator` Component
**Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\admin\settings\UnsavedChangesIndicator.tsx`

**Usage**:
```tsx
<UnsavedChangesIndicator
  isDirty={form.isDirty}
  isSaving={form.isSaving}
  error={form.error}
  lastSaved={form.lastSaved}
  onSave={form.save}
  onDiscard={form.discard}
  onRetry={form.retry}
/>
```

### `LeaveConfirmDialog` Component
**Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\admin\settings\LeaveConfirmDialog.tsx`

**Usage**:
```tsx
<LeaveConfirmDialog
  isDirty={form.isDirty}
  isSaving={form.isSaving}
  onSave={form.save}
/>
```

---

## Files to Create

### 1. Hero Editor Component
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\admin\settings\site-content\HeroEditor.tsx`

**Purpose**: Edit hero section headline, subheadline, and CTA buttons (up to 2).

**Key Features**:
- Headline input with 100 char limit and real-time counter
- Subheadline input with 200 char limit and real-time counter
- CTA button list (up to 2 CTAs)
- Each CTA: text input, URL input, style selector (primary/secondary)
- Add/remove CTA button functionality
- Inline URL validation (must be valid URL or start with `/`)
- Character counter badge that changes color when approaching limit

**Component Structure**:
```tsx
'use client';

import { useState } from 'react';
import { Type, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import type { HeroContent, CtaButton } from '@/types/settings';

interface HeroEditorProps {
  value: HeroContent;
  onChange: (value: Partial<HeroContent>) => void;
  disabled?: boolean;
}

export function HeroEditor({ value, onChange, disabled = false }: HeroEditorProps) {
  // Component implementation
}
```

**Implementation Details**:

1. **Headline Input**:
   - `<input type="text">` with max 100 chars
   - Character counter badge in top-right
   - Counter color: green (< 80), yellow (80-95), red (> 95)
   - Label: "Hero Headline"
   - Helper text: "Main headline for the homepage hero section"

2. **Subheadline Input**:
   - `<textarea>` with max 200 chars, 3 rows
   - Character counter badge
   - Counter color: green (< 160), yellow (160-190), red (> 190)
   - Label: "Hero Subheadline"
   - Helper text: "Supporting text below the headline"

3. **CTA Buttons Section**:
   - Label: "Call-to-Action Buttons"
   - Helper: "Add up to 2 CTA buttons"
   - For each CTA button:
     - Text input (max 50 chars): "Button Text"
     - URL input: "Button URL" with validation
     - Style selector (radio buttons): Primary / Secondary
     - Remove button (trash icon)
   - Add button (if < 2 CTAs): "+ Add CTA Button"
   - Disable add button when 2 CTAs already exist

4. **URL Validation**:
   - Use Zod schema validation
   - Show error state for invalid URLs
   - Allow relative URLs starting with `/`
   - Error message: "Please enter a valid URL or path starting with /"

**CSS Classes**:
- Container: `bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6`
- Section header: `text-lg font-semibold text-[#434E54]`
- Input wrapper: `space-y-2`
- Label: `block text-sm font-medium text-[#434E54]`
- Input: `w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]`
- Counter badge: `badge badge-sm` with dynamic color
- CTA card: `p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]`
- Style selector: Radio buttons with custom styling

---

### 2. Hero Image Upload Component
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\admin\settings\site-content\HeroImageUpload.tsx`

**Purpose**: Upload hero background image with drag-drop support and validation.

**Key Features**:
- Drag-and-drop file upload zone
- Click to browse fallback
- Client-side validation:
  - File type: jpeg, png, webp
  - Max size: 5MB
  - Min dimensions: 1920x800px
- Upload progress indicator (0-100%)
- Preview thumbnail after successful upload
- Error state with retry option
- Remove uploaded image functionality

**Component Structure**:
```tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, X, RefreshCw, AlertCircle } from 'lucide-react';

interface HeroImageUploadProps {
  currentImageUrl: string | null;
  onUploadComplete: (imageUrl: string) => void;
  disabled?: boolean;
}

export function HeroImageUpload({
  currentImageUrl,
  onUploadComplete,
  disabled = false
}: HeroImageUploadProps) {
  // Component implementation
}
```

**Implementation Details**:

1. **Upload Zone (when no image)**:
   - Dashed border: `border-2 border-dashed border-[#434E54]/30`
   - Hover state: `hover:border-[#434E54] hover:bg-[#EAE0D5]/30`
   - Icon: Upload icon (large)
   - Text: "Drag & drop an image here, or click to browse"
   - Subtext: "JPEG, PNG, or WebP • Max 5MB • Min 1920x800px"
   - Click handler: Opens file picker
   - Drag handlers: `onDragOver`, `onDragLeave`, `onDrop`

2. **File Validation**:
   ```typescript
   async function validateImage(file: File): Promise<{ valid: boolean; error?: string; dimensions?: { width: number; height: number } }> {
     // Check file type
     const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
     if (!validTypes.includes(file.type)) {
       return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
     }

     // Check file size (5MB)
     if (file.size > 5 * 1024 * 1024) {
       return { valid: false, error: 'File size exceeds 5MB.' };
     }

     // Check dimensions
     const dimensions = await getImageDimensions(file);
     if (dimensions.width < 1920 || dimensions.height < 800) {
       return {
         valid: false,
         error: `Image dimensions (${dimensions.width}x${dimensions.height}) are too small. Minimum: 1920x800px.`
       };
     }

     return { valid: true, dimensions };
   }

   function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
     return new Promise((resolve, reject) => {
       const img = new Image();
       img.onload = () => resolve({ width: img.width, height: img.height });
       img.onerror = reject;
       img.src = URL.createObjectURL(file);
     });
   }
   ```

3. **Upload Progress**:
   - Progress bar: DaisyUI `progress` component
   - Text: "Uploading... X%"
   - Loading spinner
   - Color: `progress-primary`

4. **Preview (when image uploaded)**:
   - Aspect ratio container: `aspect-[12/5]` (matches 1920x800)
   - Image: Cover fit, rounded corners
   - Overlay on hover: Semi-transparent with actions
   - Actions:
     - Remove button (X icon, top-right)
     - Re-upload button (RefreshCw icon)
   - Image URL display below: Truncated with copy button

5. **Error State**:
   - Red border
   - Error icon
   - Error message text
   - Retry button
   - Transition from error to normal on new upload attempt

6. **API Upload**:
   ```typescript
   async function uploadImage(file: File): Promise<string> {
     const formData = new FormData();
     formData.append('file', file);
     formData.append('type', 'hero');

     const response = await fetch('/api/admin/settings/site-content/upload', {
       method: 'POST',
       body: formData,
     });

     if (!response.ok) {
       throw new Error('Upload failed');
     }

     const result = await response.json();
     return result.url;
   }
   ```

**States**:
- `idle`: No upload in progress
- `uploading`: Upload in progress (show progress bar)
- `success`: Upload complete (show preview)
- `error`: Upload failed (show error + retry)

---

### 3. SEO Settings Editor
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\admin\settings\site-content\SeoEditor.tsx`

**Purpose**: Edit SEO meta tags and Open Graph settings.

**Key Features**:
- Page title input (60 char limit)
- Meta description textarea (160 char limit)
- OG title input (60 char limit)
- OG description textarea (160 char limit)
- OG image URL input
- Character counters with color coding
- Real-time preview integration with `SeoPreview` component

**Component Structure**:
```tsx
'use client';

import { Globe, FileText, Image as ImageIcon } from 'lucide-react';
import type { SeoSettings } from '@/types/settings';
import { SeoPreview } from './SeoPreview';

interface SeoEditorProps {
  value: SeoSettings;
  onChange: (value: Partial<SeoSettings>) => void;
  disabled?: boolean;
}

export function SeoEditor({ value, onChange, disabled = false }: SeoEditorProps) {
  // Component implementation
}
```

**Implementation Details**:

1. **Layout**:
   - Two-column layout on desktop: Editor (left) | Preview (right)
   - Stack vertically on mobile
   - Grid: `grid grid-cols-1 lg:grid-cols-2 gap-6`

2. **Page Title Input**:
   - Label: "Page Title"
   - Helper: "Appears in browser tabs and search results"
   - Max 60 chars
   - Counter badge
   - Counter colors: green (< 50), yellow (50-58), red (> 58)
   - Icon: Globe

3. **Meta Description Textarea**:
   - Label: "Meta Description"
   - Helper: "Brief description for search results"
   - Rows: 3
   - Max 160 chars
   - Counter badge
   - Counter colors: green (< 140), yellow (140-158), red (> 158)
   - Icon: FileText

4. **Open Graph Section**:
   - Section header: "Open Graph (Social Sharing)"
   - Helper: "How your site appears when shared on social media"
   - OG Title input (same as page title structure)
   - OG Description textarea (same as meta description structure)
   - OG Image URL input:
     - Label: "OG Image URL"
     - Helper: "Recommended: 1200x630px"
     - URL validation
     - Preview thumbnail (if URL provided)

5. **Character Counter Component**:
   ```tsx
   function CharacterCounter({
     current,
     max,
     warningThreshold = 0.85,
     dangerThreshold = 0.95
   }: {
     current: number;
     max: number;
     warningThreshold?: number;
     dangerThreshold?: number;
   }) {
     const ratio = current / max;
     const color = ratio >= dangerThreshold
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
   ```

6. **Integration with Preview**:
   - Pass all SEO data to `<SeoPreview>` component
   - Preview updates in real-time as user types
   - Sticky preview on desktop (stays visible while scrolling)

**CSS Classes**:
- Container: `bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6`
- Section divider: `border-t border-[#434E54]/10 my-6`
- Input group: `space-y-2`
- Label with icon: `flex items-center gap-2 text-sm font-medium text-[#434E54]`

---

### 4. SEO Preview Component
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\admin\settings\site-content\SeoPreview.tsx`

**Purpose**: Real-time visual preview of SEO and Open Graph appearance.

**Key Features**:
- Google search result preview
- Facebook/Open Graph card preview
- Real-time updates as user types
- Realistic styling matching actual platforms
- Truncation handling (title at 60, description at 160)

**Component Structure**:
```tsx
'use client';

import { Search, Facebook } from 'lucide-react';
import type { SeoSettings } from '@/types/settings';

interface SeoPreviewProps {
  seoData: SeoSettings;
  siteName?: string;
}

export function SeoPreview({
  seoData,
  siteName = 'The Puppy Day'
}: SeoPreviewProps) {
  // Component implementation
}
```

**Implementation Details**:

1. **Google Search Result Preview**:
   ```tsx
   <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
     <div className="flex items-center gap-2 text-xs text-[#6B7280]">
       <Search className="w-4 h-4" />
       <span>Google Search Result</span>
     </div>

     <div className="space-y-1">
       {/* Breadcrumb */}
       <div className="flex items-center gap-1 text-xs text-gray-600">
         <span>thepuppyday.com</span>
         <span>›</span>
       </div>

       {/* Title (blue, underlined, max 60 chars) */}
       <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
         {truncate(seoData.page_title, 60)}
       </h3>

       {/* Description (gray, max 160 chars) */}
       <p className="text-sm text-gray-600 leading-relaxed">
         {truncate(seoData.meta_description, 160)}
       </p>
     </div>
   </div>
   ```

2. **Open Graph Card Preview**:
   ```tsx
   <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
     <div className="flex items-center gap-2 text-xs text-[#6B7280]">
       <Facebook className="w-4 h-4" />
       <span>Facebook / Social Media</span>
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
               e.currentTarget.src = '/placeholder-og.png';
             }}
           />
         </div>
       )}

       {/* OG Text Content */}
       <div className="p-3 bg-[#F2F3F5] space-y-1">
         {/* Site name (uppercase, small, gray) */}
         <p className="text-xs uppercase text-gray-500 tracking-wide">
           {siteName.toUpperCase()}
         </p>

         {/* OG Title (bold, dark) */}
         <h4 className="font-semibold text-[#434E54] text-sm">
           {truncate(seoData.og_title, 60)}
         </h4>

         {/* OG Description (gray, smaller) */}
         <p className="text-xs text-gray-600">
           {truncate(seoData.og_description, 160)}
         </p>
       </div>
     </div>
   </div>
   ```

3. **Helper Functions**:
   ```typescript
   function truncate(text: string, maxLength: number): string {
     if (text.length <= maxLength) return text;
     return text.slice(0, maxLength - 3) + '...';
   }
   ```

4. **Layout**:
   - Container: `space-y-4`
   - Sticky on desktop: `lg:sticky lg:top-6`
   - Background: `bg-[#FFFBF7] rounded-xl p-6 border border-[#434E54]/10`
   - Header: "Preview"

**Styling Notes**:
- Match actual Google/Facebook styling as closely as possible
- Use real platform colors (Google blue: `#1a0dab`, Facebook gray: `#F2F3F5`)
- Show placeholder image if OG image URL is invalid

---

### 5. Business Info Editor
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\admin\settings\site-content\BusinessInfoEditor.tsx`

**Purpose**: Edit business contact information and social links.

**Key Features**:
- Business name input
- Address fields (street, city, state, zip)
- Phone input with auto-formatting
- Email input with validation
- Social links (Instagram, Facebook, Yelp)
- "View in Google Maps" link generator
- Inline validation feedback

**Component Structure**:
```tsx
'use client';

import { Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';
import type { BusinessInfo } from '@/types/settings';
import { validateBusinessInfo } from '@/lib/validation/business-info';

interface BusinessInfoEditorProps {
  value: BusinessInfo;
  onChange: (value: Partial<BusinessInfo>) => void;
  disabled?: boolean;
}

export function BusinessInfoEditor({
  value,
  onChange,
  disabled = false
}: BusinessInfoEditorProps) {
  // Component implementation
}
```

**Implementation Details**:

1. **Business Name**:
   - Label: "Business Name"
   - Icon: Building2
   - Max 100 chars
   - Required field

2. **Address Section**:
   - Label: "Address"
   - Icon: MapPin
   - Fields:
     - Street Address (max 200 chars)
     - City (max 100 chars)
     - State (dropdown or 2-char input, e.g., "CA")
     - ZIP Code (5 digits or 5+4 format)
   - "View in Google Maps" link:
     - Generated from address fields
     - Opens in new tab
     - Icon: External link
     - Format: `https://www.google.com/maps/search/?api=1&query={encoded_address}`

3. **Phone Input**:
   - Label: "Phone Number"
   - Icon: Phone
   - Auto-format as user types: `(XXX) XXX-XXXX`
   - Implementation:
     ```typescript
     function formatPhoneNumber(value: string): string {
       // Remove all non-digit characters
       const digits = value.replace(/\D/g, '');

       // Format: (XXX) XXX-XXXX
       if (digits.length <= 3) {
         return digits;
       } else if (digits.length <= 6) {
         return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
       } else {
         return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
       }
     }

     function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
       const formatted = formatPhoneNumber(e.target.value);
       onChange({ phone: formatted });
     }
     ```
   - Validation: Must match pattern `^\(\d{3}\) \d{3}-\d{4}$`
   - Error message: "Please enter a valid 10-digit phone number"

4. **Email Input**:
   - Label: "Email Address"
   - Icon: Mail
   - Email validation
   - Error message: "Please enter a valid email address"

5. **Social Links Section**:
   - Label: "Social Media Links"
   - Icon: Globe
   - Helper: "Full URLs to your social media profiles"
   - Fields:
     - Instagram URL (optional)
     - Facebook URL (optional)
     - Yelp URL (optional)
   - Each field:
     - Placeholder: "https://instagram.com/..."
     - Validation: Must be valid HTTPS URL
     - Platform icon next to input
   - Error message: "Please enter a valid HTTPS URL"

6. **Validation Integration**:
   - Use `validateBusinessInfo` function from validation library
   - Show inline errors below each field
   - Error styling: Red border, red text
   - Success styling: Green border (when valid and touched)

**CSS Classes**:
- Container: `bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6`
- Section: `space-y-4`
- Address grid: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- State + ZIP row: `grid grid-cols-2 gap-4`
- Social link input: `pl-10` (space for icon)
- Icon positioning: `absolute left-3 top-1/2 -translate-y-1/2`
- Error text: `text-xs text-red-600 mt-1`
- Maps link: `text-sm text-blue-600 hover:underline flex items-center gap-1`

---

### 6. Business Info Validation
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\validation\business-info.ts`

**Purpose**: Zod schema and validation functions for business information.

**Implementation**:
```typescript
import { z } from 'zod';

/**
 * Validates US phone number format: (XXX) XXX-XXXX
 */
export const phoneSchema = z
  .string()
  .regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Invalid phone number format. Use (XXX) XXX-XXXX');

/**
 * Validates email format
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Validates US ZIP code (5 digits or 5+4 format)
 */
export const zipSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code. Use 5 digits (e.g., 90638) or 5+4 format (e.g., 90638-1234)');

/**
 * Validates US state code (2 uppercase letters)
 */
export const stateSchema = z
  .string()
  .length(2, 'State must be 2 characters (e.g., CA)')
  .regex(/^[A-Z]{2}$/, 'State must be 2 uppercase letters');

/**
 * Validates HTTPS URL (required for social links)
 */
export const httpsUrlSchema = z
  .string()
  .url('Invalid URL')
  .refine((url) => url.startsWith('https://'), {
    message: 'URL must use HTTPS',
  })
  .optional()
  .or(z.literal(''));

/**
 * Social links schema
 */
export const socialLinksSchema = z.object({
  instagram: httpsUrlSchema,
  facebook: httpsUrlSchema,
  yelp: httpsUrlSchema,
  twitter: httpsUrlSchema,
});

/**
 * Full business info schema
 */
export const businessInfoSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100, 'Business name must be 100 characters or less'),
  address: z.string().min(1, 'Street address is required').max(200, 'Address must be 200 characters or less'),
  city: z.string().min(1, 'City is required').max(100, 'City must be 100 characters or less'),
  state: stateSchema,
  zip: zipSchema,
  phone: phoneSchema,
  email: emailSchema,
  social_links: socialLinksSchema,
});

export type BusinessInfoValidation = z.infer<typeof businessInfoSchema>;

/**
 * Validates entire business info object
 * Returns validation result with detailed errors
 */
export function validateBusinessInfo(data: unknown): {
  success: boolean;
  data?: BusinessInfoValidation;
  errors?: Record<string, string[]>;
} {
  const result = businessInfoSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into field-level error messages
  const errors: Record<string, string[]> = {};
  result.error.errors.forEach((err) => {
    const field = err.path.join('.');
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(err.message);
  });

  return { success: false, errors };
}

/**
 * Validates single field
 */
export function validateField(
  fieldName: keyof BusinessInfoValidation,
  value: unknown
): { valid: boolean; error?: string } {
  try {
    const fieldSchema = businessInfoSchema.shape[fieldName];
    fieldSchema.parse(value);
    return { valid: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { valid: false, error: err.errors[0]?.message || 'Invalid value' };
    }
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Helper: Generate Google Maps search URL from address
 */
export function generateMapsUrl(businessInfo: Partial<BusinessInfoValidation>): string | null {
  const { address, city, state, zip } = businessInfo;

  if (!address || !city || !state || !zip) {
    return null;
  }

  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  const encoded = encodeURIComponent(fullAddress);

  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}
```

---

### 7. Main Site Content Page
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\site-content\page.tsx`

**Purpose**: Main page that combines all site content editors with tabs or sections.

**Component Structure**:
```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { SiteContentClient } from './client';

export default async function SiteContentPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  // Fetch current site content from database
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('setting_type', 'site_content')
    .single();

  return <SiteContentClient initialSettings={settings} />;
}
```

**Client Component**:
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\site-content\client.tsx`

```tsx
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

  const form = useSettingsForm({
    initialData: initialSettings,
    onSave: async (data) => {
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
      <div className="sticky top-0 z-10">
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
          className={`tab ${activeTab === 'hero' ? 'tab-active bg-[#434E54] text-white' : 'text-[#6B7280]'}`}
          onClick={() => setActiveTab('hero')}
        >
          Hero Section
        </button>
        <button
          className={`tab ${activeTab === 'seo' ? 'tab-active bg-[#434E54] text-white' : 'text-[#6B7280]'}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO & Meta
        </button>
        <button
          className={`tab ${activeTab === 'business' ? 'tab-active bg-[#434E54] text-white' : 'text-[#6B7280]'}`}
          onClick={() => setActiveTab('business')}
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
              onChange={(updates) => form.updateData({ hero: { ...form.data.hero, ...updates } })}
              disabled={form.isSaving}
            />
            <HeroImageUpload
              currentImageUrl={form.data.hero.background_image_url}
              onUploadComplete={(url) => form.updateData({
                hero: { ...form.data.hero, background_image_url: url }
              })}
              disabled={form.isSaving}
            />
          </>
        )}

        {activeTab === 'seo' && (
          <SeoEditor
            value={form.data.seo}
            onChange={(updates) => form.updateData({ seo: { ...form.data.seo, ...updates } })}
            disabled={form.isSaving}
          />
        )}

        {activeTab === 'business' && (
          <BusinessInfoEditor
            value={form.data.business}
            onChange={(updates) => form.updateData({ business: { ...form.data.business, ...updates } })}
            disabled={form.isSaving}
          />
        )}
      </div>
    </div>
  );
}
```

**Layout Notes**:
- Use DaisyUI tabs component for navigation
- Active tab styling: `bg-[#434E54] text-white`
- Inactive tab: `text-[#6B7280]`
- Container: `max-w-7xl mx-auto`
- Sticky unsaved changes indicator at top

---

## API Endpoint (Future Implementation Note)

The image upload endpoint will need to be created in a separate task:

**Endpoint**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\api\admin\settings\site-content\upload\route.ts`

**Expected Behavior**:
- Accept `POST` multipart/form-data
- Validate file (type, size, dimensions)
- Upload to Supabase Storage bucket: `site-content`
- Return public URL
- Handle errors gracefully

**Response Format**:
```json
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/site-content/hero-xyz.webp"
}
```

---

## Component Integration Pattern

All components should follow this pattern:

```tsx
'use client';

import { useSettingsForm } from '@/hooks/admin/use-settings-form';
import { UnsavedChangesIndicator } from '@/components/admin/settings/UnsavedChangesIndicator';
import { LeaveConfirmDialog } from '@/components/admin/settings/LeaveConfirmDialog';

export function MyEditor() {
  const form = useSettingsForm({
    initialData: myData,
    onSave: async (data) => { /* API call */ },
  });

  return (
    <div className="space-y-6">
      <LeaveConfirmDialog isDirty={form.isDirty} isSaving={form.isSaving} onSave={form.save} />

      <div className="sticky top-0 z-10">
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

      {/* Form fields */}
      <input
        value={form.data.field}
        onChange={(e) => form.updateData({ field: e.target.value })}
      />
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests (Optional, can be added later)
- Character counter logic
- Phone number formatting
- URL validation
- Image dimension validation
- Truncation logic in SEO preview

### Integration Tests
- Full form flow: edit → save → success
- Error handling: edit → save → fail → retry
- Navigation blocking: edit → navigate → confirm
- Image upload flow: select → validate → upload → preview

### Manual Testing Checklist
- [ ] Hero headline character counter updates correctly
- [ ] CTA button add/remove works (max 2)
- [ ] URL validation shows errors for invalid URLs
- [ ] Image upload validates file type/size/dimensions
- [ ] Drag-and-drop upload works
- [ ] Upload progress bar displays
- [ ] Image preview shows after successful upload
- [ ] SEO preview updates in real-time
- [ ] Google search result preview matches actual Google
- [ ] Open Graph preview matches actual Facebook
- [ ] Phone number auto-formats as user types
- [ ] Email validation works
- [ ] ZIP code validation accepts both formats
- [ ] Social link validation requires HTTPS
- [ ] Google Maps link generates correctly
- [ ] Unsaved changes indicator appears
- [ ] Leave confirmation dialog blocks navigation
- [ ] Save button is disabled during save
- [ ] Error states display properly
- [ ] Retry button works after failure
- [ ] Tab switching works
- [ ] All styling matches Clean & Elegant Professional design
- [ ] Responsive layout works on mobile

---

## Important Implementation Notes

### 1. DaisyUI Component Usage
- Use DaisyUI's semantic classes: `btn`, `input`, `textarea`, `badge`, `toggle`, `tabs`, `progress`
- DO NOT use raw Tailwind color classes like `bg-blue-500` - use design system colors
- DaisyUI form inputs need wrapper classes for proper styling
- Example: `<input className="input input-bordered w-full" />`

### 2. Character Counter Implementation
Always show character count in real-time with color coding:
```tsx
function CharacterCounter({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  const color = ratio >= 0.95 ? 'badge-error' : ratio >= 0.85 ? 'badge-warning' : 'badge-success';
  return <span className={`badge badge-sm ${color}`}>{current}/{max}</span>;
}
```

### 3. Phone Number Formatting
Format phone numbers as user types, not on blur:
```tsx
const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const digits = e.target.value.replace(/\D/g, '');
  let formatted = '';

  if (digits.length <= 3) {
    formatted = digits;
  } else if (digits.length <= 6) {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  onChange({ phone: formatted });
};
```

### 4. Image Validation Must Check Dimensions
```tsx
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src); // Clean up
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}
```

### 5. Drag-and-Drop Implementation
```tsx
const handleDrop = useCallback(async (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;

  const file = files[0];
  // Validate and upload
}, []);

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
};
```

### 6. URL Validation Pattern
Accept both full URLs and relative paths:
```tsx
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
```

### 7. Real-time Preview Updates
SEO preview should update as user types without debouncing:
```tsx
// In parent component
const [seoData, setSeoData] = useState<SeoSettings>(initialData);

// Pass to both editor and preview
<SeoEditor value={seoData} onChange={setSeoData} />
<SeoPreview seoData={seoData} />
```

### 8. Error Display Pattern
Show errors inline below the field:
```tsx
<div className="space-y-2">
  <input
    className={`input input-bordered ${error ? 'border-red-500' : ''}`}
    value={value}
    onChange={onChange}
  />
  {error && (
    <p className="text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {error}
    </p>
  )}
</div>
```

### 9. Google Maps URL Generation
```tsx
function generateMapsUrl(address: string, city: string, state: string, zip: string): string {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  const encoded = encodeURIComponent(fullAddress);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}
```

### 10. Sticky Elements
Use sticky positioning for unsaved changes indicator:
```tsx
<div className="sticky top-0 z-10 bg-[#F8EEE5] pb-4">
  <UnsavedChangesIndicator ... />
</div>
```

---

## File Structure Summary

```
src/
├── app/
│   └── admin/
│       └── settings/
│           └── site-content/
│               ├── page.tsx         (Server Component)
│               └── client.tsx       (Client Component with tabs)
├── components/
│   └── admin/
│       └── settings/
│           └── site-content/
│               ├── HeroEditor.tsx
│               ├── HeroImageUpload.tsx
│               ├── SeoEditor.tsx
│               ├── SeoPreview.tsx
│               └── BusinessInfoEditor.tsx
└── lib/
    └── validation/
        └── business-info.ts
```

---

## Dependencies

All required dependencies are already installed:
- `daisyui` - UI components
- `clsx` - Class name utility
- `zod` - Validation schemas
- `lucide-react` - Icons
- `framer-motion` - Animations (already used in UnsavedChangesIndicator)
- `react-hook-form` (optional, not required for this implementation)

No new dependencies needed.

---

## Next Steps After Implementation

1. **Create API endpoint**: `/api/admin/settings/site-content/upload` for image uploads
2. **Create API endpoint**: `/api/admin/settings/site-content` for saving settings
3. **Database integration**: Ensure `settings` table has proper columns for site content
4. **Test all validation**: Especially phone, email, URL, and image validation
5. **Test responsive design**: Ensure all components work on mobile
6. **Accessibility audit**: Check keyboard navigation, screen reader support
7. **Performance testing**: Test with large images, slow connections

---

## Common Pitfalls to Avoid

1. **DO NOT** use `useState` for form data - use `useSettingsForm` hook
2. **DO NOT** forget to disable inputs during save (`disabled={form.isSaving}`)
3. **DO NOT** use custom colors - stick to design system palette
4. **DO NOT** forget character limits and validation
5. **DO NOT** allow navigation without save confirmation
6. **DO NOT** forget to clean up `URL.createObjectURL()` after image validation
7. **DO NOT** use `onChange` blur events for phone formatting - format on every keystroke
8. **DO NOT** forget to truncate text in SEO preview at exact character limits
9. **DO NOT** allow HTTP URLs for social links - require HTTPS
10. **DO NOT** skip dimension validation for uploaded images

---

## Expected Behavior Summary

### Hero Editor
- User can edit headline (max 100 chars)
- User can edit subheadline (max 200 chars)
- User can add up to 2 CTA buttons
- Each CTA has text, URL, and style (primary/secondary)
- Character counters change color as limit approaches
- Invalid URLs show error state

### Image Upload
- User can drag-drop or click to upload
- Only JPEG/PNG/WebP accepted
- Max 5MB file size
- Min 1920x800px dimensions
- Shows upload progress
- Shows preview after upload
- Can remove/replace uploaded image

### SEO Editor
- User can edit page title (max 60 chars)
- User can edit meta description (max 160 chars)
- User can edit OG title and description
- User can add OG image URL
- Preview updates in real-time
- Google search result preview shows truncated text
- Facebook card preview shows image + text

### Business Info Editor
- User can edit business name
- User can edit full address (street, city, state, ZIP)
- Phone auto-formats as `(XXX) XXX-XXXX`
- Email validates format
- Social links require HTTPS
- "View in Google Maps" link generates from address
- All validation errors show inline

---

## Estimated Implementation Time

- **HeroEditor.tsx**: 2-3 hours
- **HeroImageUpload.tsx**: 3-4 hours (most complex)
- **SeoEditor.tsx**: 2 hours
- **SeoPreview.tsx**: 2 hours
- **BusinessInfoEditor.tsx**: 2-3 hours
- **business-info.ts**: 1 hour
- **page.tsx + client.tsx**: 1-2 hours
- **Testing & refinement**: 2-3 hours

**Total**: ~15-20 hours

---

## Success Criteria

- [ ] All 6 files created and working
- [ ] All character limits enforced with counters
- [ ] All validation rules working (phone, email, URL, image)
- [ ] Image upload validates type, size, and dimensions
- [ ] SEO preview matches actual Google/Facebook appearance
- [ ] Phone number auto-formats correctly
- [ ] Unsaved changes indicator appears when editing
- [ ] Leave confirmation dialog blocks navigation
- [ ] Save/retry/discard functionality works
- [ ] All components match Clean & Elegant Professional design
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] No console errors or warnings
- [ ] All TypeScript types are correct (no `any`)

---

## Questions to Clarify Before Implementation

1. **Image Storage**: Should we use Supabase Storage or a different service? (Assumed: Supabase Storage)
2. **CTA Limit**: Requirements say "up to 2 buttons" but schema allows 3. Which is correct? (Assumed: 2 based on requirements)
3. **State Dropdown**: Should state be a dropdown with all 50 states or a free-text 2-char input? (Assumed: Free-text for flexibility)
4. **Initial Data**: Should we provide default values if no settings exist? (Assumed: Yes, use current business info from CLAUDE.md)
5. **API Integration**: Should we implement the API endpoints in this task or separate task? (Assumed: Separate task, noted in plan)

---

**End of Implementation Plan**

This plan should be reviewed before proceeding with implementation. Please read carefully and ask questions about any unclear sections. Once approved, proceed with creating the components in the order listed, testing each component individually before moving to the next.
