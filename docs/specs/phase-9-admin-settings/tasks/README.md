# Phase 9 Tasks - Implementation Guide

## Overview

This directory contains individual task files for Phase 9: Admin Settings & Content Management implementation.

**Task Range**: 0155-0220

## Task Organization

### Phase 9.1: Settings Dashboard & Site Content (0155-0168)
- 0155: Database migrations for settings tables
- 0156: TypeScript types for settings entities
- 0157: Settings dashboard page structure
- 0158: Settings dashboard navigation cards
- 0159: Site content API routes
- 0160: Hero section editor component
- 0161: Hero image upload with Supabase Storage
- 0162: SEO settings editor component
- 0163: SEO preview component (Google search result)
- 0164: Business info editor component
- 0165: Business info validation
- 0166: Site content form patterns (unsaved changes, validation)
- 0167: Audit logging for settings changes
- 0168: Site content integration with marketing pages

### Phase 9.2: Promo Banner Manager (0169-0179)
- 0169: Banner API routes (GET, POST)
- 0170: Banner individual API routes (GET, PUT, DELETE)
- 0171: Banner reorder API route
- 0172: Banner image upload
- 0173: Banner list component with status badges
- 0174: Banner drag-drop reordering
- 0175: Banner editor modal (create/edit)
- 0176: Banner scheduling with date pickers
- 0177: Banner click tracking endpoint
- 0178: Banner analytics API and component
- 0179: Banner integration with public site

### Phase 9.3: Booking Settings (0180-0191)
- 0180: Booking settings API routes
- 0181: Advance booking window settings component
- 0182: Cancellation policy settings component
- 0183: Buffer time settings component
- 0184: Business hours editor enhancement
- 0185: Blocked dates API routes
- 0186: Blocked dates manager component
- 0187: Blocked dates calendar visualization
- 0188: Recurring blocked days configuration
- 0189: Booking settings validation
- 0190: Integration with availability API
- 0191: Booking settings page assembly

### Phase 9.4: Loyalty Program Settings (0192-0201)
- 0192: Loyalty settings API routes
- 0193: Punch card configuration component
- 0194: Earning rules editor component
- 0195: Earning rules API routes
- 0196: Redemption rules editor component
- 0197: Redemption rules API routes
- 0198: Referral program settings component
- 0199: Referral codes table and API
- 0200: Loyalty settings page assembly
- 0201: Integration with existing loyalty system

### Phase 9.5: Staff Management (0202-0213)
- 0202: Staff commissions table migration
- 0203: Staff management API routes
- 0204: Staff directory component
- 0205: Staff form component (create/edit)
- 0206: Staff detail view component
- 0207: Commission settings API routes
- 0208: Commission settings component
- 0209: Earnings report API
- 0210: Earnings report component
- 0211: Appointment assignment enhancement
- 0212: Staff management page assembly
- 0213: Groomer filtering in calendar

### Phase 9.6: Integration & Testing (0214-0220)
- 0214: Integration with booking flow
- 0215: Integration with public marketing site
- 0216: Unit tests for validation logic
- 0217: Unit tests for settings services
- 0218: Integration tests for API endpoints
- 0219: E2E tests for critical settings flows
- 0220: Documentation and final polish

## Implementation Guidelines

1. **Sequential Implementation**: Tasks are numbered to suggest implementation order
2. **Dependencies**: Foundation tasks (0155-0156) should be completed first
3. **Phase Dependencies**: Each phase builds on the previous
4. **Testing**: Each task includes acceptance criteria and testing requirements
5. **Documentation**: Reference requirements from `docs/specs/phase-9-admin-settings/requirements.md` and design from `docs/specs/phase-9-admin-settings/design.md`

## Using with /kc:impl

To implement a specific task:

```bash
/kc:impl 0155
```

This will read the task file and implement it according to the acceptance criteria.

## Complexity Distribution

- **Small**: 28 tasks
- **Medium**: 30 tasks
- **Large**: 8 tasks

**Total**: 66 tasks

## Estimated Duration

- Phase 9.1: 3-4 days
- Phase 9.2: 3-4 days
- Phase 9.3: 3-4 days
- Phase 9.4: 3-4 days
- Phase 9.5: 4-5 days
- Phase 9.6: 2-3 days

**Total Estimated Effort**: 18-24 days
