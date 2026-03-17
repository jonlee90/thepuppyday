---
name: design-system
description: The Puppy Day visual design system — colors, typography, spacing, shadows, and dog-themed UI patterns. Auto-invoke when creating or modifying UI components, layouts, or styling. Triggers on tasks involving colors, fonts, spacing, visual design, or brand consistency.
metadata:
  author: thepuppyday
  version: "1.0.0"
---

# The Puppy Day Design System

Complete visual design reference for maintaining brand consistency across the application.

## When to Apply

Reference this design system when:
- Creating new UI components or pages
- Choosing colors, fonts, or spacing values
- Implementing animations or transitions
- Adding dog-themed decorative elements
- Reviewing UI for brand consistency

## Design Philosophy

**Clean & Elegant Professional** — Refined, warm, and trustworthy. A professional pet care service that emphasizes cleanliness, expertise, and customer care. NOT childish or over-the-top playful.

## Color Palette

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#F8EEE5` | Page background (warm cream) |
| `primary` | `#434E54` | Buttons, primary text (charcoal) |
| `primaryHover` | `#363F44` | Hover states |
| `secondary` | `#EAE0D5` | Secondary elements (lighter cream) |
| `accent` | `#4ECDC4` | Playful accents (sky blue) |

### Text Colors
| Token | Hex | CSS Class |
|-------|-----|-----------|
| `textPrimary` | `#434E54` | `text-base-content` |
| `textSecondary` | `#6B7280` | `text-gray-500` |

### Card Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `cardBackground` | `#FFFFFF` | Standard cards |
| `cardAlt` | `#FFFBF7` | Alternate warm white |

### Utility Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `info` | `#74B9FF` | Information states |
| `success` | `#6BCB77` | Success states |
| `warning` | `#FFB347` | Warning states |
| `error` | `#FF6B6B` | Error states |

## DaisyUI Theme Variables

Located in `src/app/globals.css`:
```css
[data-theme="light"] {
  --p: 67 78 84;           /* Primary: Charcoal */
  --pf: 54 63 68;          /* Primary Focus */
  --s: 234 224 213;        /* Secondary: Cream */
  --a: 78 205 196;         /* Accent: Sky Blue */
  --n: 67 78 84;           /* Neutral: Charcoal */
  --b1: 248 238 229;       /* Base: Warm cream */
  --b2: 234 224 213;       /* Base-200 */
  --b3: 220 210 199;       /* Base-300 */
  --rounded-box: 1rem;
  --rounded-btn: 0.5rem;
}
```

Use DaisyUI semantic classes (e.g., `bg-primary`, `text-base-content`, `bg-base-200`) rather than raw hex values.

## Typography

| Element | Font | Weight | CSS |
|---------|------|--------|-----|
| Headings (h1-h6) | Nunito | 700 (bold) | `font-heading` |
| Body text | Inter | 400 (regular) | `font-body` |
| Fallback | system-ui, -apple-system, sans-serif | — | — |

## Shadows

Use soft, blurred shadows. NEVER use harsh/dark shadows.

| Class | Usage |
|-------|-------|
| `shadow-sm` | Cards, subtle elevation |
| `shadow-md` | Interactive elements, hover states |
| `shadow-lg` | Modals, popovers, dropdowns |

## Border Radius

| Class | Size | Usage |
|-------|------|-------|
| `rounded-lg` | 0.5rem | Default for cards, inputs |
| `rounded-xl` | 0.75rem | Larger containers, sections |
| `rounded-full` | 50% | Pills, badges, avatars |

## Borders

Minimal borders. Prefer shadow over border for elevation.

```
border-0        // Default: no border
border          // When needed: 1px
border-gray-200 // Light gray when border is required
```

## Spacing

Use Tailwind spacing scale consistently:
```
p-4, p-6, p-8       // Padding
gap-4, gap-6         // Flex/Grid gaps
space-y-4, space-x-4 // Stack spacing
```

## Transitions

```
transition-all duration-200 ease-in-out   // Button hover
transition-opacity duration-300            // Fade effects
```

## Dog-Themed UI Elements

Complement the professional aesthetic with playful touches:

| Element | Usage | Implementation |
|---------|-------|----------------|
| Paw prints | Success/loading states | Lucide `PawPrint` icon or custom SVG |
| Dog silhouettes | Empty states | Illustration or icon |
| Bone icons | Loyalty/rewards features | Lucide `Bone` icon |
| Bouncy animations | Confirmations | Framer Motion spring animation |

**Tone**: Warm, inviting, joyful — NOT childish. Dog elements should be subtle accents, not dominant.

## Icons

Use **Lucide React** exclusively. Import from `lucide-react`:
```typescript
import { PawPrint, Calendar, User, Settings } from 'lucide-react';
```

## Admin-Specific

Use `AdminButton` component (`src/components/admin/ui/AdminButton.tsx`) for all admin panel buttons. It provides:
- Consistent styling with the design system
- Built-in loading state with `isLoading` prop
- `aria-busy` accessibility support
- Variant support: `primary`, `secondary`, `danger`, `ghost`

## Reference

Full design system documentation: `docs/architecture/ARCHITECTURE.md` (Global Design System section, lines 190-310)
