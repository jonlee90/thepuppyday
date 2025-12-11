# Header/Navbar DaisyUI Redesign Implementation Plan

**Project:** The Puppy Day - Dog Grooming SaaS
**Component:** Marketing Site Header Navigation
**Date:** 2025-12-10
**DaisyUI Version:** 5.5.8

---

## Overview

This plan provides detailed DaisyUI component patterns for redesigning the marketing header with proper semantic class usage, mobile responsiveness, and adherence to the "Clean & Elegant Professional" design system.

---

## Current Implementation Analysis

**File:** `src/components/marketing/header.tsx`

**Current Issues:**
1. Uses custom Tailwind classes instead of DaisyUI semantic components
2. Mobile menu uses conditional rendering instead of DaisyUI drawer pattern
3. Button CTA uses raw Tailwind instead of `btn` component classes
4. Navigation links lack DaisyUI `menu` component structure
5. Missing active state management for scroll position tracking
6. Hardcoded colors (`#434E54`, `#363F44`) instead of DaisyUI theme variables

**What's Working:**
- Sticky behavior with scroll detection
- Smooth scroll navigation logic
- Mobile menu state management
- Logo and branding placement

---

## Design Requirements

### Navigation Structure
- **Links:** Home, Services, Booking, About Us, Contact
- **Behavior:** Smooth-scroll to page sections (anchors)
- **CTA:** "Book Now" button (primary action)
- **Logo:** Left-aligned with "PUPPY DAY" text

### Design System Compliance
- **Background:** `#F8EEE5` (warm cream) = DaisyUI `base-100`
- **Primary:** `#434E54` (charcoal) = DaisyUI `primary`
- **Primary Hover:** `#363F44` = DaisyUI `primary-focus`
- **Aesthetic:** Clean, elegant, soft shadows, gentle corners
- **Typography:** Nunito for headings, Inter for body

### Responsive Behavior
- **Desktop (≥768px):** Horizontal menu with all links visible
- **Mobile (<768px):** Hamburger icon + drawer side menu
- **Sticky:** Header stays fixed at top with shadow on scroll

---

## DaisyUI Component Patterns

### 1. Navbar Structure

**Primary Classes:**
- `navbar` - Main container component
- `navbar-start` - Logo section (left-aligned)
- `navbar-center` - Navigation links (desktop horizontal menu)
- `navbar-end` - CTA button section (right-aligned)

**Recommended HTML Structure:**

```tsx
<div className="navbar bg-base-100">
  {/* Left: Logo */}
  <div className="navbar-start">
    <Link href="/" className="btn btn-ghost text-xl">
      <Image src="/logo.png" alt="Puppy Day" />
      <span>PUPPY DAY</span>
    </Link>
  </div>

  {/* Center: Desktop Navigation */}
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">
      <li><a href="#home">Home</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#booking">Booking</a></li>
      <li><a href="#about">About Us</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </div>

  {/* Right: CTA Button */}
  <div className="navbar-end">
    <button className="btn btn-primary">Book Now</button>
  </div>
</div>
```

**Key Notes:**
- `navbar` handles flexbox layout automatically
- `hidden lg:flex` on `navbar-center` hides menu on mobile
- `menu menu-horizontal` creates horizontal list for desktop
- `px-1` adds spacing between navbar sections

---

### 2. Mobile Drawer Menu

**Primary Classes:**
- `drawer` - Root container (wraps entire page)
- `drawer-toggle` - Hidden checkbox controlling visibility
- `drawer-content` - Main page content
- `drawer-side` - Sidebar wrapper
- `drawer-overlay` - Clickable backdrop to close menu

**Recommended Structure:**

```tsx
<div className="drawer">
  {/* Hidden checkbox toggle */}
  <input id="mobile-menu-drawer" type="checkbox" className="drawer-toggle" />

  {/* Page Content */}
  <div className="drawer-content">
    {/* Navbar with hamburger */}
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        {/* Hamburger Button (mobile only) */}
        <label htmlFor="mobile-menu-drawer" className="btn btn-ghost btn-square lg:hidden">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>

        {/* Logo */}
        <Link href="/" className="btn btn-ghost text-xl">PUPPY DAY</Link>
      </div>

      {/* Desktop menu center */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {/* navigation items */}
        </ul>
      </div>

      {/* CTA */}
      <div className="navbar-end">
        <button className="btn btn-primary">Book Now</button>
      </div>
    </div>

    {/* Rest of page content */}
    {children}
  </div>

  {/* Mobile Drawer Sidebar */}
  <div className="drawer-side z-50">
    <label htmlFor="mobile-menu-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
    <ul className="menu bg-base-100 min-h-full w-80 p-4">
      <li><a href="#home">Home</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#booking">Booking</a></li>
      <li><a href="#about">About Us</a></li>
      <li><a href="#contact">Contact</a></li>
      <li className="mt-4">
        <button className="btn btn-primary btn-block">Book Now</button>
      </li>
    </ul>
  </div>
</div>
```

**Key Notes:**
- Drawer MUST wrap the entire page (move to layout.tsx or parent component)
- `drawer-toggle` checkbox controls open/closed state
- `label` with `htmlFor="drawer-id"` opens/closes drawer
- `drawer-overlay` provides click-outside-to-close functionality
- `z-50` ensures drawer appears above all content
- `w-80` sets sidebar width (320px)
- Mobile menu items use `menu` class for consistent styling

---

### 3. Button Styling (CTA)

**Primary Classes:**
- `btn` - Base button component
- `btn-primary` - Uses theme primary color (`#434E54`)
- `btn-lg` - Larger size for emphasis
- `btn-wide` - Extra horizontal padding
- `rounded-full` - Override for pill-shaped buttons

**Recommended Implementation:**

```tsx
<button className="btn btn-primary btn-lg rounded-full">
  Book Now
</button>
```

**Alternative with Icon:**

```tsx
<button className="btn btn-primary btn-lg rounded-full">
  <CalendarIcon className="w-5 h-5" />
  Book Now
</button>
```

**Size Variants:**
- `btn-sm` - Small (mobile navbar)
- Default (no class) - Medium
- `btn-lg` - Large (desktop CTA emphasis)

**Style Variants for Secondary Actions:**
- `btn-ghost` - Minimal, transparent (good for logo button)
- `btn-outline` - Bordered with transparent background

**Key Notes:**
- DaisyUI `btn-primary` automatically uses theme `--p` color (`#434E54`)
- Hover state uses `--pf` (`#363F44`) automatically
- `rounded-full` overrides default `--rounded-btn: 0.5rem` for pill shape
- Button scales on click (`--btn-focus-scale: 0.98`)

---

### 4. Menu Component (Navigation Links)

**Primary Classes:**
- `menu` - Base menu component (vertical by default)
- `menu-horizontal` - Horizontal layout for desktop navbar
- `menu-active` - Applied to `<a>` for current/active item
- `menu-sm`, `menu-lg` - Size variants

**Recommended Structure:**

```tsx
{/* Desktop Horizontal Menu */}
<ul className="menu menu-horizontal px-1">
  <li><a href="#home" className="menu-active">Home</a></li>
  <li><a href="#services">Services</a></li>
  <li><a href="#booking">Booking</a></li>
  <li><a href="#about">About Us</a></li>
  <li><a href="#contact">Contact</a></li>
</ul>

{/* Mobile Vertical Menu (in drawer) */}
<ul className="menu bg-base-100 w-80 p-4">
  <li><a href="#home" className="menu-active">Home</a></li>
  <li><a href="#services">Services</a></li>
  <li><a href="#booking">Booking</a></li>
  <li><a href="#about">About Us</a></li>
  <li><a href="#contact">Contact</a></li>
</ul>
```

**Active State Management:**

```tsx
const [activeSection, setActiveSection] = useState('home');

// In scroll handler or intersection observer
const handleSectionChange = (section: string) => {
  setActiveSection(section);
};

// In menu item
<a
  href="#home"
  className={activeSection === 'home' ? 'menu-active' : ''}
>
  Home
</a>
```

**Key Notes:**
- `menu` requires `<ul>` with `<li>` > `<a>` structure
- `menu-horizontal` converts vertical menu to horizontal
- `menu-active` class highlights current menu item
- `px-1` spacing between horizontal items
- Hover states are automatic with DaisyUI theme

---

### 5. Sticky Header with Scroll Shadow

**Implementation Pattern:**

```tsx
<div className={cn(
  "navbar fixed top-0 left-0 right-0 z-40 transition-all duration-200",
  isScrolled ? "bg-base-100 shadow-md" : "bg-transparent"
)}>
  {/* navbar content */}
</div>
```

**Alternative with DaisyUI Shadow Utilities:**

```tsx
<div className={cn(
  "navbar sticky top-0 z-40 transition-shadow duration-200",
  isScrolled ? "shadow-lg bg-base-100" : "shadow-none bg-base-100/80 backdrop-blur-sm"
)}>
  {/* navbar content */}
</div>
```

**Key Notes:**
- `fixed` vs `sticky` positioning (prefer `sticky` for modern approach)
- `z-40` ensures header stays above most content (drawer uses `z-50`)
- `bg-base-100` uses theme cream background (`#F8EEE5`)
- `shadow-md` or `shadow-lg` for scroll elevation
- `backdrop-blur-sm` for glassmorphism effect (optional)
- `bg-base-100/80` for 80% opacity transparent background

---

## Implementation Strategy

### Option A: Navbar Only (No Drawer Wrapper)

**Use Case:** Simpler mobile menu with dropdown instead of drawer

**Structure:**
```tsx
// src/components/marketing/header.tsx
export function Header() {
  return (
    <div className="navbar fixed top-0 z-40 bg-base-100">
      {/* navbar-start, navbar-center, navbar-end */}
      {/* Mobile menu as absolute positioned dropdown */}
    </div>
  );
}
```

**Pros:**
- Simpler component structure
- No layout wrapper changes needed
- Faster to implement

**Cons:**
- Less elegant mobile experience
- Dropdown covers content (no slide-in animation)
- Harder to implement dark overlay

---

### Option B: Drawer Wrapper (Recommended)

**Use Case:** Professional mobile navigation with slide-in sidebar

**Structure:**
```tsx
// src/app/layout.tsx or src/app/(marketing)/layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer">
      <input id="mobile-menu" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content">
        <Header />
        {children}
        <Footer />
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="mobile-menu" className="drawer-overlay"></label>
        <MobileMenu />
      </div>
    </div>
  );
}
```

**Pros:**
- Native DaisyUI pattern
- Professional slide-in animation
- Dark overlay with click-outside-to-close
- Better UX for mobile

**Cons:**
- Requires layout restructuring
- Drawer wraps entire page
- Need to manage checkbox state across components

---

## File Changes Required

### 1. `src/components/marketing/header.tsx`

**Changes:**
- Replace custom Tailwind classes with DaisyUI semantic classes
- Convert navigation to `menu menu-horizontal` structure
- Use `btn btn-primary` for CTA button
- Update mobile menu button to use `btn-ghost btn-square`
- Add `navbar`, `navbar-start`, `navbar-center`, `navbar-end` structure
- Update logo link to use `btn-ghost` variant
- Replace hardcoded colors with theme classes

**New Imports:**
```tsx
import { cn } from '@/lib/utils'; // Already exists for clsx/tailwind-merge
```

**Key Code Changes:**

**Before:**
```tsx
<header className={`fixed top-0 ... ${isScrolled ? 'bg-base-100 shadow-md' : 'bg-transparent'}`}>
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-20">
      {/* Logo */}
      {/* Nav */}
      {/* CTA */}
      {/* Hamburger */}
    </div>
  </div>
</header>
```

**After (Option A - No Drawer):**
```tsx
<div className={cn(
  "navbar fixed top-0 left-0 right-0 z-40 transition-shadow duration-200",
  isScrolled ? "bg-base-100 shadow-md" : "bg-base-100/95"
)}>
  <div className="navbar-start">
    <label htmlFor="mobile-menu" className="btn btn-ghost btn-square lg:hidden">
      {/* Hamburger SVG */}
    </label>
    <Link href="/" className="btn btn-ghost text-xl">
      <Image src="/logo.png" alt="Puppy Day" width={40} height={40} />
      <span className="font-semibold">PUPPY DAY</span>
    </Link>
  </div>

  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">
      {navLinks.map(link => (
        <li key={link.href}>
          <a
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className={activeSection === link.href ? 'menu-active' : ''}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </div>

  <div className="navbar-end">
    <button
      onClick={() => router.push('/booking')}
      className="btn btn-primary btn-lg rounded-full"
    >
      Book Now
    </button>
  </div>
</div>
```

---

### 2. `src/components/marketing/mobile-menu.tsx` (NEW FILE)

**Purpose:** Separate mobile menu component for drawer sidebar

**Structure:**
```tsx
'use client';

import { useRouter } from 'next/navigation';

export function MobileMenu() {
  const router = useRouter();

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Services', href: '#services' },
    { label: 'Booking', href: '#booking' },
    { label: 'About Us', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    // Close drawer
    const drawerToggle = document.getElementById('mobile-menu') as HTMLInputElement;
    if (drawerToggle) drawerToggle.checked = false;

    // Smooth scroll
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ul className="menu bg-base-100 min-h-full w-80 p-4 gap-2">
      {navLinks.map(link => (
        <li key={link.href}>
          <a
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className="text-lg"
          >
            {link.label}
          </a>
        </li>
      ))}

      <li className="mt-4">
        <button
          onClick={() => {
            const drawerToggle = document.getElementById('mobile-menu') as HTMLInputElement;
            if (drawerToggle) drawerToggle.checked = false;
            router.push('/booking');
          }}
          className="btn btn-primary btn-block btn-lg rounded-full"
        >
          Book Now
        </button>
      </li>
    </ul>
  );
}
```

---

### 3. `src/app/(marketing)/layout.tsx` (MODIFY)

**Changes:** Wrap page content in drawer structure (Option B only)

**Before:**
```tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
```

**After:**
```tsx
import { Header } from '@/components/marketing/header';
import { MobileMenu } from '@/components/marketing/mobile-menu';
import { Footer } from '@/components/marketing/footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer">
      <input id="mobile-menu" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="mobile-menu" aria-label="Close menu" className="drawer-overlay"></label>
        <MobileMenu />
      </div>
    </div>
  );
}
```

**Key Notes:**
- `drawer` wraps entire layout
- `drawer-toggle` checkbox with `id="mobile-menu"`
- Header's hamburger button uses `htmlFor="mobile-menu"`
- `z-50` on `drawer-side` ensures it's above navbar (`z-40`)
- `drawer-overlay` provides click-to-close functionality

---

### 4. `src/app/globals.css` (NO CHANGES NEEDED)

**Current DaisyUI Theme Configuration:**

```css
[data-theme="light"] {
  --p: 67 78 84; /* Primary: #434E54 */
  --pf: 54 63 68; /* Primary Focus: #363F44 */
  --b1: 248 238 229; /* Base-100: #F8EEE5 */
  --rounded-btn: 0.5rem;
  --animation-btn: 0.2s;
  --btn-focus-scale: 0.98;
}
```

**Why No Changes:**
- DaisyUI theme already configured correctly
- `btn-primary` will use `--p` (charcoal #434E54)
- Hover states use `--pf` (darker charcoal #363F44)
- `bg-base-100` uses warm cream background (#F8EEE5)
- Button animations and focus states already defined

**Optional Enhancement:**

If you want custom navbar styling:

```css
.navbar {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.navbar.scrolled {
  box-shadow: 0 2px 8px rgba(67, 78, 84, 0.08);
}
```

---

## Active State Implementation

### Scroll-Based Active Section Tracking

**Strategy:** Use Intersection Observer to track which section is visible

**Implementation:**

```tsx
'use client';

import { useState, useEffect } from 'react';

export function Header() {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const sections = ['home', 'services', 'booking', 'about', 'contact'];

    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // In menu rendering:
  const isActive = (href: string) => {
    const sectionId = href.replace('#', '');
    return activeSection === sectionId ? 'menu-active' : '';
  };

  return (
    // ... navbar structure
    <a href="#home" className={isActive('#home')}>Home</a>
  );
}
```

**Key Notes:**
- `rootMargin: '-50% 0px -50% 0px'` triggers when section is centered in viewport
- Automatically updates `menu-active` class based on scroll position
- Works with smooth scroll behavior
- Cleans up observer on unmount

---

## Responsive Behavior Details

### Breakpoints (DaisyUI + Tailwind)

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops (menu shows) |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

**Recommendation:** Use `lg:` (1024px) as mobile/desktop breakpoint

### Mobile (< 1024px)

- Show hamburger icon (`lg:hidden`)
- Hide horizontal menu (`hidden lg:flex`)
- Show drawer sidebar on hamburger click
- CTA button in navbar-end (always visible)
- Logo in navbar-start

### Desktop (≥ 1024px)

- Hide hamburger icon (`lg:hidden`)
- Show horizontal menu (`hidden lg:flex`)
- All 5 nav links visible in `navbar-center`
- CTA button in navbar-end
- Logo in navbar-start

### Tablet Edge Cases

**Option 1:** Treat as mobile (show drawer)
```tsx
className="hidden lg:flex" // Menu shows at 1024px+
```

**Option 2:** Show condensed menu at 768px
```tsx
className="hidden md:flex" // Menu shows at 768px+
```

**Recommendation:** Use `lg:` breakpoint (1024px) to ensure enough space for 5 links + CTA

---

## Accessibility Considerations

### ARIA Labels

```tsx
<label
  htmlFor="mobile-menu"
  className="btn btn-ghost btn-square lg:hidden"
  aria-label="Open navigation menu"
>
  {/* Hamburger icon */}
</label>

<label
  htmlFor="mobile-menu"
  className="drawer-overlay"
  aria-label="Close navigation menu"
></label>
```

### Keyboard Navigation

- All menu items are focusable `<a>` tags
- Drawer toggle is a `<label>` connected to checkbox (keyboard accessible)
- Focus visible states handled by DaisyUI
- Tab order: Logo → Nav links → CTA button → Hamburger

### Screen Readers

- Use semantic HTML (`<nav>`, `<ul>`, `<li>`, `<a>`)
- Provide descriptive `aria-label` for icon-only buttons
- Ensure drawer overlay announces close action

---

## Performance Optimizations

### 1. Avoid Re-renders

```tsx
// Memoize navigation links
const navLinks = useMemo(() => [
  { label: 'Home', href: '#home' },
  // ...
], []);

// Memoize click handler
const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
  e.preventDefault();
  // smooth scroll logic
}, []);
```

### 2. Lazy Load Mobile Menu

```tsx
// Only render drawer content when opened
const [isDrawerOpen, setIsDrawerOpen] = useState(false);

<div className="drawer-side">
  <label htmlFor="mobile-menu" className="drawer-overlay"></label>
  {isDrawerOpen && <MobileMenu />}
</div>
```

### 3. Debounce Scroll Handler

```tsx
import { useEffect, useState } from 'react';

function useScrolled(threshold = 20) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScrolled(window.scrollY > threshold);
      }, 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [threshold]);

  return isScrolled;
}

// Usage:
const isScrolled = useScrolled(20);
```

---

## Theme Customization Notes

### Current DaisyUI Theme

The project uses a custom light theme configured in `globals.css`:

```css
[data-theme="light"] {
  --p: 67 78 84;        /* #434E54 charcoal */
  --pf: 54 63 68;       /* #363F44 darker charcoal */
  --b1: 248 238 229;    /* #F8EEE5 warm cream */
  --rounded-btn: 0.5rem;
  --animation-btn: 0.2s;
}
```

### Using Theme Variables

**DO:**
```tsx
<div className="bg-base-100">        {/* Uses --b1 */}
<button className="btn btn-primary">  {/* Uses --p */}
<a className="text-primary">          {/* Uses --p */}
```

**DON'T:**
```tsx
<div className="bg-[#F8EEE5]">        {/* Hardcoded, breaks theming */}
<button className="bg-[#434E54]">     {/* Hardcoded, no hover state */}
```

### Override Button Border Radius

For pill-shaped buttons (design system preference):

```tsx
<button className="btn btn-primary rounded-full">
  Book Now
</button>
```

This overrides DaisyUI's `--rounded-btn: 0.5rem` with Tailwind's `rounded-full`.

---

## Testing Checklist

### Functional Testing

- [ ] Logo links to home page
- [ ] All 5 nav links scroll to correct sections
- [ ] Smooth scroll animation works
- [ ] "Book Now" button navigates to booking page
- [ ] Hamburger opens mobile drawer
- [ ] Drawer overlay closes menu on click
- [ ] Mobile menu links close drawer after click
- [ ] Active section highlights correctly on scroll

### Visual Testing

- [ ] Header uses warm cream background (`#F8EEE5`)
- [ ] CTA button uses charcoal primary (`#434E54`)
- [ ] Hover states use darker charcoal (`#363F44`)
- [ ] Shadow appears on scroll
- [ ] Soft shadows (no harsh borders)
- [ ] Gentle rounded corners on buttons
- [ ] Typography uses Nunito for branding
- [ ] Clean, uncluttered spacing

### Responsive Testing

- [ ] Desktop (≥1024px): Horizontal menu visible
- [ ] Desktop: Hamburger hidden
- [ ] Mobile (<1024px): Hamburger visible
- [ ] Mobile: Horizontal menu hidden
- [ ] Drawer slides in from left on mobile
- [ ] Drawer width is appropriate (320px)
- [ ] CTA button visible on all screen sizes

### Accessibility Testing

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announces menu items
- [ ] ARIA labels present on icon buttons
- [ ] Color contrast meets WCAG AA standards
- [ ] No keyboard traps in drawer

### Performance Testing

- [ ] No layout shift when scroll shadow appears
- [ ] Smooth 60fps scroll behavior
- [ ] No unnecessary re-renders
- [ ] Drawer animation is smooth
- [ ] No jank on mobile devices

---

## Important Implementation Notes

### 1. DaisyUI Version Compatibility

This project uses **DaisyUI 5.5.8** (latest as of December 2024). Key changes from v4:

- Menu components use `menu-active` class (not `active`)
- Button variants updated (`btn-soft`, `btn-dash` are new)
- Drawer uses native HTML `<input type="checkbox">` pattern
- Navbar requires proper semantic structure (`navbar-start`, `navbar-center`, `navbar-end`)

### 2. Tailwind CSS v4 Integration

The project uses **Tailwind CSS v4** with `@tailwindcss/postcss`:

```css
@import "tailwindcss";
@plugin "daisyui";
```

This means:
- Configuration is in `globals.css`, NOT `tailwind.config.js`
- Plugin syntax uses `@plugin "daisyui"`
- Theme customization uses CSS variables in `[data-theme="light"]`

### 3. Next.js 15 App Router

Using App Router patterns:
- `'use client'` directive required for interactive components
- `useRouter` from `next/navigation` (not `next/router`)
- Layout components in `src/app/(marketing)/layout.tsx`

### 4. clsx + tailwind-merge Utility

The project uses a `cn()` utility (assumed to exist at `src/lib/utils.ts`):

```tsx
import { cn } from '@/lib/utils';

// Usage:
<div className={cn(
  "navbar fixed top-0",
  isScrolled && "shadow-md",
  "bg-base-100"
)}>
```

If this doesn't exist, create it:

```tsx
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 5. Drawer Checkbox State Management

The drawer uses native checkbox state:

```tsx
// Open drawer
const openDrawer = () => {
  const checkbox = document.getElementById('mobile-menu') as HTMLInputElement;
  if (checkbox) checkbox.checked = true;
};

// Close drawer
const closeDrawer = () => {
  const checkbox = document.getElementById('mobile-menu') as HTMLInputElement;
  if (checkbox) checkbox.checked = false;
};
```

**Alternative:** Use React state with controlled checkbox:

```tsx
const [isOpen, setIsOpen] = useState(false);

<input
  id="mobile-menu"
  type="checkbox"
  className="drawer-toggle"
  checked={isOpen}
  onChange={(e) => setIsOpen(e.target.checked)}
/>
```

### 6. Smooth Scroll Polyfill

Modern browsers support `scrollIntoView({ behavior: 'smooth' })`, but for older browsers:

```bash
pnpm add smoothscroll-polyfill
```

```tsx
// src/app/layout.tsx
import smoothscroll from 'smoothscroll-polyfill';

useEffect(() => {
  smoothscroll.polyfill();
}, []);
```

### 7. Section IDs for Anchor Links

Ensure page sections have matching IDs:

```tsx
// src/app/(marketing)/page.tsx
export default function HomePage() {
  return (
    <>
      <section id="home"><HeroSection /></section>
      <section id="services"><ServicesSection /></section>
      <section id="booking"><BookingSection /></section>
      <section id="about"><AboutSection /></section>
      <section id="contact"><ContactSection /></section>
    </>
  );
}
```

---

## Common Pitfalls & Solutions

### Issue 1: Drawer Not Opening

**Problem:** Clicking hamburger doesn't open drawer

**Solution:** Ensure checkbox ID matches label's `htmlFor`:

```tsx
<input id="mobile-menu" type="checkbox" className="drawer-toggle" />
<label htmlFor="mobile-menu" className="btn btn-ghost btn-square">
```

### Issue 2: Active State Not Updating

**Problem:** `menu-active` class not applying on scroll

**Solution:** Check section IDs match href anchors:

```tsx
// Menu link
<a href="#services">Services</a>

// Page section
<section id="services">  {/* NOT id="service" or id="Services" */}
```

### Issue 3: Drawer Covers Header

**Problem:** Mobile drawer sidebar appears behind navbar

**Solution:** Ensure z-index hierarchy:

```tsx
<div className="navbar fixed top-0 z-40">  {/* Navbar: z-40 */}
<div className="drawer-side z-50">         {/* Drawer: z-50 */}
```

### Issue 4: Button Not Using Theme Colors

**Problem:** Button shows default blue instead of charcoal

**Solution:** Verify theme configuration in `globals.css`:

```css
[data-theme="light"] {
  --p: 67 78 84; /* Must be RGB values, not hex */
}
```

And use `btn-primary` class:

```tsx
<button className="btn btn-primary">  {/* Uses --p */}
```

### Issue 5: Menu Items Too Close Together

**Problem:** Horizontal menu items cramped

**Solution:** Add spacing with `px-1` on menu or `gap-2`:

```tsx
<ul className="menu menu-horizontal px-1 gap-2">
```

### Issue 6: Mobile Menu Not Closing After Click

**Problem:** Drawer stays open after clicking link

**Solution:** Programmatically uncheck drawer toggle:

```tsx
const handleNavClick = (e: React.MouseEvent, href: string) => {
  e.preventDefault();

  // Close drawer
  const checkbox = document.getElementById('mobile-menu') as HTMLInputElement;
  if (checkbox) checkbox.checked = false;

  // Then scroll
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
};
```

---

## Recommended Implementation Order

1. **Update Header Structure** (30 min)
   - Replace custom classes with DaisyUI navbar components
   - Add `navbar-start`, `navbar-center`, `navbar-end` structure
   - Convert nav links to `menu menu-horizontal`
   - Update CTA button to `btn btn-primary`

2. **Create Mobile Menu Component** (15 min)
   - Create `src/components/marketing/mobile-menu.tsx`
   - Add vertical menu structure
   - Implement drawer close logic

3. **Wrap Layout with Drawer** (20 min)
   - Modify `src/app/(marketing)/layout.tsx`
   - Add drawer wrapper with checkbox toggle
   - Connect hamburger to drawer ID

4. **Implement Active States** (20 min)
   - Add Intersection Observer for scroll tracking
   - Apply `menu-active` class based on current section
   - Test on actual page with sections

5. **Test Responsive Behavior** (15 min)
   - Verify desktop horizontal menu
   - Test mobile drawer functionality
   - Check tablet breakpoint behavior

6. **Polish & Accessibility** (20 min)
   - Add ARIA labels
   - Test keyboard navigation
   - Verify focus states
   - Check color contrast

**Total Estimated Time:** 2 hours

---

## Final Recommendations

### 1. Use Drawer Pattern (Option B)

The drawer provides the best mobile UX with:
- Smooth slide-in animation
- Dark overlay (click-outside-to-close)
- Full-height sidebar (better than dropdown)
- Native DaisyUI pattern (less custom code)

### 2. Leverage DaisyUI Theme Variables

Always use semantic classes (`btn-primary`, `bg-base-100`) instead of hardcoded colors. This ensures:
- Automatic hover/focus states
- Theme consistency
- Future theme switching capability

### 3. Implement Active Section Tracking

Use Intersection Observer to highlight the current section in the nav menu. This provides clear visual feedback to users about their scroll position.

### 4. Optimize for Performance

- Memoize callbacks and arrays
- Use passive scroll listeners
- Debounce scroll handlers
- Lazy load drawer content

### 5. Test on Real Devices

DaisyUI's drawer component can behave differently on:
- iOS Safari (viewport units, safe areas)
- Android Chrome (address bar hiding)
- Desktop browsers (scrollbar width)

Test thoroughly across devices.

---

## Reference Links

- [DaisyUI Navbar Documentation](https://daisyui.com/components/navbar/)
- [DaisyUI Drawer Documentation](https://daisyui.com/components/drawer/)
- [DaisyUI Menu Documentation](https://daisyui.com/components/menu/)
- [DaisyUI Button Documentation](https://daisyui.com/components/button/)
- [DaisyUI Themes Guide](https://daisyui.com/docs/themes/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)

---

## Summary

This implementation plan provides a complete DaisyUI-first approach to redesigning The Puppy Day's header navigation. By leveraging DaisyUI's semantic component classes, the new header will:

1. **Use proper DaisyUI patterns**: `navbar`, `drawer`, `menu`, `btn` components
2. **Maintain design system**: Warm cream backgrounds, charcoal primary colors, soft shadows
3. **Provide excellent mobile UX**: Slide-in drawer with overlay
4. **Support accessibility**: Semantic HTML, ARIA labels, keyboard navigation
5. **Optimize performance**: Minimal re-renders, passive listeners, memoization

**Next Steps:**
1. Review this plan with the implementation team
2. Decide between Option A (simpler) or Option B (recommended drawer)
3. Begin implementation in recommended order
4. Test thoroughly across devices and screen sizes

**Estimated Total Implementation Time:** 2-3 hours including testing
