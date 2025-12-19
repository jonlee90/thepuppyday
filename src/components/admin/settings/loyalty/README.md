# Loyalty Settings Components

This directory contains components for managing The Puppy Day's loyalty program settings.

## Components

### PunchCardConfig

Master configuration component for the loyalty punch card program.

**Location:** `./PunchCardConfig.tsx`

**Features:**
- Enable/disable toggle with confirmation
- Punch threshold selector (5-20)
- Real-time visual preview
- Statistics dashboard
- API integration

**Usage:**
```tsx
import { PunchCardConfig } from '@/components/admin/settings/loyalty';

export default function LoyaltyPage() {
  return <PunchCardConfig />;
}
```

**API Endpoints:**
- `GET /api/admin/settings/loyalty` - Fetch settings
- `PUT /api/admin/settings/loyalty` - Update settings

**Props:** None (fully self-contained)

**State Management:**
- Fetches settings on mount
- Local state for threshold preview
- Server state for saved settings
- Optimistic UI updates

## Design System

All components follow The Puppy Day's "Clean & Elegant Professional" design system:

- **Colors:** Warm cream backgrounds (#F8EEE5), charcoal primary (#434E54)
- **Shadows:** Soft, blurred shadows
- **Corners:** Gentle rounded corners (rounded-lg, rounded-xl)
- **Typography:** Professional, readable hierarchy
- **Animations:** Subtle Framer Motion transitions

## File Structure

```
loyalty/
├── index.ts              # Component exports
├── PunchCardConfig.tsx   # Main configuration component
└── README.md            # This file
```

## Future Components

These components will be added as part of Phase 9:

- **EarningRulesConfig** (Task 0194)
  - Configure qualifying services
  - Set minimum spend requirements
  - First-visit bonus settings

- **RedemptionRulesConfig** (Task 0195)
  - Eligible services for redemption
  - Expiration settings
  - Maximum value limits

- **ReferralProgramConfig** (Task 0196)
  - Enable/disable referral program
  - Referrer bonus punches
  - Referee bonus punches

## Testing

Run component tests:
```bash
npm test -- PunchCardConfig
```

View component demo:
```bash
npm run dev
# Visit: /admin/settings/loyalty/punch-card-demo
```

## Related Documentation

- **Implementation Summary:** `docs/specs/phase-9/task-0193-implementation-summary.md`
- **Visual Guide:** `docs/specs/phase-9/task-0193-visual-guide.md`
- **API Documentation:** `src/app/api/admin/settings/loyalty/route.ts`
- **Type Definitions:** `src/types/loyalty.ts`

## Dependencies

- React 18+
- Framer Motion (animations)
- Lucide React (icons)
- DaisyUI (base components)
- Tailwind CSS (styling)

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

All components are built with accessibility in mind:
- Keyboard navigation support
- Screen reader friendly
- ARIA labels where appropriate
- Color contrast meets WCAG AA
- Focus indicators on interactive elements
