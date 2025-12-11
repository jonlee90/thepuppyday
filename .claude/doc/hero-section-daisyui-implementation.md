# Hero Section DaisyUI Implementation Plan

## Overview

This document outlines the detailed implementation plan for transforming the Hero Section of The Puppy Day grooming website using DaisyUI components. The design follows the "Clean & Elegant Professional" aesthetic with a warm cream background (#F8EEE5) and charcoal primary color (#434E54).

## Current State Analysis

**File:** `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\marketing\hero-section.tsx`

The current implementation is essentially empty - only contains the section wrapper with proper styling but no content. This is a perfect opportunity to build a beautiful DaisyUI-based hero from scratch.

**Available Assets:**
- `/images/main-dog-hero.png` - White dog sitting down facing front (primary hero image)
- `/images/puppyday-lobby.jpg` - Lobby interior (can be used as background or secondary element)
- `/images/logo.png` - Brand logo

## Design Strategy

### Recommended DaisyUI Hero Pattern: "Split Hero with Figure"

We'll implement a **two-column responsive hero layout** that:
1. Uses DaisyUI's `hero` and `hero-content` semantic classes
2. Displays the lobby image as a subtle background with overlay on mobile
3. Transitions to a side-by-side layout on desktop (text left, dog image right)
4. Features the white dog in a prominent circular/rounded frame
5. Includes prominent CTA buttons using DaisyUI button variants
6. Adds trust badges using DaisyUI badge components

## Detailed Implementation Plan

### File: `src/components/marketing/hero-section.tsx`

**Current Dependencies:**
```typescript
'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
```

**Additional Dependencies Needed:**
```typescript
import { clsx } from 'clsx'; // Already in package.json
```

---

## Component Structure

### 1. Hero Container (`hero` class)

**DaisyUI Class:** `hero`

**Structure:**
```tsx
<section id="home" className="hero min-h-screen bg-[#F8EEE5]">
  {/* Background image for mobile/tablet - optional overlay effect */}
  <div className="hero-overlay bg-opacity-5" />

  {/* Main content wrapper */}
  <div className="hero-content ...">
    {/* Content goes here */}
  </div>
</section>
```

**Key DaisyUI Classes:**
- `hero` - Core hero container
- `min-h-screen` - Full viewport height
- `hero-overlay` - Optional overlay layer for background images
- `hero-content` - Content wrapper with proper padding and centering

**Styling Notes:**
- Background color: `bg-[#F8EEE5]` (warm cream from brand palette)
- Use `hero-overlay` with very low opacity (`bg-opacity-5`) for subtle lobby background on mobile
- The `hero-content` will handle responsive flex layout

---

### 2. Hero Content Layout (`hero-content` with responsive flex)

**DaisyUI Class Pattern:** `hero-content flex-col lg:flex-row-reverse`

**Structure:**
```tsx
<div className="hero-content flex-col lg:flex-row-reverse gap-8 lg:gap-12 max-w-7xl px-4 py-12 lg:py-20">
  {/* Image on right (desktop), top (mobile) */}
  <div className="flex-1 flex items-center justify-center">
    {/* Dog image with circular frame */}
  </div>

  {/* Text content on left (desktop), bottom (mobile) */}
  <div className="flex-1 text-center lg:text-left">
    {/* Headline, tagline, buttons, badges */}
  </div>
</div>
```

**Key Classes:**
- `flex-col` - Mobile: vertical stacking
- `lg:flex-row-reverse` - Desktop: horizontal with image on right
- `gap-8 lg:gap-12` - Consistent spacing between columns
- `max-w-7xl` - Container max width for readability
- `px-4 py-12 lg:py-20` - Responsive padding

**Layout Strategy:**
- Mobile: Image top, text bottom (natural reading order)
- Desktop: Text left, image right (visual balance)
- Use `flex-1` on both columns for equal width distribution

---

### 3. Hero Image Section

**Next.js Image Component with DaisyUI Styling:**

```tsx
<div className="relative w-full max-w-md lg:max-w-lg">
  {/* Decorative background circle/blob */}
  <div className="absolute inset-0 bg-[#EAE0D5] rounded-full blur-3xl opacity-40 scale-110" />

  {/* Main dog image */}
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="relative z-10"
  >
    <Image
      src="/images/main-dog-hero.png"
      alt="Happy dog at Puppy Day grooming"
      width={600}
      height={600}
      priority
      className="w-full h-auto rounded-full shadow-2xl ring-8 ring-white/50"
    />
  </motion.div>
</div>
```

**Styling Breakdown:**
- **Container:** `relative w-full max-w-md lg:max-w-lg`
  - Responsive max-width (448px mobile → 512px desktop)

- **Background Blob:** Creates soft, organic visual interest
  - `bg-[#EAE0D5]` - Secondary cream color
  - `rounded-full blur-3xl opacity-40` - Soft glow effect
  - `scale-110` - Slightly larger than image for halo effect

- **Image Styling:**
  - `rounded-full` - Circular frame matching brand aesthetic
  - `shadow-2xl` - Soft shadow (DaisyUI-compatible Tailwind utility)
  - `ring-8 ring-white/50` - Subtle white border ring
  - `priority` - Next.js optimization for above-fold image

**Framer Motion Animation:**
- Fade in + scale up on page load
- Duration: 0.6s with easeOut timing
- Creates professional entrance effect

---

### 4. Text Content Section

#### 4a. Trust Badge (Top of Text Content)

**DaisyUI Component:** Badge

```tsx
<div className="mb-6 lg:mb-8">
  <span className="badge badge-primary badge-lg gap-2 shadow-md">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
    Rated #1 in La Mirada
  </span>
</div>
```

**DaisyUI Classes:**
- `badge` - Core badge component
- `badge-primary` - Uses charcoal color (#434E54)
- `badge-lg` - Large size for prominence
- `gap-2` - Spacing between icon and text
- `shadow-md` - Soft elevation

**Notes:**
- Star icon from Heroicons (inline SVG)
- Creates instant credibility and trust
- Positioned above headline for visual hierarchy

---

#### 4b. Headline

```tsx
<h1 className="text-5xl lg:text-7xl font-bold text-[#434E54] mb-6 leading-tight">
  {headline}
</h1>
```

**Typography Strategy:**
- **Font Size:** `text-5xl` (48px mobile) → `lg:text-7xl` (72px desktop)
- **Weight:** `font-bold` (600 weight from Nunito/Poppins heading font)
- **Color:** `text-[#434E54]` (charcoal primary)
- **Spacing:** `mb-6` (24px bottom margin)
- **Line Height:** `leading-tight` (1.25 for large headings)

**Content:** Dynamic `{headline}` prop from CMS or default value

---

#### 4c. Tagline

```tsx
<p className="text-xl lg:text-2xl text-[#6B7280] mb-10 lg:mb-12 max-w-2xl mx-auto lg:mx-0">
  {tagline}
</p>
```

**Typography Strategy:**
- **Font Size:** `text-xl` (20px) → `lg:text-2xl` (24px)
- **Color:** `text-[#6B7280]` (gray-600 for secondary text)
- **Spacing:** `mb-10 lg:mb-12` (40px → 48px)
- **Width:** `max-w-2xl` (672px max for readability)
- **Alignment:** `mx-auto lg:mx-0` (centered mobile, left desktop)

**Content:** Dynamic `{tagline}` prop describing services

---

#### 4d. CTA Buttons

**DaisyUI Components:** Button variants

```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
  {/* Primary CTA */}
  <button
    onClick={() => router.push('/login')}
    className="btn btn-primary btn-lg btn-wide shadow-lg hover:shadow-xl group"
  >
    Book Appointment
    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </button>

  {/* Secondary CTA */}
  <button
    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
    className="btn btn-outline btn-lg btn-wide shadow-md hover:shadow-lg"
  >
    View Services
  </button>
</div>
```

**DaisyUI Classes Breakdown:**

**Primary Button:**
- `btn` - Base button component
- `btn-primary` - Charcoal background (#434E54)
- `btn-lg` - Large size (padding: 1rem 1.5rem)
- `btn-wide` - Extra horizontal padding
- `shadow-lg hover:shadow-xl` - Elevation states
- `group` - For child element hover effects

**Secondary Button:**
- `btn` - Base button component
- `btn-outline` - Border-only style (no fill)
- `btn-lg` - Match primary size
- `btn-wide` - Match primary width
- `shadow-md hover:shadow-lg` - Subtle elevation

**Layout:**
- `flex flex-col sm:flex-row` - Stack mobile, horizontal tablet+
- `gap-4` - Consistent spacing between buttons
- `justify-center lg:justify-start` - Center mobile, left desktop

**Icon Animation:**
- Arrow icon with `group-hover:translate-x-1` - Slides right on hover
- `transition-transform` - Smooth 200ms animation

**Accessibility:**
- Semantic `<button>` elements
- Click handlers using Next.js router or smooth scroll
- High contrast text (white on charcoal)

---

#### 4e. Trust Indicators

**DaisyUI Component:** Badge grid

```tsx
<div className="flex flex-wrap gap-3 justify-center lg:justify-start">
  <span className="badge badge-outline badge-lg">
    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
    </svg>
    Licensed & Insured
  </span>

  <span className="badge badge-outline badge-lg">
    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    Premium Products
  </span>

  <span className="badge badge-outline badge-lg">
    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
    Expert Groomers
  </span>
</div>
```

**DaisyUI Classes:**
- `badge` - Base badge component
- `badge-outline` - Border-only style (matches btn-outline)
- `badge-lg` - Large size for readability

**Layout:**
- `flex flex-wrap` - Multiple rows on small screens
- `gap-3` - Consistent spacing between badges
- `justify-center lg:justify-start` - Center mobile, left desktop

**Icons:**
- Heroicons inline SVGs (shield, eye, users)
- `mr-2` - Space between icon and text
- `w-4 h-4` - Icon sizing

**Content:**
- "Licensed & Insured" - Safety trust factor
- "Premium Products" - Quality trust factor
- "Expert Groomers" - Expertise trust factor

---

## 5. Framer Motion Animations

### Animation Strategy

**Text Content Stagger:**
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};
```

**Application:**
```tsx
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  className="flex-1 text-center lg:text-left"
>
  <motion.div variants={itemVariants}>
    {/* Trust badge */}
  </motion.div>

  <motion.h1 variants={itemVariants}>
    {/* Headline */}
  </motion.h1>

  <motion.p variants={itemVariants}>
    {/* Tagline */}
  </motion.p>

  <motion.div variants={itemVariants}>
    {/* CTA buttons */}
  </motion.div>

  <motion.div variants={itemVariants}>
    {/* Trust indicators */}
  </motion.div>
</motion.div>
```

**Animation Notes:**
- **Stagger:** 150ms delay between each child element
- **Initial Delay:** 200ms before first element animates
- **Item Motion:** Fade in + slide up 20px
- **Timing:** 500ms duration with easeOut easing
- Creates professional, polished entrance

---

## 6. Responsive Behavior

### Breakpoint Strategy

**Mobile (< 640px):**
- Single column layout (`flex-col`)
- Centered text (`text-center`, `justify-center`)
- Stacked buttons (`flex-col`)
- Image top, text bottom
- Smaller typography (`text-5xl`, `text-xl`)
- Centered badges

**Tablet (640px - 1024px):**
- Horizontal buttons (`sm:flex-row`)
- Slightly larger typography
- Still single column for text/image

**Desktop (>= 1024px):**
- Two-column layout (`lg:flex-row-reverse`)
- Left-aligned text (`lg:text-left`, `lg:justify-start`)
- Larger typography (`lg:text-7xl`, `lg:text-2xl`)
- Image on right, text on left
- Increased spacing (`lg:gap-12`, `lg:py-20`)

---

## 7. DaisyUI Theme Integration

### Custom Theme Variables (Already Configured)

From `src/app/globals.css`:

```css
[data-theme="light"] {
  --p: 67 78 84; /* Primary: #434E54 (Charcoal) */
  --pf: 54 63 68; /* Primary Focus: #363F44 (Hover) */
  --s: 234 224 213; /* Secondary: #EAE0D5 */
  --b1: 248 238 229; /* Base-100: #F8EEE5 (Background) */
  --rounded-btn: 0.5rem; /* Gentle corners */
  --animation-btn: 0.2s; /* Smooth transitions */
  --btn-focus-scale: 0.98; /* Subtle press effect */
}
```

**How DaisyUI Classes Map to Theme:**
- `btn-primary` → Uses `--p` (charcoal #434E54)
- `btn-primary:hover` → Uses `--pf` (darker charcoal #363F44)
- `badge-primary` → Same charcoal color
- `bg-base-100` → Warm cream #F8EEE5
- All buttons get `rounded-btn: 0.5rem` automatically

**Why This Matters:**
- Ensures consistent brand colors across all DaisyUI components
- No need to override with custom Tailwind classes
- Theme-aware: If dark mode is added later, components adapt automatically
- Matches "Clean & Elegant Professional" aesthetic

---

## 8. Accessibility Considerations

### ARIA and Semantic HTML

**Current Issues:**
- Using `<button>` with `onClick` is correct ✅
- Need to add ARIA labels for icon-only elements

**Improvements:**

```tsx
{/* Primary CTA with ARIA */}
<button
  onClick={() => router.push('/login')}
  className="btn btn-primary btn-lg btn-wide shadow-lg hover:shadow-xl group"
  aria-label="Book grooming appointment"
>
  Book Appointment
  <svg aria-hidden="true" className="w-5 h-5 ...">
    {/* Icon */}
  </svg>
</button>

{/* Secondary CTA with ARIA */}
<button
  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
  className="btn btn-outline btn-lg btn-wide shadow-md hover:shadow-lg"
  aria-label="Scroll to services section"
>
  View Services
</button>
```

**Image Alt Text:**
```tsx
<Image
  src="/images/main-dog-hero.png"
  alt="Happy white dog sitting at Puppy Day professional grooming salon in La Mirada"
  // Descriptive alt text for screen readers
/>
```

**Focus States:**
- DaisyUI buttons include focus-visible styles automatically
- `--btn-focus-scale: 0.98` provides visual feedback
- Ensure keyboard navigation works (test with Tab key)

---

## 9. Performance Optimization

### Next.js Image Optimization

**Already Implemented:**
```tsx
<Image
  src="/images/main-dog-hero.png"
  alt="..."
  width={600}
  height={600}
  priority // ✅ Critical for above-fold images
  className="..."
/>
```

**Additional Optimizations:**

```tsx
{/* Optional: Add sizes attribute for responsive loading */}
<Image
  src="/images/main-dog-hero.png"
  alt="Happy dog at Puppy Day grooming"
  width={600}
  height={600}
  priority
  sizes="(max-width: 1024px) 100vw, 50vw"
  className="w-full h-auto rounded-full shadow-2xl ring-8 ring-white/50"
/>
```

**sizes Attribute Explanation:**
- Mobile/Tablet (`max-width: 1024px`): Image takes 100% viewport width
- Desktop (`> 1024px`): Image takes ~50% viewport width (two-column layout)
- Helps Next.js generate optimal image sizes for each breakpoint

---

## 10. Code Quality & Maintainability

### TypeScript Props Interface

**Current:**
```typescript
interface HeroSectionProps {
  headline: string;
  tagline: string;
  imageUrl: string; // ❌ Not currently used
}
```

**Recommended Update:**
```typescript
interface HeroSectionProps {
  headline: string;
  tagline: string;
  heroImageUrl?: string; // Optional: main dog image
  backgroundImageUrl?: string; // Optional: lobby background
}
```

**Why:**
- Allows dynamic image URLs from CMS
- Maintains flexibility for different hero variants
- Follows existing page.tsx pattern (passes imageUrl prop)

### Component Organization

**File Structure:**
```
src/components/marketing/
├── hero-section.tsx           (Main hero component)
├── hero-trust-badge.tsx       (Optional: Extract badge component)
└── hero-cta-buttons.tsx       (Optional: Extract button group)
```

**When to Extract:**
- If trust badge is reused elsewhere → Extract to `hero-trust-badge.tsx`
- If button group has complex logic → Extract to `hero-cta-buttons.tsx`
- **For now:** Keep all in one file (simpler, easier to maintain)

---

## 11. Alternative DaisyUI Patterns Considered

### Pattern A: Hero with Background Image + Overlay

**DaisyUI Classes:** `hero` with inline background, `hero-overlay`, `text-neutral-content`

```tsx
<section
  className="hero min-h-screen"
  style={{
    backgroundImage: "url(/images/puppyday-lobby.jpg)"
  }}
>
  <div className="hero-overlay bg-[#434E54] bg-opacity-60" />
  <div className="hero-content text-neutral-content text-center">
    {/* Content */}
  </div>
</section>
```

**Pros:**
- Dramatic, immersive background
- DaisyUI's `hero-overlay` handles darkening automatically
- `text-neutral-content` ensures text contrast

**Cons:**
- Harder to maintain "Clean & Elegant" aesthetic (too busy)
- Text readability issues with photo backgrounds
- Doesn't showcase the dog hero image prominently
- **NOT RECOMMENDED** for this project

---

### Pattern B: Card with Image Full Background

**DaisyUI Classes:** `card`, `image-full`

```tsx
<div className="card image-full max-w-4xl shadow-2xl">
  <figure>
    <Image src="/images/main-dog-hero.png" alt="..." />
  </figure>
  <div className="card-body justify-center text-center">
    <h2 className="card-title text-5xl">{headline}</h2>
    <p>{tagline}</p>
    <div className="card-actions justify-center">
      <button className="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>
```

**Pros:**
- DaisyUI semantic structure
- Text-on-image overlay built-in
- Easy to implement

**Cons:**
- Less control over layout
- Doesn't allow two-column desktop layout
- Dog image would be background (less prominence)
- **NOT RECOMMENDED** for this project

---

### Pattern C: Split Hero with Figure (RECOMMENDED ✅)

**DaisyUI Classes:** `hero`, `hero-content`, `flex-col lg:flex-row-reverse`

```tsx
<section className="hero min-h-screen bg-[#F8EEE5]">
  <div className="hero-content flex-col lg:flex-row-reverse gap-12 max-w-7xl">
    <div className="flex-1">
      <Image src="/images/main-dog-hero.png" className="rounded-full shadow-2xl" />
    </div>
    <div className="flex-1 text-center lg:text-left">
      {/* Headline, tagline, buttons, badges */}
    </div>
  </div>
</section>
```

**Pros:**
- Perfect for "Clean & Elegant Professional" aesthetic
- Dog image has maximum prominence
- Flexible two-column layout
- Easy to animate with Framer Motion
- Maintains brand color palette
- **RECOMMENDED** ✅

---

## 12. Implementation Checklist

### Phase 1: Structure
- [ ] Replace empty `<section>` content with DaisyUI `hero` container
- [ ] Add `hero-content` wrapper with responsive flex classes
- [ ] Create two-column layout (image + text)
- [ ] Verify responsive breakpoints work correctly

### Phase 2: Image Section
- [ ] Add Next.js `Image` component for main dog hero
- [ ] Implement circular frame styling (`rounded-full`, `shadow-2xl`, `ring-8`)
- [ ] Add decorative background blob effect
- [ ] Wrap in Framer Motion with scale/fade animation
- [ ] Test image optimization with `priority` flag

### Phase 3: Text Content
- [ ] Add trust badge at top (`badge badge-primary badge-lg`)
- [ ] Implement headline with responsive typography
- [ ] Add tagline with proper spacing and color
- [ ] Create CTA button group using DaisyUI buttons
  - [ ] Primary button: `btn btn-primary btn-lg btn-wide`
  - [ ] Secondary button: `btn btn-outline btn-lg btn-wide`
- [ ] Add trust indicator badges at bottom
- [ ] Implement icon animations (arrow slide, etc.)

### Phase 4: Animations
- [ ] Set up Framer Motion variants for stagger effect
- [ ] Apply animations to text content container
- [ ] Add individual item animations for each section
- [ ] Test animation timing and easing
- [ ] Verify animations work on mobile

### Phase 5: Accessibility
- [ ] Add ARIA labels to buttons
- [ ] Add descriptive alt text to images
- [ ] Set `aria-hidden="true"` on decorative icons
- [ ] Test keyboard navigation (Tab through buttons)
- [ ] Verify focus states are visible

### Phase 6: Testing
- [ ] Test on mobile (< 640px)
- [ ] Test on tablet (640px - 1024px)
- [ ] Test on desktop (>= 1024px)
- [ ] Verify all DaisyUI classes render correctly
- [ ] Check theme integration (colors, rounded corners)
- [ ] Test button hover states and animations
- [ ] Verify image loading performance (Lighthouse score)
- [ ] Test with slow network (3G throttling)

### Phase 7: Polish
- [ ] Fine-tune spacing and padding
- [ ] Adjust shadow intensities if needed
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Test smooth scroll behavior for "View Services" button
- [ ] Ensure router.push works for "Book Appointment" button
- [ ] Final review of typography hierarchy

---

## 13. Important Implementation Notes

### DaisyUI Version: 5.5.8

**Breaking Changes from v4:**
- New size variants: `badge-xl`, `btn-xl`, `card-xs`
- Improved theme system with better color token support
- Enhanced shadow utilities (already compatible with Tailwind 4)

**Compatibility:**
- Tailwind CSS v4 support: ✅ (project uses Tailwind 4)
- Next.js 16: ✅ (project uses Next.js 16.0.7)
- Framer Motion v12: ✅ (project uses v12.23.25)

### Tailwind CSS v4 Considerations

**New Import Syntax (Already Implemented):**
```css
/* src/app/globals.css */
@import "tailwindcss";
@plugin "daisyui";
```

**Theme Configuration:**
- DaisyUI theme variables already configured in globals.css
- Using inline `[data-theme="light"]` instead of tailwind.config.js
- This is correct for Tailwind v4 ✅

**No tailwind.config.js Needed:**
- Project does NOT have a `tailwind.config.js` file
- All configuration in `globals.css` via `@theme` directive
- This is the recommended approach for Tailwind v4 ✅

### clsx vs cn Utility

**Current Setup:**
- `clsx` is installed (package.json)
- `tailwind-merge` is also installed

**Recommended Pattern:**
```typescript
// Create utility if needed (optional)
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Usage in component
className={cn(
  'btn btn-primary btn-lg',
  isLoading && 'btn-disabled',
  className // Allow prop overrides
)}
```

**For This Hero:**
- Static class names only → `clsx` not needed
- All DaisyUI classes are predefined
- Can implement later if dynamic variants are added

---

## 14. Final Component Code Structure

### Complete File Outline

```tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  headline: string;
  tagline: string;
  heroImageUrl?: string;
  backgroundImageUrl?: string;
}

export function HeroSection({
  headline,
  tagline,
  heroImageUrl = '/images/main-dog-hero.png',
  backgroundImageUrl = '/images/puppyday-lobby.jpg'
}: HeroSectionProps) {
  const router = useRouter();

  // Framer Motion variants
  const containerVariants = { /* ... */ };
  const itemVariants = { /* ... */ };

  return (
    <section id="home" className="hero min-h-screen bg-[#F8EEE5]">
      {/* Optional: Very subtle background overlay */}
      <div className="hero-overlay bg-opacity-5" />

      {/* Main content */}
      <div className="hero-content flex-col lg:flex-row-reverse gap-8 lg:gap-12 max-w-7xl px-4 py-12 lg:py-20">
        {/* Image Section */}
        <div className="flex-1 flex items-center justify-center">
          {/* Decorative blob + dog image */}
        </div>

        {/* Text Content Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 text-center lg:text-left"
        >
          {/* Trust badge */}
          <motion.div variants={itemVariants}>
            {/* badge badge-primary badge-lg */}
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants}>
            {headline}
          </motion.h1>

          {/* Tagline */}
          <motion.p variants={itemVariants}>
            {tagline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants}>
            {/* btn btn-primary btn-lg btn-wide */}
            {/* btn btn-outline btn-lg btn-wide */}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants}>
            {/* badge badge-outline badge-lg (x3) */}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
```

---

## 15. Color Reference Quick Guide

### Brand Palette (from CLAUDE.md)

| Color | Hex | Usage | DaisyUI Variable |
|-------|-----|-------|------------------|
| Warm Cream | #F8EEE5 | Background | `--b1` / `bg-[#F8EEE5]` |
| Charcoal | #434E54 | Primary/Buttons | `--p` / `btn-primary` |
| Charcoal Hover | #363F44 | Button Hover | `--pf` / automatic |
| Lighter Cream | #EAE0D5 | Secondary | `--s` / `bg-[#EAE0D5]` |
| Text Primary | #434E54 | Headings | `text-[#434E54]` |
| Text Secondary | #6B7280 | Body/Tagline | `text-[#6B7280]` |
| White | #FFFFFF | Cards/Rings | `bg-white` |

### Shadow Utilities (Tailwind + DaisyUI Compatible)

| Class | Use Case |
|-------|----------|
| `shadow-sm` | Subtle card elevation |
| `shadow-md` | Badge/button rest state |
| `shadow-lg` | Button hover, image frames |
| `shadow-xl` | Hero image, prominent cards |
| `shadow-2xl` | Maximum elevation (dog image) |

---

## 16. Testing Strategy

### Visual Testing Checklist

**Desktop (>= 1024px):**
- [ ] Image appears on right side
- [ ] Text is left-aligned
- [ ] Two-column layout is balanced (equal width)
- [ ] Typography is large and legible (72px headline)
- [ ] Buttons are horizontal and left-aligned
- [ ] Trust badges are left-aligned
- [ ] Animations play smoothly on load

**Tablet (640px - 1024px):**
- [ ] Still single-column layout
- [ ] Text remains centered
- [ ] Buttons are horizontal
- [ ] Typography scales appropriately

**Mobile (< 640px):**
- [ ] Single column, image top
- [ ] Text is centered
- [ ] Buttons are stacked vertically
- [ ] Typography is readable (48px headline)
- [ ] Touch targets are minimum 44x44px
- [ ] No horizontal scroll

### Performance Testing

**Lighthouse Metrics (Target Scores):**
- Performance: 90+ (hero image optimized with `priority`)
- Accessibility: 95+ (ARIA labels, semantic HTML, focus states)
- Best Practices: 95+
- SEO: 100 (proper heading hierarchy, alt text)

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s (dog image with priority)
- FID (First Input Delay): < 100ms (minimal JS)
- CLS (Cumulative Layout Shift): < 0.1 (fixed image dimensions)

---

## 17. Future Enhancements (Not in Initial Implementation)

### Potential Additions

1. **Background Video:**
   - Replace lobby.jpg with lobby video (MP4)
   - Use `<video autoPlay muted loop>` behind hero-overlay
   - Requires video optimization for performance

2. **Animated Statistics:**
   - Add counter animations (e.g., "500+ Happy Dogs")
   - Use Framer Motion or react-countup library
   - Position below trust badges

3. **Carousel/Slider:**
   - Multiple hero variants cycling through
   - DaisyUI carousel component
   - Requires state management for active slide

4. **Parallax Scrolling:**
   - Dog image moves slower than text on scroll
   - Use Framer Motion scroll-linked animations
   - Adds visual depth

5. **Interactive Elements:**
   - Hover effects on dog image (e.g., paw prints appear)
   - Particle effects (floating paw prints)
   - Requires additional libraries

**Recommendation:** Implement basic hero first, then iterate based on user feedback and performance metrics.

---

## 18. Common Pitfalls to Avoid

### DaisyUI-Specific Issues

❌ **Don't mix custom colors with DaisyUI variants:**
```tsx
{/* BAD: Overrides theme colors */}
<button className="btn btn-primary bg-blue-500">
  {/* bg-blue-500 conflicts with btn-primary */}
</button>

{/* GOOD: Trust the theme */}
<button className="btn btn-primary">
  {/* Uses theme's --p variable */}
</button>
```

❌ **Don't forget responsive classes:**
```tsx
{/* BAD: Only desktop layout */}
<div className="hero-content flex-row-reverse">

{/* GOOD: Mobile-first approach */}
<div className="hero-content flex-col lg:flex-row-reverse">
```

❌ **Don't skip accessibility:**
```tsx
{/* BAD: No alt text, no ARIA */}
<Image src="/dog.png" />
<button onClick={handleClick}>
  <svg>{/* icon */}</svg>
</button>

{/* GOOD: Descriptive and accessible */}
<Image src="/dog.png" alt="Happy white dog at grooming salon" />
<button onClick={handleClick} aria-label="Book appointment">
  Book Now
  <svg aria-hidden="true">{/* icon */}</svg>
</button>
```

### Next.js Image Optimization

❌ **Don't use regular `<img>` tags:**
```tsx
{/* BAD: Misses Next.js optimization */}
<img src="/images/main-dog-hero.png" alt="..." />

{/* GOOD: Automatic optimization */}
<Image
  src="/images/main-dog-hero.png"
  width={600}
  height={600}
  priority
  alt="..."
/>
```

### Framer Motion Performance

❌ **Don't animate layout properties:**
```tsx
{/* BAD: Causes reflow */}
<motion.div animate={{ width: 500 }}>

{/* GOOD: GPU-accelerated */}
<motion.div animate={{ scale: 1.1, opacity: 1 }}>
```

---

## 19. Resources & Documentation

### Official Documentation

- **DaisyUI Components:** https://daisyui.com/components/
  - Hero: https://daisyui.com/components/hero/
  - Button: https://daisyui.com/components/button/
  - Badge: https://daisyui.com/components/badge/
  - Card: https://daisyui.com/components/card/

- **Tailwind CSS v4:** https://tailwindcss.com/docs
  - New @import syntax
  - @theme configuration
  - @plugin directive

- **Next.js Image:** https://nextjs.org/docs/app/api-reference/components/image
  - priority attribute
  - sizes attribute
  - Optimization guide

- **Framer Motion:** https://www.framer.com/motion/
  - Variants API
  - Stagger animations
  - Animation controls

### Project-Specific Files

- **Design System:** `C:\Users\Jon\Documents\claude projects\thepuppyday\CLAUDE.md` (Design Principles section)
- **Theme Config:** `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\globals.css`
- **Page Integration:** `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(marketing)\page.tsx`

---

## 20. Summary & Next Steps

### What This Implementation Achieves

✅ **DaisyUI-First Approach:**
- Uses semantic `hero`, `hero-content`, `btn`, `badge` classes
- Leverages theme system for consistent brand colors
- Avoids custom CSS where DaisyUI provides solutions

✅ **Clean & Elegant Professional Aesthetic:**
- Warm cream background (#F8EEE5)
- Charcoal buttons and headings (#434E54)
- Soft shadows, gentle corners (rounded-lg, rounded-full)
- Professional typography with proper hierarchy

✅ **Responsive & Performant:**
- Mobile-first responsive layout
- Next.js image optimization with `priority`
- Smooth Framer Motion animations
- Accessibility best practices

✅ **Production-Ready:**
- TypeScript type safety
- Proper ARIA labels and semantic HTML
- SEO-friendly structure (h1, alt text)
- Testable and maintainable code

### Implementation Order

1. **Start with structure** (hero, hero-content, flex layout)
2. **Add image section** (Next.js Image with decorative blob)
3. **Build text content** (headline, tagline, badges, buttons)
4. **Implement animations** (Framer Motion stagger)
5. **Polish & test** (accessibility, responsiveness, performance)

### Estimated Implementation Time

- **Phase 1-2 (Structure + Image):** 20 minutes
- **Phase 3 (Text Content):** 30 minutes
- **Phase 4 (Animations):** 15 minutes
- **Phase 5-7 (A11y + Testing + Polish):** 25 minutes
- **Total:** ~90 minutes

---

## Final Notes

This implementation plan provides a **comprehensive blueprint** for building a beautiful, DaisyUI-powered hero section that perfectly aligns with The Puppy Day's brand aesthetic. The approach prioritizes:

1. **DaisyUI semantic classes** over custom Tailwind utilities
2. **Theme integration** for consistent brand colors
3. **Responsive design** with mobile-first approach
4. **Performance optimization** via Next.js and Framer Motion best practices
5. **Accessibility** through proper ARIA, alt text, and focus states

The result will be a hero section that:
- Looks professional and polished
- Loads quickly and animates smoothly
- Works perfectly on all devices
- Follows industry best practices
- Is easy to maintain and extend

**Ready for implementation when the team is ready to build!**
