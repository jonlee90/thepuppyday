# Implementation Tasks - Phase 9: Admin Settings & Content Management

This document contains the implementation tasks for Admin Settings & Content Management. Each task is designed to be executed incrementally in a test-driven manner, building upon previous tasks.

**References:**
- Requirements: `docs/specs/phase-9-admin-settings/requirements.md`
- Design: `docs/specs/phase-9-admin-settings/design.md`
- Individual Tasks: `docs/specs/phase-9-admin-settings/tasks/`

---

## Phase 9.1: Settings Dashboard & Site Content (0155-0168)

### 1. [ ] 0155: Database migrations for Phase 9 settings tables
- Create staff_commissions, referral_codes, referrals, settings_audit_log tables
- Add impression_count to promo_banners
- Create RLS policies and indexes

### 1.1. [ ] 0156: TypeScript types for Phase 9 settings entities
- Create BookingSettings, HeroContent, SeoSettings, BusinessInfo interfaces
- Create LoyaltyEarningRules, LoyaltyRedemptionRules, ReferralProgram interfaces
- Create StaffCommission, ReferralCode, Referral interfaces
- Create Zod validation schemas

### 1.2. [ ] 0157: Settings dashboard page structure
- Create page at `/admin/settings`
- Create SettingsDashboardClient component
- Verify admin role before rendering

### 1.3. [ ] 0158: Settings dashboard navigation cards
- Create SettingsCard component with status badges
- Create cards for all settings sections
- Implement responsive grid layout

### 1.4. [ ] 0159: Site content API routes
- Create GET/PUT `/api/admin/settings/site-content`
- Validate input with Zod schemas
- Create audit log entries

### 1.5. [ ] 0160: Hero section editor component
- Create HeroEditor with character counters
- CTA button editor (up to 2 buttons)
- Live preview panel

### 1.6. [ ] 0161: Hero image upload with Supabase Storage
- Create upload API route with validation
- Create HeroImageUpload component with drag-drop
- Validate dimensions (min 1920x800)

### 1.7. [ ] 0162: SEO settings editor component
- Create SeoSettings component with character limits
- Page title (60), meta description (160) inputs
- Open Graph configuration

### 1.8. [ ] 0163: SEO preview component
- Create Google search result preview
- Create Open Graph preview
- Real-time preview updates

### 1.9. [ ] 0164: Business info editor component
- Create BusinessInfoEditor with form fields
- Phone number mask, email validation
- Google Maps preview link

### 1.10. [ ] 0165: Business info validation
- Create Zod schema for BusinessInfo
- Phone, email, zip, URL validation
- Inline validation errors

### 1.11. [ ] 0166: Site content form patterns
- Create useSettingsForm custom hook
- Unsaved changes indicator
- Leave page confirmation dialog

### 1.12. [ ] 0167: Audit logging for settings changes
- Create logSettingsChange utility
- Integrate with site content API
- Store old/new values

### 1.13. [ ] 0168: Site content integration with marketing pages
- Update homepage hero with dynamic content
- Update metadata with SEO settings
- Update footer with business info

---

## Phase 9.2: Promo Banner Manager (0169-0179)

### 2. [ ] 0169: Banner API routes (GET, POST)
- Create GET `/api/admin/settings/banners` with status filter
- Create POST for banner creation
- Auto-assign display_order

### 2.1. [ ] 0170: Banner individual API routes (GET, PUT, DELETE)
- Create routes for individual banner management
- Soft-delete if analytics exist
- Create audit log entries

### 2.2. [ ] 0171: Banner reorder API route
- Create PUT `/api/admin/settings/banners/reorder`
- Atomic update of display_order
- Handle race conditions

### 2.3. [ ] 0172: Banner image upload
- Create upload API route (max 2MB)
- Support JPG, PNG, WebP, GIF
- Create BannerImageUpload component

### 2.4. [ ] 0173: Banner list component with status badges
- Create BannerList component
- Status badges: Draft, Scheduled, Active, Expired
- Action buttons: Edit, Toggle, Delete

### 2.5. [ ] 0174: Banner drag-drop reordering
- Integrate dnd-kit library
- Optimistic updates with rollback
- Mobile fallback with up/down buttons

### 2.6. [ ] 0175: Banner editor modal (create/edit)
- Create BannerEditor modal
- Image upload, alt text, click URL
- Form validation and preview

### 2.7. [ ] 0176: Banner scheduling with date pickers
- Add start/end date pickers
- Pacific Time zone handling
- Scheduling status preview

### 2.8. [ ] 0177: Banner click tracking endpoint
- Create GET `/api/banners/[id]/click`
- Atomic increment click_count
- Rate limiting

### 2.9. [ ] 0178: Banner analytics API and component
- Create analytics API with date ranges
- BannerAnalytics component with charts
- CSV export functionality

### 2.10. [ ] 0179: Banner integration with public site
- Create PromoBannerCarousel component
- Fetch active banners
- Track impressions

---

## Phase 9.3: Booking Settings (0180-0191)

### 3. [ ] 0180: Booking settings API routes
- Create GET/PUT `/api/admin/settings/booking`
- Validate all booking settings
- Store in settings table

### 3.1. [ ] 0181: Advance booking window settings component
- Create AdvanceBookingWindow component
- Min hours (0-168) and max days (7-365) inputs
- Same-day booking warning

### 3.2. [ ] 0182: Cancellation policy settings component
- Create CancellationPolicy component
- Cutoff hours selector (0-72)
- Policy preview display

### 3.3. [ ] 0183: Buffer time settings component
- Create BufferTimeSettings component
- 5-minute increment selector (0-60)
- Visual timeline preview

### 3.4. [ ] 0184: Business hours editor enhancement
- Create/enhance BusinessHoursEditor
- Multiple time ranges per day
- Closed day toggle

### 3.5. [ ] 0185: Blocked dates API routes
- Create POST/DELETE for blocked dates
- Check existing appointments
- Return affected count

### 3.6. [ ] 0186: Blocked dates manager component
- Create BlockedDatesManager
- Single date and range selection
- Warning for dates with appointments

### 3.7. [ ] 0187: Blocked dates calendar visualization
- Create BlockedDatesCalendar
- Monthly calendar view
- Click to toggle blocked

### 3.8. [ ] 0188: Recurring blocked days configuration
- Create RecurringBlockedDays component
- Day-of-week toggles
- Integration with calendar

### 3.9. [ ] 0189: Booking settings validation
- Create Zod schema for BookingSettings
- Cross-field validation
- Inline error display

### 3.10. [ ] 0190: Integration with availability API
- Update availability calculation
- Check blocked dates and days
- Apply booking window and buffer

### 3.11. [ ] 0191: Booking settings page assembly
- Create page at `/admin/settings/booking`
- Combine all booking components
- Tabbed/accordion layout

---

## Phase 9.4: Loyalty Program Settings (0192-0201)

### 4. [ ] 0192: Loyalty settings API routes
- Create GET/PUT `/api/admin/settings/loyalty`
- Return program stats
- Handle enable/disable

### 4.1. [ ] 0193: Punch card configuration component
- Create PunchCardConfig component
- Enable/disable toggle
- Threshold selector (5-20)

### 4.2. [ ] 0194: Earning rules editor component
- Create EarningRulesForm
- Service multi-select
- Minimum spend and first-visit bonus

### 4.3. [ ] 0195: Earning rules API routes
- Create GET/PUT for earning rules
- Validate service IDs
- Return affected customers

### 4.4. [ ] 0196: Redemption rules editor component
- Create RedemptionRulesForm
- Eligible services multi-select
- Expiration days input

### 4.5. [ ] 0197: Redemption rules API routes
- Create GET/PUT for redemption rules
- Validate at least one service
- Store in settings table

### 4.6. [ ] 0198: Referral program settings component
- Create ReferralProgramSettings
- Enable/disable toggle
- Bonus punches inputs

### 4.7. [ ] 0199: Referral codes table and API
- Create referral API routes
- Generate unique referral codes
- Return referral statistics

### 4.8. [ ] 0200: Loyalty settings page assembly
- Create page at `/admin/settings/loyalty`
- Combine all loyalty components
- Card-based layout

### 4.9. [ ] 0201: Integration with existing loyalty system
- Update punch awarding logic
- Apply earning rules
- Integrate referral tracking

---

## Phase 9.5: Staff Management (0202-0213)

### 5. [ ] 0202: Staff commissions table migration
- Verify staff_commissions table
- Ensure RLS policies
- Create updated_at trigger

### 5.1. [ ] 0203: Staff management API routes
- Create GET/POST `/api/admin/settings/staff`
- Filter by role and status
- Return staff with stats

### 5.2. [ ] 0204: Staff directory component
- Create StaffDirectory
- Grid and list view toggle
- Search and filter

### 5.3. [ ] 0205: Staff form component (create/edit)
- Create StaffForm modal
- Name, email, phone, role fields
- Active status toggle

### 5.4. [ ] 0206: Staff detail view component
- Create staff detail API route
- Create StaffDetail component
- Show stats and recent appointments

### 5.5. [ ] 0207: Commission settings API routes
- Create GET/PUT for commission
- Validate rate type and values
- Support service overrides

### 5.6. [ ] 0208: Commission settings component
- Create CommissionSettings
- Rate type selector
- Per-service override table

### 5.7. [ ] 0209: Earnings report API
- Create earnings report endpoint
- Support date range and grouping
- Calculate commissions

### 5.8. [ ] 0210: Earnings report component
- Create EarningsReport
- Date range picker and filters
- Chart and table views

### 5.9. [ ] 0211: Appointment assignment enhancement
- Add groomer dropdown to appointments
- Customer groomer preference
- Assignment change logging

### 5.10. [ ] 0212: Staff management page assembly
- Create page at `/admin/settings/staff`
- Directory and earnings tabs
- Handle single-groomer mode

### 5.11. [ ] 0213: Groomer filtering in calendar
- Add groomer filter dropdown
- Color coding for groomers
- Remember filter preference

---

## Phase 9.6: Integration & Testing (0214-0220)

### 6. [ ] 0214: Integration with booking flow
- Load booking settings in widget
- Apply blocked dates and window
- Groomer selection when multiple

### 6.1. [ ] 0215: Integration with public marketing site
- Dynamic hero and SEO content
- Footer business info
- Banner carousel

### 6.2. [ ] 0216: Unit tests for validation logic
- Test all Zod schemas
- Test edge cases and invalid values
- Test cross-field validation

### 6.3. [ ] 0217: Unit tests for settings services
- Test utility functions
- Mock database calls
- Test error handling

### 6.4. [ ] 0218: Integration tests for API endpoints
- Test all CRUD operations
- Test authentication requirements
- Test error responses

### 6.5. [ ] 0219: E2E tests for critical settings flows
- Test site content update flow
- Test banner management flow
- Test booking settings flow

### 6.6. [ ] 0220: Documentation and final polish
- Update navigation
- Verify consistency
- Performance and security review

---

## Summary

| Phase | Task Range | Tasks | Description |
|-------|------------|-------|-------------|
| 9.1 | 0155-0168 | 14 | Settings Dashboard & Site Content |
| 9.2 | 0169-0179 | 11 | Promo Banner Manager |
| 9.3 | 0180-0191 | 12 | Booking Settings |
| 9.4 | 0192-0201 | 10 | Loyalty Program Settings |
| 9.5 | 0202-0213 | 12 | Staff Management |
| 9.6 | 0214-0220 | 7 | Integration & Testing |

**Total Tasks**: 66

**Estimated Duration**: 18-24 days

**Critical Path**:
- Phase 9.1 (Foundation) must complete first
- Phases 9.2-9.5 can be parallelized
- Phase 9.6 (Integration & Testing) comes last

**High Priority Features** (implement first):
1. Site Content Management (9.1) - Immediate business value
2. Booking Settings (9.3) - Operational control
3. Promo Banners (9.2) - Marketing capability
4. Loyalty Settings (9.4) - Customer retention
5. Staff Management (9.5) - Multi-groomer support

## Using with /kc:impl

To implement a specific task, open the task file and click "Start task" or use:

```bash
/kc:impl 0155
```

This will read the task file at `docs/specs/phase-9-admin-settings/tasks/0155-*.md` and implement it according to the acceptance criteria.
