# The Puppy Day Design System

Design system specifications for The Puppy Day dog grooming SaaS application.

---

## Core Design Principles

### Brand Aesthetic: "Clean & Elegant Professional"

- **Professional yet Warm**: Trustworthy and approachable, never corporate or overly casual
- **Clean & Refined**: Intentional simplicity with purposeful whitespace
- **Subtle Dog Theme**: Elegant nods to dog grooming without being overly playful
- **Trust & Quality**: Every design decision communicates expertise and care

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Charcoal | `#434E54` | Primary buttons, headings, primary text |
| Charcoal Dark | `#363F44` | Hover states, focus rings |
| Charcoal Light | `#5A6670` | Secondary accents |

### Background Colors

| Name | Hex | Usage |
|------|-----|-------|
| Warm Cream | `#F8EEE5` | Main background |
| Off-White | `#FFFBF7` | Card backgrounds, elevated surfaces |
| Lighter Cream | `#EAE0D5` | Secondary backgrounds, icon containers |
| Cream Hover | `#DCD2C7` | Hover states on cream surfaces |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| White | `#FFFFFF` | Cards, inputs, elevated surfaces |
| Gray 100 | `#F5F5F5` | Subtle backgrounds |
| Gray 200 | `#E5E5E5` | Borders, dividers |
| Gray 400 | `#9CA3AF` | Muted text, placeholders |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#434E54` | Headings, body text, labels |
| Secondary | `#6B7280` | Descriptions, secondary info |
| Muted | `#9CA3AF` | Placeholders, disabled text |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#6BCB77` | Success states, confirmations |
| Warning | `#FFB347` | Warnings, pending states |
| Error | `#EF4444` | Errors, destructive actions |
| Info | `#74B9FF` | Information, links |

---

## Typography Scale

### Font Family
- **Primary**: System font stack (Inter, -apple-system, sans-serif)
- **Monospace**: For code snippets only

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 48-64px | Bold | 1.1-1.2 | Hero headings |
| H1 | 36-48px | Semibold-Bold | 1.2 | Page titles |
| H2 | 28-36px | Semibold | 1.3 | Section headings |
| H3 | 24-28px | Semibold | 1.4 | Card titles |
| H4 | 20-24px | Medium-Semibold | 1.4 | Subsections |
| Body Large | 18-20px | Regular | 1.6-1.7 | Hero body text |
| Body | 16px | Regular | 1.5-1.7 | Default body text |
| Body Small | 14px | Regular | 1.5 | Secondary text |
| Caption | 12-13px | Regular-Medium | 1.4 | Labels, metadata |

### Tailwind Classes

```css
/* Display */
text-5xl font-bold leading-tight

/* H1 */
text-4xl font-semibold

/* H2 */
text-3xl font-semibold

/* H3 */
text-2xl font-semibold

/* Body */
text-base leading-relaxed

/* Small */
text-sm
```

---

## Spacing System

| Token | Size | Usage |
|-------|------|-------|
| XXS | 4px (`gap-1`) | Tight spacing, icon gaps |
| XS | 8px (`gap-2`, `p-2`) | Small gaps, compact layouts |
| SM | 12px (`gap-3`, `p-3`) | Form field spacing |
| MD | 16px (`gap-4`, `p-4`) | Default spacing unit |
| LG | 24px (`gap-6`, `p-6`) | Section spacing |
| XL | 32px (`gap-8`, `p-8`) | Large gaps between sections |
| 2XL | 48px (`gap-12`, `py-12`) | Major section breaks |
| 3XL | 64px (`gap-16`, `py-16`) | Hero section padding |

---

## Visual Elements

### Shadows (Soft & Blurred)

| Level | Tailwind | Usage |
|-------|----------|-------|
| None | `shadow-none` | Flat elements |
| SM | `shadow-sm` | Cards at rest, subtle elevation |
| MD | `shadow-md` | Cards on hover, dropdowns |
| LG | `shadow-lg` | Modals, tooltips, overlays |

**Important**: NO solid offset shadows like `shadow-[4px_4px_0px...]`

### Borders

| Type | Style | Usage |
|------|-------|-------|
| Default | 1px `border-gray-200` | Input borders, dividers |
| Focus | 2px primary at 20% | Focus rings |
| Light | 1px `border-[#E5E5E5]` | Subtle separators |

**Important**: Avoid bold borders (2px+), heavy outlines

### Corner Radius

| Size | Tailwind | Usage |
|------|----------|-------|
| SM | `rounded-lg` (8px) | Badges, small elements |
| MD | `rounded-xl` (12px) | Buttons, inputs |
| LG | `rounded-2xl` (16px) | Cards, panels |
| XL | `rounded-3xl` (20px) | Large cards, modals |
| Full | `rounded-full` | Avatars, icon buttons |

---

## Component Patterns

### Buttons

**States**: Default, Hover, Active, Disabled, Loading

**Sizes**:
- Small: `py-2 px-4` (32px height)
- Medium: `py-2.5 px-5` (40px height)
- Large: `py-3 px-6` (48px height)

**Variants**:
- Primary: Filled charcoal, white text
- Secondary: Outline or cream background
- Ghost: Text only, subtle hover

**Transitions**: 200ms ease for color changes

### Cards

- **Padding**: 24px desktop, 16px mobile
- **Background**: White (`#FFFFFF`) or off-white (`#FFFBF7`)
- **Shadow**: `shadow-md` at rest → `shadow-lg` on hover
- **Corner Radius**: `rounded-xl` or `rounded-2xl`
- **Transition**: 200-300ms ease for elevation

### Forms

- **Label**: Above input, clear hierarchy
- **Input Height**: 44px minimum (touch-friendly)
- **Border**: 1px `#E5E5E5`, 2px primary on focus
- **Error**: Red border + icon + helper text below
- **Success**: Green border + checkmark

### Navigation

- **Active State**: Background change or border accent
- **Hover**: Subtle background shift
- **Mobile**: Bottom tab bar or hamburger menu
- **Desktop**: Horizontal with dropdowns

---

## Visual Anti-Patterns (AVOID)

- Bold black borders (2px+ borders)
- Solid offset shadows (`shadow-[4px_4px_0px...]`)
- Chunky/heavy elements with excessive padding
- Bright, aggressive colors (neon)
- Extra-bold typography (font-black, font-extrabold)
- Overly playful elements (excessive animations, bouncy effects)
- Generic Bootstrap/Material patterns without customization

---

## Dog Grooming Theme Elements

### Visual Motifs

| Element | Implementation |
|---------|----------------|
| Icons | Lucide React only - clean, consistent stroke weight |
| Logo | Simple line-art dog silhouette |
| Photography | High-quality dog photos when applicable |
| Organic Shapes | Subtle blob shapes in hero sections |
| Paw Accents | Very subtle, decorative only |
| Grooming Tools | Scissors, brushes as subtle visual elements |

### Icon Container Pattern

```tsx
<div className="p-2.5 bg-[#EAE0D5] rounded-lg">
  <Scissors className="w-5 h-5 text-[#434E54]" />
</div>
```

### Decorative Blob

```tsx
<div className="absolute -z-10 top-0 right-0 w-72 h-72 bg-[#EAE0D5] rounded-full blur-3xl opacity-50" />
```

---

## Tone of Voice in UI Copy

### Do

- "Book Your Appointment" (professional)
- "Professional care for your pet" (trustworthy)
- "Schedule Now" (clean CTA)
- "Your appointment has been confirmed" (clear)

### Don't

- "Let's Get Started!" (too casual)
- "We're the best!" (too boastful)
- "Awesome! You're all set!" (too casual)
- "Click Here" (too generic)

---

## Micro-Interactions

### Hover Transitions

```css
/* Card elevation */
transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5

/* Button color */
transition-colors duration-200 hover:bg-[#363F44]

/* Opacity fade */
transition-opacity duration-200 hover:opacity-80
```

### Loading States

- Spinner: DaisyUI `loading-spinner`
- Skeleton: Pulsing cream rectangles
- Button: Disabled + spinner + "Loading..." text

### Fade Animations

- Modal: opacity 0→1, scale 0.95→1, 200ms
- Toast: slide up + fade in
- Timing: ease-out for natural feel

### Button Feedback

- Press: `active:scale-[0.98]`
- Loading: spinner + disabled
- Success: brief color change

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

- **Color Contrast**: 4.5:1 minimum for text
- **Focus Visible**: `focus-visible:ring-2 focus-visible:ring-[#434E54]`
- **Touch Targets**: 44x44px minimum
- **Semantic HTML**: `<button>`, `<nav>`, `<main>`, `<article>`
- **ARIA Labels**: For icon-only buttons
- **Keyboard Nav**: All interactive elements focusable

### Focus States

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-[#434E54]
focus-visible:ring-offset-2
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked |
| Tablet | 640-1024px | 2 columns, side-by-side |
| Desktop | > 1024px | 3 columns, max-width container |

### Pattern

```css
/* Mobile first */
grid-cols-1

/* Tablet */
md:grid-cols-2

/* Desktop */
lg:grid-cols-3
```

---

## Quick Reference

### Common Class Combinations

```tsx
// Primary button
"btn btn-primary bg-[#434E54] hover:bg-[#363F44] border-none"

// Card
"card bg-white shadow-md hover:shadow-lg transition-all duration-200"

// Input
"input input-bordered border-[#E5E5E5] focus:border-[#434E54]"

// Icon container
"p-2.5 bg-[#EAE0D5] rounded-lg"

// Section heading
"text-2xl font-semibold text-[#434E54]"

// Body text
"text-[#6B7280] text-sm leading-relaxed"
```
