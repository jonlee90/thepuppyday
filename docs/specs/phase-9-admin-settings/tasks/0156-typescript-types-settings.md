# Task 0156: TypeScript types for Phase 9 settings entities

## Description
Define TypeScript interfaces for all Phase 9 data models including booking settings, site content, loyalty settings, staff commission, and referral types.

## Acceptance Criteria
- [ ] Create `BookingSettings` interface with min_advance_hours, max_advance_days, cancellation_cutoff_hours, buffer_minutes, blocked_dates, recurring_blocked_days
- [ ] Create `BlockedDate` interface with date, end_date, reason
- [ ] Create `HeroContent` interface with headline, subheadline, background_image_url, cta_buttons
- [ ] Create `SeoSettings` interface with page_title, meta_description, og_title, og_description, og_image_url
- [ ] Create `BusinessInfo` interface with name, address, city, state, zip, phone, email, social_links
- [ ] Create `LoyaltyEarningRules` interface with qualifying_services, minimum_spend, first_visit_bonus
- [ ] Create `LoyaltyRedemptionRules` interface with eligible_services, expiration_days, max_value
- [ ] Create `ReferralProgram` interface with is_enabled, referrer_bonus_punches, referee_bonus_punches
- [ ] Create `StaffCommission` interface with id, groomer_id, rate_type, rate, include_addons, service_overrides, timestamps
- [ ] Create `ReferralCode` interface with id, customer_id, code, uses_count, max_uses, is_active, created_at
- [ ] Create `Referral` interface with all fields including status enum
- [ ] Create `SettingsAuditLog` interface with setting_type enum
- [ ] Create Zod validation schemas for all interfaces
- [ ] Export all types from `src/types/settings.ts`

## Implementation Notes
- File: `src/types/settings.ts`
- Follow existing type patterns from `src/types/`
- Use discriminated unions where appropriate
- Include JSDoc comments for complex fields

## References
- Design: TypeScript Type Definitions appendix
- Req 8.1-8.8 (Booking settings)
- Req 13.1-16.8 (Loyalty settings)
- Req 17.1-20.8 (Staff management)

## Complexity
Medium

## Category
Foundation

## Dependencies
- 0155 (Database migrations)
