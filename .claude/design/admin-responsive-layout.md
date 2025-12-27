# Admin Panel Responsive Layout - Design Specification

## Overview

This specification redesigns The Puppy Day admin panel layout and navigation for optimal tablet and mobile experiences. The current implementation has a fixed desktop sidebar (256px) and basic mobile hamburger menu, but lacks efficient space utilization and modern mobile-first patterns for on-the-go grooming facility management.

**Design Goals:**
- Create a responsive layout that works seamlessly across desktop, tablet, and mobile
- Eliminate dead space and optimize screen real estate on smaller devices
- Provide quick access to critical functions (appointments, calendar, walk-ins, customers)
- Maintain professional aesthetics while improving touch-friendliness
- Support tablet usage while moving around the grooming facility

**Target Users:**
- Business owners checking dashboard on tablets while working
- Staff members creating walk-in appointments on mobile devices
- Admin users managing appointments from various devices throughout the day

---

## Current State Analysis

### Desktop (>1024px)
- **Sidebar**: Fixed 256px width (`lg:w-64`), collapsible to 80px (`lg:w-20`)
- **Main Content**: Left padding of 256px (`lg:pl-64`)
- **Navigation**: Vertical nav with sections (Overview, Operations, Marketing, Configuration)
- **User Info**: Shows name, role, avatar in sidebar
- **Issues**: None - works well for desktop

### Tablet (640px-1024px)
- **Current Behavior**: Uses mobile hamburger menu (shows at `lg:hidden`)
- **Issues**:
  - Wasted horizontal space - could show persistent navigation
  - Hamburger menu requires extra tap to access nav
  - No quick access to critical functions
  - Content stretches full width without constraints

### Mobile (<640px)
- **Current Behavior**: Hamburger menu with slide-in drawer (320px, max 85vw)
- **Issues**:
  - Drawer takes significant screen space
  - No bottom navigation for quick actions
  - Page headers with actions can overflow
  - Tables and grids don't adapt well to narrow screens
  - Touch targets could be larger (currently 44px minimum)

---

## User Flow Analysis

### Primary Admin Tasks by Device

**Desktop:**
1. Review dashboard metrics and today's appointments
2. Manage detailed appointment settings and configurations
3. Analyze reports and analytics
4. Configure services, pricing, and business settings

**Tablet (Moving Around Facility):**
1. Check upcoming appointments for the day
2. Create walk-in appointments quickly
3. View customer information and pet details
4. Update appointment status (checked-in, completed)
5. Access waitlist for filling slots

**Mobile (Quick Actions):**
1. Quick status check of today's schedule
2. Create walk-in appointments
3. Look up customer contact info
4. View appointment details
5. Update appointment status

### Critical Functions Requiring Fast Access
1. **Dashboard** - Quick overview
2. **Appointments** - Calendar and list views
3. **Walk-in Button** - Create immediate appointments
4. **Customers** - Search and view profiles
5. **Waitlist** - Fill open slots

---

## Layout Structure

### Desktop Layout (>1024px)

**No changes needed** - current implementation works well:

```
┌────────────┬─────────────────────────────────────────┐
│            │  Main Content Area                      │
│  Sidebar   │  - Max width: 1280px (centered)       │
│  256px     │  - Padding: 32px horizontal            │
│            │  - Background: #F8EEE5                 │
│  [Logo]    │                                        │
│  [User]    │  [Page Header]                         │
│            │  [Content Cards/Tables]                │
│  Nav       │  [Footer Actions]                      │
│  Items     │                                        │
│            │                                        │
│  [Logout]  │                                        │
└────────────┴─────────────────────────────────────────┘
```

**Specifications:**
- Sidebar: Fixed, 256px width, collapsible to 80px
- Main content: Left margin 256px, max-width 1280px, centered
- Navigation: Grouped sections with expand/collapse
- Background: Warm cream (#F8EEE5)

---

### Tablet Layout (768px-1024px)

**NEW PATTERN: Compact Persistent Sidebar + Optimized Content**

```
┌───────┬──────────────────────────────────────────┐
│       │  Main Content Area                       │
│ Side  │  - Max width: 100% (no centering)       │
│ bar   │  - Padding: 24px horizontal             │
│ 72px  │  - Optimized for touch                  │
│       │                                          │
│ [P]   │  [Page Header - Compact]                │
│       │                                          │
│ [⌂]   │  [Content - Responsive Grids]           │
│ [📅]  │  [Cards: 2-column → 1-column]           │
│ [👥]  │  [Tables: Horizontal scroll]            │
│ [✂️]  │                                          │
│ [⚙️]  │  [Bottom Actions - Sticky]              │
│       │                                          │
│ [↪]   │                                          │
└───────┴──────────────────────────────────────────┘
```

**Key Features:**

1. **Compact Icon-Only Sidebar (72px wide)**
   - Always visible, no hamburger needed
   - Icon-only navigation with tooltips on hover/long-press
   - Active state: Background fill + left border accent
   - Touch targets: 56px height (larger than mobile)
   - Groups: Visual dividers between sections (thin 1px line)

2. **Main Content Optimization**
   - No max-width constraint - use available space
   - Padding: 24px horizontal (down from 32px)
   - Headers: Compact with stacked buttons if needed
   - Grids: 2-column for stats, 1-column for quick access
   - Tables: Horizontal scroll with sticky first column

3. **Quick Action Bar (Tablet Only)**
   - Floating action button (FAB) for "Walk-in" (bottom right)
   - Position: Fixed, bottom-right, 80px from bottom, 24px from right
   - Size: 64px diameter circle
   - Color: Charcoal (#434E54) with white icon
   - Shadow: Elevated (shadow-lg)

**Sidebar Navigation Items (Icon Only):**
- Dashboard (LayoutDashboard)
- Analytics (BarChart3)
- Appointments (Calendar)
- Waitlist (Clock)
- Customers (Users)
- Campaigns (Megaphone) - Owner only
- Notifications (Bell) - Owner only
- Services (Scissors) - Owner only
- Add-ons (Plus) - Owner only
- Gallery (Images) - Owner only
- Settings (Settings) - Owner only with submenu indicator
- Logout (LogOut) - Bottom, separated

**Submenu Handling:**
- On tap: Popover menu appears to the right
- Popover: White background, shadow-lg, rounded-xl
- Items: Full text labels with icons
- Positioning: Aligned with parent icon, 8px gap

---

### Mobile Layout (<768px)

**NEW PATTERN: Top Header + Bottom Tab Navigation**

```
┌──────────────────────────────────────────────────┐
│  [☰]  Puppy Day Admin                    [User]  │  ← Fixed Header (56px)
├──────────────────────────────────────────────────┤
│                                                   │
│  Main Content Area                               │
│  - Full width minus 16px padding                │
│  - Optimized for single-column                  │
│  - Cards stack vertically                       │
│                                                   │
│  [Page Header - Mobile Optimized]               │
│                                                   │
│  [Content Cards - Single Column]                │
│  [Stats: 2-col grid]                            │
│  [Lists: Full width]                            │
│  [Actions: Full width buttons]                  │
│                                                   │
│                                                   │
│                                                   │
│  Bottom padding: 88px (for tab bar)             │
├──────────────────────────────────────────────────┤
│  [⌂] [📅] [➕] [👥] [⋯]                          │  ← Fixed Bottom Tabs (72px)
│  Home Appts Walk-in Cust. More                   │
└──────────────────────────────────────────────────┘
```

**Key Features:**

1. **Fixed Top Header (56px height)**
   - Left: Hamburger menu icon (44x44px tap target)
   - Center: "Puppy Day" logo + "Admin" subtitle
   - Right: User avatar (40x40px) - taps to profile/logout menu
   - Background: White with subtle shadow
   - Z-index: 50

2. **Bottom Tab Navigation (72px height)**
   - Position: Fixed bottom
   - 5 tabs: Home, Appointments, Walk-in (center, emphasized), Customers, More
   - Active state: Charcoal icon + text, indicator line on top
   - Inactive state: Gray icon + text
   - Center tab (Walk-in): Elevated circle button, larger (56px)
   - Touch targets: Full width of tab (20% each)
   - Background: White with top border and shadow
   - Z-index: 40

3. **Tab Navigation Items:**
   - **Home** (Dashboard icon): Dashboard overview
   - **Appointments** (Calendar icon): Appointments page
   - **Walk-in** (Plus/UserPlus icon): Quick walk-in creation (CENTER, ELEVATED)
   - **Customers** (Users icon): Customer list
   - **More** (MoreHorizontal icon): Drawer with remaining nav items

4. **Hamburger Menu Drawer**
   - Triggered by: Top-left hamburger OR bottom "More" tab
   - Slide-in: From right, 85vw max width (320px ideal)
   - Content: Full navigation tree (same as current)
   - Sections: Grouped with headers
   - User info at top: Avatar, name, role
   - Logout at bottom
   - Close: X button (top right) or overlay tap

5. **Main Content Optimization**
   - Padding: 16px horizontal, 16px top, 88px bottom
   - Single column layout for all content
   - Stats cards: 2-column grid (for 4 metrics)
   - Quick access: Single column stack
   - Tables: Simplified card view or horizontal scroll
   - Page headers: Title + icon, buttons below (full width if multiple)

6. **Mobile-Specific Interactions**
   - **Swipe gestures**: Swipe right to open hamburger drawer
   - **Pull to refresh**: On dashboard and list pages
   - **Tap targets**: Minimum 44x44px (WCAG AAA: 48x48px preferred)
   - **Bottom sheet modals**: For forms and details (instead of centered modals)
   - **Floating action button**: For primary action on list pages (e.g., "Create Appointment")

---

## Visual Design Specifications

### Color Palette (Consistent Across Breakpoints)

```css
/* Backgrounds */
--bg-primary: #F8EEE5;           /* Main background */
--bg-surface: #FFFFFF;           /* Cards, modals, nav */
--bg-surface-hover: #FFFBF7;     /* Hover state */
--bg-elevated: #FFFFFF;          /* Elevated elements */

/* Primary/Accent */
--primary: #434E54;              /* Charcoal */
--primary-hover: #363F44;        /* Darker charcoal */
--primary-light: #5A6670;        /* Lighter charcoal */

/* Secondary */
--secondary: #EAE0D5;            /* Light cream */
--secondary-hover: #DCD2C7;      /* Darker cream */

/* Text */
--text-primary: #434E54;         /* Main text */
--text-secondary: #6B7280;       /* Secondary text */
--text-muted: #9CA3AF;           /* Muted text */
--text-inverse: #FFFFFF;         /* White text on dark bg */

/* Borders */
--border-light: rgba(67, 78, 84, 0.1);   /* 10% opacity */
--border-medium: rgba(67, 78, 84, 0.2);  /* 20% opacity */

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

### Typography Scale

**Desktop:**
- Page Title (H1): 36px, bold, 1.2 line-height
- Section Title (H2): 28px, semibold, 1.3 line-height
- Card Title (H3): 20px, semibold, 1.4 line-height
- Body: 16px, regular, 1.5 line-height
- Small: 14px, regular, 1.5 line-height
- Caption: 12px, medium, 1.4 line-height

**Tablet:**
- Page Title (H1): 32px, bold, 1.2 line-height
- Section Title (H2): 24px, semibold, 1.3 line-height
- Card Title (H3): 18px, semibold, 1.4 line-height
- Body: 16px, regular, 1.5 line-height
- Small: 14px, regular, 1.5 line-height
- Caption: 12px, medium, 1.4 line-height

**Mobile:**
- Page Title (H1): 28px, bold, 1.2 line-height
- Section Title (H2): 20px, semibold, 1.3 line-height
- Card Title (H3): 16px, semibold, 1.4 line-height
- Body: 16px, regular, 1.5 line-height (maintain readability)
- Small: 14px, regular, 1.5 line-height
- Caption: 12px, medium, 1.4 line-height

### Spacing System

**Desktop:**
- Container padding: 32px horizontal
- Section gap: 24px
- Card padding: 24px
- Button padding: 12px vertical, 20px horizontal
- Grid gap: 24px

**Tablet:**
- Container padding: 24px horizontal
- Section gap: 20px
- Card padding: 20px
- Button padding: 12px vertical, 20px horizontal
- Grid gap: 16px

**Mobile:**
- Container padding: 16px horizontal
- Section gap: 16px
- Card padding: 16px
- Button padding: 12px vertical, 16px horizontal (full width preferred)
- Grid gap: 12px

### Component Sizing

**Touch Targets (Minimum):**
- Desktop: 40x40px (mouse precision)
- Tablet: 48x48px (finger touch)
- Mobile: 48x48px (WCAG AAA compliance)

**Navigation Items:**
- Desktop sidebar: 48px height, 16px padding
- Tablet sidebar icon: 56px height, 12px padding
- Mobile bottom tabs: 72px height total, 56px tap area
- Mobile hamburger items: 48px height

**Buttons:**
- Desktop: 44px height minimum
- Tablet: 48px height minimum
- Mobile: 48px height minimum, full width preferred for primary actions

---

## Navigation Structure by Breakpoint

### Desktop Sidebar Navigation (>1024px)

**Grouped Sections (Current - No Changes):**

**Overview:**
- Dashboard
- Analytics

**Operations:**
- Appointments
- Waitlist
- Customers

**Marketing (Owner Only):**
- Campaigns
- Notifications (expandable)
  - Dashboard
  - Templates
  - Settings
  - Log

**Configuration (Owner Only):**
- Services
- Add-ons
- Gallery
- Settings (expandable)
  - Overview
  - Site Content
  - Banners
  - Booking
  - Business Hours
  - Loyalty Program
  - Staff

**Logout** (bottom, separated)

---

### Tablet Sidebar Navigation (768px-1024px)

**Icon-Only with Tooltips:**

Position order (top to bottom):
1. Dashboard (always show tooltip on hover/long-press)
2. Analytics
3. --- (divider) ---
4. Appointments
5. Waitlist
6. Customers
7. --- (divider) ---
8. Campaigns (owner only)
9. Notifications (owner only, shows submenu indicator)
10. --- (divider) ---
11. Services (owner only)
12. Add-ons (owner only)
13. Gallery (owner only)
14. Settings (owner only, shows submenu indicator)
15. --- (divider - bottom) ---
16. Logout

**Submenu Behavior:**
- Tap on Notifications or Settings opens popover to the right
- Popover contains child items with full labels
- Popover: White bg, rounded-xl, shadow-lg, 200px width
- Popover positioning: Right of sidebar, aligned with icon, 8px gap
- Close on: Outside tap, item selection, or ESC key

---

### Mobile Bottom Tab Navigation (<768px)

**5 Tabs (Left to Right):**

1. **Home** (20% width)
   - Icon: LayoutDashboard (24px)
   - Label: "Home" (12px)
   - Destination: /admin/dashboard

2. **Appointments** (20% width)
   - Icon: Calendar (24px)
   - Label: "Appts" (12px, abbreviated to fit)
   - Destination: /admin/appointments

3. **Walk-in** (CENTER, 20% width but visually larger)
   - Icon: UserPlus (28px on elevated circle)
   - Elevated circle: 56px diameter, charcoal bg, white icon
   - Raised 8px above tab bar baseline
   - Label: "Walk-in" (12px, below circle)
   - Action: Opens BookingModal in walk-in mode

4. **Customers** (20% width)
   - Icon: Users (24px)
   - Label: "Customers" (12px)
   - Destination: /admin/customers

5. **More** (20% width)
   - Icon: MoreHorizontal (24px)
   - Label: "More" (12px)
   - Action: Opens hamburger drawer from right

**Active State:**
- Icon color: Charcoal (#434E54)
- Label color: Charcoal (#434E54)
- Top border: 3px solid charcoal
- Background: Very subtle cream tint (#FFFBF7)

**Inactive State:**
- Icon color: Gray (#9CA3AF)
- Label color: Gray (#6B7280)
- No border
- Background: White

---

### Mobile Hamburger Drawer Content (<768px)

**Same as current, triggered by:**
1. Top-left hamburger icon (header)
2. Bottom-right "More" tab (bottom nav)

**Drawer Content (Top to Bottom):**

1. **Header** (56px)
   - "Menu" title (left)
   - Close X button (right, 44x44px target)

2. **User Info Section** (auto height)
   - Avatar (48px circle)
   - Name (16px, semibold)
   - Role badge (14px, "Owner" or "Staff")
   - Divider below

3. **Navigation Items** (scrollable)
   - All sections and items from desktop sidebar
   - Expandable parents (Notifications, Settings)
   - Active state: Full bg fill, white text
   - Touch targets: 48px height minimum

4. **Logout Button** (bottom, 56px)
   - Separated by divider
   - Icon + label
   - Full width

---

## Page-Specific Responsive Patterns

### Dashboard Page

**Desktop (>1024px):**
```
┌──────────────────────────────────────────────────┐
│  Dashboard                                       │
│  Overview message                                │
├──────────────────────────────────────────────────┤
│  [Stat Card 1] [Stat Card 2] [Stat Card 3] [4] │  ← 4-column grid
├──────────────────────────────────────────────────┤
│  [Walk-in Button] [Quick Actions Row]           │
├──────────────────────────────────────────────────┤
│  [Today's Appointments]    [Activity Feed]       │  ← 2-column (60/40 split)
├──────────────────────────────────────────────────┤
│  [Quick Access Grid - 4 columns]                │
└──────────────────────────────────────────────────┘
```

**Tablet (768px-1024px):**
```
┌──────────────────────────────────────────────────┐
│  Dashboard                                       │
├──────────────────────────────────────────────────┤
│  [Stat Card 1] [Stat Card 2]                    │  ← 2-column grid
│  [Stat Card 3] [Stat Card 4]                    │
├──────────────────────────────────────────────────┤
│  [Walk-in Button (Full Width)]                  │
├──────────────────────────────────────────────────┤
│  [Today's Appointments - Full Width]            │  ← Stack vertically
├──────────────────────────────────────────────────┤
│  [Activity Feed - Full Width]                   │
├──────────────────────────────────────────────────┤
│  [Quick Access - 2 columns]                     │
└──────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────────────────────────────────┐
│  Dashboard                                       │
├──────────────────────────────────────────────────┤
│  [Stat Card 1] [Stat Card 2]                    │  ← 2-column grid (compact)
│  [Stat Card 3] [Stat Card 4]                    │
├──────────────────────────────────────────────────┤
│  [Today's Appointments - Card List]             │  ← Simplified cards
├──────────────────────────────────────────────────┤
│  [Activity Feed - Collapsed/Hidden]             │  ← Show only recent 3
├──────────────────────────────────────────────────┤
│  [Quick Access - Single Column Stack]           │  ← 1 column
└──────────────────────────────────────────────────┘
```

**Stat Cards (Mobile Optimization):**
- Reduce padding: 16px (from 24px)
- Icon size: 40px container (from 48px)
- Title font: 12px (from 14px)
- Value font: 24px (from 32px)
- Maintain 2-column grid for 4 metrics

---

### Appointments Page

**Desktop (>1024px):**
```
┌──────────────────────────────────────────────────┐
│  Appointments                         [Import]  │
│  Manage all grooming...               [Create]  │
├──────────────────────────────────────────────────┤
│  [Calendar View] [List View]                    │  ← Toggle buttons
├──────────────────────────────────────────────────┤
│  [Full Calendar OR Table List]                  │
└──────────────────────────────────────────────────┘
```

**Tablet (768px-1024px):**
```
┌──────────────────────────────────────────────────┐
│  Appointments                                    │
│  [Import] [Create] (inline, not stacked)        │
├──────────────────────────────────────────────────┤
│  [Calendar View] [List View]                    │
├──────────────────────────────────────────────────┤
│  [Calendar OR List - Optimized for width]       │
└──────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────────────────────────────────┐
│  Appointments                     [⋮ Menu]       │  ← Menu for Import/Create
├──────────────────────────────────────────────────┤
│  [List View] (force list, hide calendar)        │  ← List only, better UX
├──────────────────────────────────────────────────┤
│  [Card-Based List]                              │
│    [Appointment Card 1]                         │
│    [Appointment Card 2]                         │
│    [Appointment Card 3]                         │
└──────────────────────────────────────────────────┘
```

**Mobile Appointment Card:**
- Single card per appointment
- Show: Time, Customer name, Pet name, Service
- Avatar on left
- Status badge (top right)
- Tap to open detail modal (bottom sheet)
- Swipe actions: Complete, Cancel (optional)

---

### Customers Page

**Desktop (>1024px):**
```
┌──────────────────────────────────────────────────┐
│  [Customers Icon] Customers                      │
│                    View and manage accounts      │
├──────────────────────────────────────────────────┤
│  [Search Bar]            [Filter] [Export]       │
├──────────────────────────────────────────────────┤
│  [Table: Name | Email | Phone | Pets | Actions] │
└──────────────────────────────────────────────────┘
```

**Tablet (768px-1024px):**
```
┌──────────────────────────────────────────────────┐
│  Customers                                       │
├──────────────────────────────────────────────────┤
│  [Search Bar (full width)]                      │
│  [Filter] [Export] (below, inline)              │
├──────────────────────────────────────────────────┤
│  [Table with horizontal scroll]                 │
│  Sticky first column (Name)                     │
└──────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────────────────────────────────┐
│  Customers                            [⋮ Menu]   │
├──────────────────────────────────────────────────┤
│  [Search Bar (full width)]                      │
├──────────────────────────────────────────────────┤
│  [Customer Card 1]                              │  ← Card-based list
│    Avatar | Name                                │
│    Email, Phone                                 │
│    "3 Pets • 12 Appointments"                   │
│  [Customer Card 2]                              │
│  [Customer Card 3]                              │
└──────────────────────────────────────────────────┘
```

---

### Waitlist Page

**Desktop (>1024px):**
```
┌──────────────────────────────────────────────────┐
│  Waitlist Management                             │
│  Manage entries and fill open slots              │
├──────────────────────────────────────────────────┤
│  [Stat Card 1] [Stat Card 2] [Stat Card 3]      │  ← 3-column
├──────────────────────────────────────────────────┤
│  [Filters Row: Service, Date, Status]           │
├──────────────────────────────────────────────────┤
│  [Waitlist Table]                                │
└──────────────────────────────────────────────────┘
```

**Tablet (768px-1024px):**
```
┌──────────────────────────────────────────────────┐
│  Waitlist                                        │
├──────────────────────────────────────────────────┤
│  [Stat Card 1] [Stat Card 2] [Stat Card 3]      │  ← 3-column (smaller)
├──────────────────────────────────────────────────┤
│  [Filters: Stacked or carousel]                 │
├──────────────────────────────────────────────────┤
│  [Table with horizontal scroll]                 │
└──────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────────────────────────────────┐
│  Waitlist                             [⋮ Filter] │
├──────────────────────────────────────────────────┤
│  [Stat Carousel - Swipe]                        │  ← Swipeable stats
├──────────────────────────────────────────────────┤
│  [Waitlist Card 1]                              │  ← Card list
│    Customer, Pet, Service                       │
│    Requested dates                              │
│    [Fill Slot] button                           │
│  [Waitlist Card 2]                              │
└──────────────────────────────────────────────────┘
```

---

## Interaction Design

### Hover States (Desktop/Tablet)

**Sidebar Navigation Items:**
- Default: Transparent background, charcoal text
- Hover: Light cream background (#EAE0D5), charcoal text
- Active: Charcoal background (#434E54), white text, shadow-md
- Transition: All 200ms ease

**Bottom Tab Items (Mobile):**
- No hover (touch device)
- Active: Charcoal icon/text, top border, subtle bg tint
- Inactive: Gray icon/text
- Transition: Color 150ms ease

**Buttons:**
- Default: White bg, charcoal text, subtle border
- Hover: Cream bg (#FFFBF7), charcoal text
- Active/Pressed: Slight scale down (0.98), darker bg
- Primary: Charcoal bg, white text → Darker charcoal on hover
- Transition: All 200ms ease

**Cards:**
- Default: White bg, shadow-sm
- Hover: shadow-md, translateY(-2px)
- Transition: All 200ms ease

---

### Focus States (Keyboard Navigation)

**All Interactive Elements:**
- Focus ring: 2px solid charcoal (#434E54), 2px offset
- Focus ring opacity: 50% (#434E5480)
- Transition: None (instant visibility for accessibility)
- Apply to: Links, buttons, inputs, nav items

**Sidebar Navigation:**
- Focus: Ring around entire item
- Keyboard nav: Arrow keys to move, Enter to select

**Bottom Tabs:**
- Focus: Ring around icon + label
- Keyboard nav: Left/Right arrows, Enter to activate

---

### Loading States

**Page Load:**
- Skeleton screens for content areas
- Sidebar/nav always visible (no skeleton)
- Stats cards: Pulse animation on value area
- Tables/lists: 3-5 skeleton rows

**Infinite Scroll (Lists):**
- Show spinner at bottom
- Load more on scroll to 80% of content height

**Action Feedback:**
- Button: Disabled state + spinner icon
- Toast notification on success/error (top-right desktop, top-center mobile)

---

### Touch Gestures (Mobile/Tablet)

**Swipe Right (Mobile):**
- Action: Open hamburger drawer
- Trigger zone: Left 20px of screen
- Animation: Drawer slides in, overlay fades in

**Swipe Left on Drawer:**
- Action: Close drawer
- Animation: Drawer slides out, overlay fades out

**Pull to Refresh:**
- Pages: Dashboard, Appointments, Customers, Waitlist
- Indicator: Loading spinner at top
- Haptic feedback on trigger (if supported)

**Long Press:**
- Tablet sidebar icons: Show tooltip immediately
- Mobile list items: Show context menu (optional, for advanced actions)

**Swipe Actions on Cards (Mobile - Optional):**
- Swipe left on appointment card: Reveal "Complete" and "Cancel" actions
- Swipe right: Reveal "Edit" action
- Color coding: Green (complete), red (cancel), blue (edit)

---

## Responsive Breakpoints

### Breakpoint Definitions

```css
/* Mobile */
@media (max-width: 767px) {
  /* Bottom tab nav, hamburger drawer, single column */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Compact icon sidebar, 2-column grids */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Full sidebar, multi-column grids */
}

/* Large Desktop */
@media (min-width: 1280px) {
  /* Max-width containers, generous spacing */
}
```

### Layout Behavior at Breakpoints

**767px → 768px (Mobile to Tablet):**
- Bottom tab nav → Hidden
- Hamburger drawer → Compact sidebar (icon-only)
- Header height: 56px → Hidden (sidebar replaces)
- Main padding-left: 0 → 72px (sidebar width)
- Grid columns: 1-2 → 2-3
- Font sizes: Increase slightly (see Typography section)

**1023px → 1024px (Tablet to Desktop):**
- Compact sidebar (72px) → Full sidebar (256px)
- Icon tooltips → Full text labels
- Main padding-left: 72px → 256px
- Grid columns: 2-3 → 3-4
- Font sizes: Increase slightly

---

## Space Utilization Strategies

### Eliminating Dead Space

**Tablet (768px-1024px):**

**Issue**: Current hamburger menu wastes horizontal space
**Solution**: Compact icon sidebar (72px) always visible

**Issue**: Content stretches awkwardly at 800-1000px width
**Solution**: Optimize grid columns (2-col for stats, 2-col for quick access)

**Issue**: Table overflow hidden or poorly scrollable
**Solution**: Horizontal scroll with sticky first column

**Issue**: Action buttons overflow on narrow tablets
**Solution**: Stack buttons vertically when space <500px width

---

**Mobile (<768px):**

**Issue**: Page header with multiple actions overflows
**Solution**:
- Primary action: Full-width button below header
- Secondary actions: Overflow menu (⋮) in top-right

**Issue**: Bottom padding insufficient for fixed tab bar
**Solution**: Main content bottom padding = tab bar height + 16px (88px total)

**Issue**: Stats grid wastes space with 1-column
**Solution**: Keep 2-column grid for 4 metrics, reduce card padding

**Issue**: Form inputs and modals too tall for small screens
**Solution**:
- Use bottom sheet modals (slide up from bottom)
- Forms: Auto-scroll to focused input
- Date pickers: Native mobile pickers

---

### Information Density

**Desktop: High Density**
- Tables: 8-10 rows visible without scroll
- Cards: 24px padding, comfortable spacing
- Stats: Large numbers (32px), clear hierarchy

**Tablet: Medium-High Density**
- Tables: 6-8 rows visible, horizontal scroll
- Cards: 20px padding, balanced spacing
- Stats: Medium numbers (28px), clear hierarchy

**Mobile: Optimized Density**
- Cards replace tables: 3-4 cards visible per scroll
- Cards: 16px padding, efficient spacing
- Stats: Compact numbers (24px), 2-column grid
- Prioritize critical info: Hide secondary details in collapsed state

---

## Accessibility Requirements

### Keyboard Navigation

**Desktop/Tablet:**
- Tab order: Logo → Nav items (top to bottom) → Main content → Logout
- Arrow keys: Navigate within sidebar sections
- Enter/Space: Activate nav item or button
- Escape: Close modals, popovers, dropdowns
- Focus visible: 2px ring on all interactive elements

**Mobile:**
- Tab order: Hamburger → User avatar → Main content → Bottom tabs (left to right)
- Focus visible: Same as desktop
- Bottom tabs: Left/Right arrows to move, Enter to activate

---

### Screen Reader Support

**Sidebar Navigation:**
- ARIA labels: "Main navigation", "Dashboard link", "Settings menu collapsed"
- Announce state changes: "Settings menu expanded"
- Skip link: "Skip to main content" (before sidebar)

**Bottom Tab Navigation:**
- ARIA role: "navigation"
- ARIA labels: "Primary navigation tabs"
- Current page: aria-current="page"
- Walk-in button: "Create walk-in appointment"

**Dynamic Content:**
- Live regions: ARIA live="polite" for stats updates
- Toast notifications: ARIA role="alert"
- Modal dialogs: Focus trap, ARIA modal="true"

**Images and Icons:**
- Alt text: All decorative icons have aria-hidden="true"
- Functional icons: ARIA labels (e.g., "Close menu")

---

### Color Contrast

**WCAG AA Compliance (4.5:1 minimum):**
- Charcoal text (#434E54) on white: 9.5:1 ✓
- Charcoal text on cream (#F8EEE5): 8.2:1 ✓
- Gray text (#6B7280) on white: 4.6:1 ✓
- White text on charcoal: 9.5:1 ✓

**Interactive Elements:**
- Active links: Underline + color change
- Disabled buttons: 50% opacity, cursor not-allowed
- Error states: Red border (#EF4444) + icon + text

---

### Touch Target Sizes

**WCAG AAA: 48x48px minimum (Level AAA)**

**Implementation:**
- Mobile bottom tabs: 72px height (full tap area)
- Mobile hamburger icon: 44x44px (44x56px including padding)
- Tablet sidebar icons: 56px height
- Desktop sidebar items: 48px height
- Buttons: 48px height on mobile, 44px on desktop
- Form inputs: 48px height on mobile, 44px on desktop

**Spacing Between Targets:**
- Minimum 8px gap between adjacent touch targets
- Mobile buttons: Stack vertically with 12px gap if multiple

---

## Animation and Transitions

### Sidebar Transitions

**Desktop Collapse/Expand:**
- Width: 256px → 80px (and reverse)
- Duration: 300ms
- Easing: ease-in-out
- Content: Fade out text (200ms), scale icons (300ms)

**Mobile Drawer Slide-In:**
- Transform: translateX(100%) → translateX(0)
- Duration: 300ms
- Easing: ease-out
- Overlay: Opacity 0 → 0.2 (200ms)

---

### Bottom Tab Animations

**Tab Switch:**
- Active indicator line: Slide from old tab to new (200ms, ease-in-out)
- Icon color: Fade 150ms
- Walk-in elevated button: No animation on tab switch

**Walk-in Button Press:**
- Scale: 1 → 0.95 (100ms) → 1 (100ms)
- Haptic feedback (if supported)

---

### Page Transitions

**Navigation:**
- Fade out: 150ms
- Fade in: 200ms (staggered 50ms after fade out)
- No slide animations (can cause motion sickness)

**Modal/Bottom Sheet:**
- Mobile bottom sheet: Slide up from bottom (300ms, ease-out)
- Desktop modal: Fade in + scale (0.95 → 1, 200ms)
- Overlay: Fade in (200ms)

---

### Loading Animations

**Skeleton Screens:**
- Pulse animation: 1.5s duration, infinite
- Gradient: Light gray → Lighter gray → Light gray
- Easing: ease-in-out

**Spinners:**
- Rotation: 1s duration, infinite, linear
- Size: 24px (small), 40px (medium), 64px (large)
- Color: Charcoal (#434E54)

---

### Micro-interactions

**Button Press:**
- Scale: 1 → 0.98 (100ms) → 1 (100ms on release)
- Shadow: Increase on hover (200ms)

**Card Hover (Desktop/Tablet):**
- Transform: translateY(0) → translateY(-2px) (200ms)
- Shadow: sm → md (200ms)

**Icon Animations:**
- Hamburger to X: Rotate and morph (300ms)
- Chevron expand/collapse: Rotate 0° → 180° (200ms)

---

## Assets and Resources

### Icons (Lucide React)

**Navigation Icons:**
- LayoutDashboard, BarChart3, Calendar, Clock, Users
- Megaphone, Bell, FileText, List, Scissors
- Plus, Images, Settings, Globe, Tag, BookOpen
- Building2, Award, UserCog, LogOut

**Action Icons:**
- Menu (hamburger), X (close), ChevronLeft, ChevronRight
- ChevronDown, ChevronUp, MoreHorizontal, UserPlus
- Upload, Download, Filter, Search

**Status Icons:**
- CheckCircle, AlertCircle, Info, XCircle
- DollarSign, TrendingUp, TrendingDown

**Size Guidelines:**
- Desktop sidebar: 20px (w-5 h-5)
- Tablet sidebar: 24px (w-6 h-6)
- Mobile bottom tabs: 24px (w-6 h-6)
- Mobile walk-in button: 28px (w-7 h-7)

---

### Illustrations/Graphics

**Empty States:**
- No appointments: Calendar with checkmark illustration
- No customers: Group of people illustration
- No waitlist: Clock with hourglass illustration
- Style: Line art, charcoal color, simple shapes

**Logo:**
- Desktop sidebar: "P" in circle (40px) + "Puppy Day" text + "Admin Panel" subtitle
- Tablet sidebar: "P" in circle only (48px, centered)
- Mobile header: "P" in circle (40px) + "Puppy Day" text (no subtitle)
- Mobile bottom tabs: No logo

---

## Implementation Notes

### Component Structure

**Layout Components:**
```
/components/admin/
  ├── layout/
  │   ├── AdminLayoutWrapper.tsx         (Main wrapper, breakpoint detection)
  │   ├── DesktopSidebar.tsx            (Current AdminSidebar, >1024px)
  │   ├── TabletSidebar.tsx             (NEW, icon-only, 768-1023px)
  │   ├── MobileHeader.tsx              (NEW, top header, <768px)
  │   ├── MobileBottomTabs.tsx          (NEW, bottom nav, <768px)
  │   ├── MobileDrawer.tsx              (Enhanced AdminMobileNav)
  │   ├── UserAvatar.tsx                (Reusable user avatar)
  │   └── NavPopover.tsx                (Submenu popover for tablet)
```

**Responsive Utilities:**
```
/lib/utils/
  ├── breakpoints.ts                    (Breakpoint hooks and utilities)
  ├── responsive.ts                     (Responsive helper functions)
```

---

### State Management

**Admin Store (Zustand):**
```typescript
interface AdminStore {
  // Existing
  isSidebarCollapsed: boolean;
  appointmentsView: 'calendar' | 'list';

  // NEW
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  isMobileDrawerOpen: boolean;
  activeBottomTab: 'home' | 'appointments' | 'customers';

  // Actions
  toggleSidebar: () => void;
  setAppointmentsView: (view: 'calendar' | 'list') => void;
  setBreakpoint: (bp: string) => void;
  toggleMobileDrawer: () => void;
  setActiveBottomTab: (tab: string) => void;
}
```

---

### Tailwind Configuration

**Breakpoint Overrides:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Keep default
      'md': '768px',   // Tablet start
      'lg': '1024px',  // Desktop start
      'xl': '1280px',  // Large desktop
    },
  },
}
```

**Custom Utilities:**
```css
/* Bottom tab bar safe area */
.safe-bottom {
  padding-bottom: max(88px, env(safe-area-inset-bottom) + 88px);
}

/* Tablet sidebar offset */
.tablet-offset {
  @media (min-width: 768px) and (max-width: 1023px) {
    padding-left: 72px;
  }
}
```

---

## Testing Requirements

### Responsive Testing

**Breakpoints to Test:**
- 375px (iPhone SE)
- 414px (iPhone Pro Max)
- 768px (iPad Mini portrait)
- 1024px (iPad Pro portrait)
- 1280px (Desktop)
- 1920px (Large desktop)

**Devices:**
- Mobile: iOS Safari, Chrome Android
- Tablet: iPad Safari, Android Chrome
- Desktop: Chrome, Firefox, Safari, Edge

---

### Accessibility Testing

**Tools:**
- WAVE (browser extension)
- axe DevTools (Chrome extension)
- Lighthouse (Chrome DevTools)
- NVDA/JAWS (screen readers)

**Checklist:**
- [ ] All images have alt text or aria-hidden
- [ ] Focus visible on all interactive elements
- [ ] Keyboard navigation works without mouse
- [ ] Color contrast passes WCAG AA (4.5:1)
- [ ] Touch targets ≥48x48px on mobile
- [ ] Screen reader announces page changes
- [ ] Form errors announced to screen readers
- [ ] Modals trap focus correctly

---

### Performance Testing

**Metrics:**
- Largest Contentful Paint (LCP): <2.5s
- First Input Delay (FID): <100ms
- Cumulative Layout Shift (CLS): <0.1
- Time to Interactive (TTI): <3.5s

**Optimization:**
- Lazy load images and heavy components
- Code splitting by route
- Minimize layout shifts (reserve space for dynamic content)
- Optimize animations (use transform/opacity only)

---

## Migration Strategy

### Phase 1: Foundation (Week 1)
- Create new layout components (TabletSidebar, MobileBottomTabs, MobileHeader)
- Update AdminLayoutWrapper to detect breakpoints
- Implement state management for new nav patterns
- Test on desktop (ensure no regressions)

### Phase 2: Tablet Optimization (Week 2)
- Implement compact icon sidebar
- Add popover submenus
- Optimize page layouts for 768-1023px
- Test grid column changes
- Test table horizontal scroll

### Phase 3: Mobile Bottom Tabs (Week 3)
- Build bottom tab navigation component
- Integrate with routing
- Add walk-in elevated button
- Test touch targets and accessibility
- Implement swipe gestures

### Phase 4: Page-Specific Optimization (Week 4)
- Optimize dashboard for mobile/tablet
- Convert tables to card lists on mobile
- Implement bottom sheet modals
- Add pull-to-refresh
- Test all pages across breakpoints

### Phase 5: Polish & Accessibility (Week 5)
- Accessibility audit and fixes
- Animation tuning
- Performance optimization
- Cross-browser testing
- Final QA

---

## Success Metrics

### User Experience
- [ ] Navigation accessible within 1 tap on mobile (bottom tabs)
- [ ] Critical actions (walk-in, create appointment) ≤2 taps
- [ ] No horizontal scroll on content (only tables)
- [ ] Touch targets meet WCAG AAA (48x48px)
- [ ] Page load <3s on 3G network

### Design Quality
- [ ] Consistent spacing across all breakpoints
- [ ] No dead space on tablet (efficient use of 768-1023px)
- [ ] Professional appearance maintained on all devices
- [ ] Animations smooth (60fps)
- [ ] Color contrast passes WCAG AA

### Business Impact
- [ ] Reduced time to create walk-in appointments (target: <30s)
- [ ] Increased mobile usage (track admin logins by device)
- [ ] Reduced navigation friction (track clicks to key pages)
- [ ] Positive user feedback (owner and staff satisfaction)

---

## Next Steps

**Design Specification Complete** ✓

**Handoff to Implementation:**

This design specification is ready for conversion into a DaisyUI + Tailwind implementation plan. Use `@agent-daisyui-expert` to:

1. Review this design spec
2. Create component implementation plans
3. Map design patterns to DaisyUI components
4. Write the actual React/TypeScript code
5. Implement responsive utilities and state management

**Files to Reference During Implementation:**
- Current layout: `src/app/admin/layout.tsx`
- Desktop sidebar: `src/components/admin/AdminSidebar.tsx`
- Mobile nav: `src/components/admin/AdminMobileNav.tsx`
- Admin store: `src/stores/admin-store.ts`
- Design system: `docs/architecture/ARCHITECTURE.md` (Global Design System section)

---

## Appendix: Design Decisions

### Why Bottom Tabs on Mobile?
- **Thumb-friendly**: Easy to reach with one hand
- **Familiar pattern**: Used by Instagram, Twitter, iOS apps
- **Always visible**: No need to open hamburger menu
- **Quick navigation**: 1 tap to key sections
- **Walk-in emphasis**: Center elevated button highlights critical action

### Why Icon-Only Sidebar on Tablet?
- **Space efficiency**: 72px vs 256px saves 184px for content
- **Always visible**: No hamburger needed, faster navigation
- **Familiar pattern**: Similar to macOS dock, Windows taskbar
- **Touch-friendly**: Larger icons, easier to tap
- **Scalable**: Works well on 768-1023px range

### Why No Calendar View on Mobile?
- **Poor UX**: Month calendar too small on mobile screens
- **List superior**: Easier to scan, scroll, and tap
- **Card format**: Better info density for appointments
- **Industry standard**: Most mobile calendar apps default to list

### Why Pull-to-Refresh?
- **Mobile expectation**: Standard gesture on mobile apps
- **Useful context**: Groomers check schedule throughout day
- **No manual button**: Saves space, feels native
- **Feedback**: Loading indicator provides clear feedback

---

**Document Version**: 1.0
**Created**: 2025-12-27
**Design Authority**: frontend-expert
**Status**: Ready for Implementation
**Next Agent**: daisyui-expert
