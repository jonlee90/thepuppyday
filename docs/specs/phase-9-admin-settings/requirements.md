# Phase 9: Admin Settings & Content Management - Requirements Document

## Introduction

Phase 9 focuses on implementing comprehensive admin configuration capabilities for The Puppy Day dog grooming SaaS application. This phase will provide administrators with tools to manage public website content, promotional banners, booking system settings, loyalty program configuration, and staff management (if operating with multiple groomers).

The admin settings module will centralize all business configuration in an intuitive interface, allowing non-technical administrators to customize the customer experience, manage promotions, and control operational parameters without requiring code changes. All settings will be persisted in the existing `settings` and `site_content` tables, with changes reflecting immediately on the public-facing site and booking system.

**Business Context:**
- Location: 14936 Leffingwell Rd, La Mirada, CA 90638
- Phone: (657) 252-2903
- Email: puppyday14936@gmail.com
- Hours: Monday-Saturday, 9:00 AM - 5:00 PM (Sunday closed)

## Requirements

### Requirement 1: Site Content Manager - Hero Section

**User Story:** As an admin, I want to edit the homepage hero section content, so that I can update the main messaging and imagery that visitors see first without developer assistance.

#### Acceptance Criteria

1. WHEN an admin accesses the site content manager THEN the system SHALL display editable fields for hero headline, subheadline, and call-to-action buttons
2. WHEN an admin edits the hero headline THEN the system SHALL allow text input up to 100 characters with a character counter
3. WHEN an admin edits the hero subheadline THEN the system SHALL allow text input up to 200 characters with a character counter
4. WHEN an admin configures CTA buttons THEN the system SHALL allow setting button text and link URL for up to 2 buttons
5. WHEN an admin uploads a hero background image THEN the system SHALL accept JPG, PNG, or WebP formats up to 5MB
6. WHEN a hero image is uploaded THEN the system SHALL display a preview and validate minimum dimensions of 1920x800 pixels
7. WHEN an admin saves hero content changes THEN the system SHALL update the `site_content` table and display a success confirmation
8. IF hero content save fails THEN the system SHALL display an error message with retry option and preserve the entered data
9. WHEN hero content is saved THEN the system SHALL immediately reflect changes on the public marketing site without requiring deployment

### Requirement 2: Site Content Manager - SEO Settings

**User Story:** As an admin, I want to manage SEO metadata for the website, so that the business can improve search engine visibility and control how the site appears in search results.

#### Acceptance Criteria

1. WHEN an admin accesses SEO settings THEN the system SHALL display editable fields for page title, meta description, and Open Graph data
2. WHEN an admin edits the page title THEN the system SHALL enforce a 60-character limit with a character counter and SEO preview
3. WHEN an admin edits the meta description THEN the system SHALL enforce a 160-character limit with a character counter
4. WHEN an admin configures Open Graph data THEN the system SHALL allow setting OG title, description, and image URL
5. WHEN SEO settings are saved THEN the system SHALL update the `site_content` table with key-value pairs
6. WHEN SEO fields are displayed THEN the system SHALL show a preview of how the page will appear in Google search results
7. IF SEO settings contain empty required fields THEN the system SHALL display validation warnings but allow saving with defaults
8. WHEN SEO settings are saved THEN the system SHALL include timestamp for last modification in the admin interface

### Requirement 3: Site Content Manager - Business Information

**User Story:** As an admin, I want to update business contact information and hours, so that customers always see accurate information across the website.

#### Acceptance Criteria

1. WHEN an admin accesses business info settings THEN the system SHALL display fields for business name, address, phone, and email
2. WHEN an admin edits the business address THEN the system SHALL validate address format and provide Google Maps preview link
3. WHEN an admin edits the phone number THEN the system SHALL validate US phone number format (XXX) XXX-XXXX
4. WHEN an admin edits the email THEN the system SHALL validate email format before saving
5. WHEN business info is saved THEN the system SHALL update all instances across the site including footer and contact sections
6. WHEN an admin views business hours THEN the system SHALL display the existing hours configuration from the `settings` table (already implemented)
7. IF business info changes affect booking communications THEN the system SHALL display a preview of affected notification templates
8. WHEN business info is saved THEN the system SHALL store changes in the `site_content` table and trigger cache invalidation

### Requirement 4: Promo Banner Manager - Banner Creation

**User Story:** As an admin, I want to create promotional banners for the website, so that I can advertise special offers and announcements to site visitors.

#### Acceptance Criteria

1. WHEN an admin accesses the promo banner manager THEN the system SHALL display a list of all existing banners with status indicators
2. WHEN an admin creates a new banner THEN the system SHALL require an image upload (JPG, PNG, WebP, or GIF up to 2MB)
3. WHEN an admin uploads a banner image THEN the system SHALL recommend dimensions of 1200x300 pixels and display a preview
4. WHEN an admin configures a banner THEN the system SHALL allow setting optional alt text (required for accessibility) and click URL
5. WHEN an admin sets a click URL THEN the system SHALL validate the URL format and allow both internal and external links
6. WHEN a banner is created THEN the system SHALL store it in the `promo_banners` table with `is_active` defaulting to false
7. IF banner upload fails THEN the system SHALL display the specific error and allow retry without losing other field data
8. WHEN a banner is created THEN the system SHALL assign the next available `display_order` value

### Requirement 5: Promo Banner Manager - Scheduling

**User Story:** As an admin, I want to schedule when promotional banners are displayed, so that time-sensitive promotions automatically appear and disappear on the correct dates.

#### Acceptance Criteria

1. WHEN an admin edits a banner THEN the system SHALL display date pickers for start date and end date
2. WHEN an admin sets a start date THEN the system SHALL allow setting a future date and time with timezone consideration (Pacific Time)
3. WHEN an admin sets an end date THEN the system SHALL validate that end date is after start date
4. IF no start date is set THEN the system SHALL display the banner immediately when activated
5. IF no end date is set THEN the system SHALL display the banner indefinitely until manually deactivated
6. WHEN the current date/time reaches a banner's start date THEN the system SHALL automatically display the banner on the public site
7. WHEN the current date/time passes a banner's end date THEN the system SHALL automatically hide the banner from the public site
8. WHEN an admin views the banner list THEN the system SHALL display scheduling status (Scheduled, Active, Expired, Draft)

### Requirement 6: Promo Banner Manager - Ordering and Display

**User Story:** As an admin, I want to reorder promotional banners, so that I can control which promotions appear first to visitors.

#### Acceptance Criteria

1. WHEN multiple banners are active THEN the system SHALL display them in order based on `display_order` field
2. WHEN an admin views the banner list THEN the system SHALL provide drag-and-drop reordering functionality
3. WHEN an admin reorders banners THEN the system SHALL update `display_order` values and save changes immediately
4. WHEN banners are reordered THEN the system SHALL display a success toast notification confirming the order change
5. WHEN an admin toggles a banner's active state THEN the system SHALL update `is_active` in the database immediately
6. WHEN viewing the public site THEN the system SHALL display only banners where `is_active` is true AND current date is within scheduled range
7. IF no active banners exist THEN the system SHALL not display the banner section on the public site
8. WHEN an admin deletes a banner THEN the system SHALL soft-delete or hard-delete based on whether it has click analytics data

### Requirement 7: Promo Banner Manager - Analytics

**User Story:** As an admin, I want to see how many times each banner was clicked, so that I can measure the effectiveness of promotional campaigns.

#### Acceptance Criteria

1. WHEN an admin views the banner list THEN the system SHALL display click count for each banner
2. WHEN a visitor clicks a banner with a URL THEN the system SHALL increment the `click_count` field before redirecting
3. WHEN an admin views banner details THEN the system SHALL display total clicks, unique clicks (if tracking), and CTR (if impressions tracked)
4. WHEN an admin views analytics THEN the system SHALL display click data grouped by date range (last 7 days, 30 days, custom)
5. WHEN an admin exports banner analytics THEN the system SHALL provide CSV download with banner name, clicks, dates, and URLs
6. IF a banner has no click URL THEN the system SHALL not track clicks for that banner
7. WHEN banner analytics are displayed THEN the system SHALL show comparison to previous period (e.g., "+15% vs last week")
8. WHEN a banner is deleted THEN the system SHALL preserve historical analytics data for reporting

### Requirement 8: Booking Settings - Advance Booking Window

**User Story:** As an admin, I want to control how far in advance customers can book appointments, so that I can manage scheduling capacity and prevent last-minute or too-far-out bookings.

#### Acceptance Criteria

1. WHEN an admin accesses booking settings THEN the system SHALL display the current minimum advance booking hours (default: 24 hours)
2. WHEN an admin sets minimum advance hours THEN the system SHALL allow values between 0 and 168 hours (1 week)
3. WHEN an admin accesses booking settings THEN the system SHALL display the current maximum advance booking days (default: 30 days)
4. WHEN an admin sets maximum advance days THEN the system SHALL allow values between 7 and 365 days
5. WHEN a customer attempts to book within the minimum window THEN the booking system SHALL display an error message explaining the policy
6. WHEN a customer views the calendar THEN the system SHALL grey out dates beyond the maximum booking window
7. WHEN booking settings are saved THEN the system SHALL update the `settings` table and immediately enforce new rules
8. IF minimum advance hours would disable same-day booking THEN the system SHALL display a warning but allow the setting

### Requirement 9: Booking Settings - Cancellation Policy

**User Story:** As an admin, I want to set the cancellation cutoff period, so that customers understand when they can cancel without penalty and I can manage scheduling disruptions.

#### Acceptance Criteria

1. WHEN an admin accesses booking settings THEN the system SHALL display the current cancellation cutoff hours (default: 24 hours)
2. WHEN an admin sets cancellation cutoff THEN the system SHALL allow values between 0 and 72 hours
3. WHEN a customer attempts to cancel within the cutoff window THEN the system SHALL display a warning about potential fees
4. WHEN the cancellation cutoff is set to 0 THEN the system SHALL allow cancellations at any time without warning
5. WHEN cancellation settings are saved THEN the system SHALL update both the `settings` table and booking confirmation templates
6. WHEN a customer views their appointment THEN the system SHALL display the cancellation deadline based on the cutoff setting
7. IF cancellation cutoff changes while pending appointments exist THEN the system SHALL apply the new policy only to new bookings
8. WHEN displaying cancellation policy THEN the system SHALL show the policy on booking confirmation page and in confirmation emails

### Requirement 10: Booking Settings - Buffer Time

**User Story:** As an admin, I want to set buffer time between appointments, so that groomers have adequate time for cleanup, preparation, and unexpected delays.

#### Acceptance Criteria

1. WHEN an admin accesses booking settings THEN the system SHALL display the current buffer time in minutes (default: 15 minutes)
2. WHEN an admin sets buffer time THEN the system SHALL allow values between 0 and 60 minutes in 5-minute increments
3. WHEN the availability checker runs THEN the system SHALL add buffer time after each booked appointment when calculating slots
4. WHEN buffer time is set to 0 THEN the system SHALL allow back-to-back appointment scheduling
5. WHEN buffer settings change THEN the system SHALL NOT affect already-scheduled appointments
6. WHEN an admin views the appointment calendar THEN the system SHALL visually indicate buffer periods between appointments
7. WHEN calculating appointment end time THEN the system SHALL include buffer time for conflict checking but not for customer communication
8. WHEN buffer time is saved THEN the system SHALL update the `settings` table with key `buffer_minutes`

### Requirement 11: Booking Settings - Business Hours Override

**User Story:** As an admin, I want to modify business hours for the booking system, so that I can adjust availability independently of the general business hours display.

#### Acceptance Criteria

1. WHEN an admin accesses booking settings THEN the system SHALL display current operating hours for each day of the week
2. WHEN an admin edits hours for a day THEN the system SHALL allow setting open time, close time, and whether the day is available for booking
3. WHEN an admin configures a day as closed THEN the system SHALL grey out that day in the booking calendar
4. WHEN hours are saved THEN the system SHALL validate that close time is after open time
5. IF booking hours differ from displayed business hours THEN the system SHALL display a warning to the admin
6. WHEN an admin saves booking hours THEN the system SHALL update the `settings` table under `business_hours` key
7. WHEN the booking widget loads THEN the system SHALL generate available time slots based on these hours and service duration
8. WHEN lunch breaks or split shifts are needed THEN the system SHALL allow configuring multiple time ranges per day

### Requirement 12: Booking Settings - Blocked Dates

**User Story:** As an admin, I want to block specific dates from booking, so that I can mark holidays, vacations, and special closures when the business is unavailable.

#### Acceptance Criteria

1. WHEN an admin accesses booking settings THEN the system SHALL display a list of currently blocked dates
2. WHEN an admin adds a blocked date THEN the system SHALL allow selecting a single date or date range with an optional reason
3. WHEN a date is blocked THEN the system SHALL prevent any new appointments from being scheduled on that date
4. WHEN a blocked date is set THEN the booking calendar SHALL display that date as unavailable with optional tooltip showing the reason
5. WHEN an admin removes a blocked date THEN the system SHALL immediately make that date available for booking
6. IF appointments exist on a date being blocked THEN the system SHALL display a warning and require confirmation before blocking
7. WHEN blocked dates are saved THEN the system SHALL store them in the `settings` table as an array under `blocked_dates` key
8. WHEN a recurring block is needed (e.g., every Monday) THEN the system SHALL allow setting recurring blocked days separate from blocked dates

### Requirement 13: Loyalty Program Settings - Program Configuration

**User Story:** As an admin, I want to configure the loyalty punch card program, so that I can set earning thresholds and manage how customers accumulate rewards.

#### Acceptance Criteria

1. WHEN an admin accesses loyalty settings THEN the system SHALL display the current punch card configuration
2. WHEN an admin sets the punch threshold THEN the system SHALL allow values between 5 and 20 (default: 9, meaning "Buy 9, get 10th free")
3. WHEN an admin toggles the loyalty program THEN the system SHALL enable or disable punch tracking for all customers
4. IF the loyalty program is disabled THEN the system SHALL preserve existing punch data but stop accumulating new punches
5. WHEN the punch threshold is modified THEN the system SHALL apply only to new reward cycles, not current progress
6. WHEN an admin views loyalty settings THEN the system SHALL display total active customers in the program and total rewards redeemed
7. WHEN loyalty settings are saved THEN the system SHALL update the `loyalty_settings` table
8. WHEN an admin resets a customer's punch card THEN the system SHALL allow manual adjustment with required reason note

### Requirement 14: Loyalty Program Settings - Earning Rules

**User Story:** As an admin, I want to define what actions earn loyalty punches, so that I can reward customer behaviors that benefit the business.

#### Acceptance Criteria

1. WHEN an admin accesses earning rules THEN the system SHALL display which appointment types qualify for punches
2. WHEN an admin configures earning rules THEN the system SHALL allow selecting specific services that earn punches
3. WHEN an admin sets minimum spend threshold THEN the system SHALL only award punches for appointments above that amount
4. IF earning rules specify service types THEN the system SHALL only award punches for those specific services
5. WHEN a qualifying appointment is completed THEN the system SHALL automatically add a punch to the customer's card
6. WHEN an admin enables "first visit bonus" THEN the system SHALL award extra punches for a customer's first appointment
7. WHEN earning rules are saved THEN the system SHALL update the `settings` table and apply to future appointments only
8. IF earning rules change THEN the system SHALL display how many customers are affected by the change

### Requirement 15: Loyalty Program Settings - Redemption Rules

**User Story:** As an admin, I want to configure how customers redeem their loyalty rewards, so that I can control the value and application of earned rewards.

#### Acceptance Criteria

1. WHEN an admin accesses redemption rules THEN the system SHALL display current reward options (free service types eligible)
2. WHEN an admin configures redemption THEN the system SHALL allow specifying which services can be redeemed for free
3. WHEN a customer has a pending reward THEN the system SHALL display it during booking with option to apply
4. IF redemption is restricted to specific services THEN the system SHALL only show "Apply Reward" for those services
5. WHEN a reward is redeemed THEN the system SHALL update the `loyalty_redemptions` table and reset the customer's punch count
6. WHEN an admin sets reward expiration THEN the system SHALL allow setting days until earned rewards expire (0 = never)
7. IF a reward expires THEN the system SHALL update status to "expired" and notify the customer if notifications are enabled
8. WHEN redemption rules are saved THEN the system SHALL validate that at least one service is eligible for redemption

### Requirement 16: Loyalty Program Settings - Referral Bonus

**User Story:** As an admin, I want to configure referral bonuses, so that I can incentivize existing customers to bring new customers to the business.

#### Acceptance Criteria

1. WHEN an admin accesses referral settings THEN the system SHALL display current referral program configuration
2. WHEN an admin enables referral bonuses THEN the system SHALL allow setting bonus punches for the referrer (default: 1 punch)
3. WHEN an admin configures new customer bonus THEN the system SHALL allow setting bonus punches for the referred customer
4. WHEN a referred customer completes their first appointment THEN the system SHALL credit bonus punches to both parties
5. IF referral tracking is enabled THEN the system SHALL generate unique referral codes for each customer
6. WHEN an admin views referral stats THEN the system SHALL display total referrals, successful conversions, and bonuses awarded
7. WHEN referral settings are saved THEN the system SHALL update the `settings` table under `referral_program` key
8. IF referral program is disabled THEN the system SHALL stop generating new referral codes but honor pending referrals

### Requirement 17: Staff Management - Staff Directory

**User Story:** As an admin, I want to manage staff members in the system, so that appointments can be assigned to specific groomers and staff schedules can be tracked.

#### Acceptance Criteria

1. WHEN an admin accesses staff management THEN the system SHALL display a list of all users with role "groomer" or "admin"
2. WHEN an admin adds a new staff member THEN the system SHALL require first name, last name, email, and role (groomer/admin)
3. WHEN a staff member is created THEN the system SHALL create a user record with the specified role
4. WHEN an admin edits a staff member THEN the system SHALL allow updating name, contact info, and active status
5. WHEN a staff member is deactivated THEN the system SHALL prevent new appointment assignments but preserve historical data
6. WHEN an admin views staff details THEN the system SHALL display upcoming appointments, completed count, and average rating if available
7. IF staff management is accessed with only one groomer THEN the system SHALL display a message explaining multi-groomer features
8. WHEN staff data is saved THEN the system SHALL update the `users` table with appropriate role and status

### Requirement 18: Staff Management - Commission Structure

**User Story:** As an admin, I want to set commission rates for groomers, so that I can track and calculate staff compensation based on completed services.

#### Acceptance Criteria

1. WHEN an admin accesses commission settings THEN the system SHALL display current commission structure for each groomer
2. WHEN an admin sets commission rates THEN the system SHALL allow setting percentage (0-100%) or flat rate per service
3. WHEN an admin configures tiered commissions THEN the system SHALL allow different rates for different service types
4. WHEN a groomer completes an appointment THEN the system SHALL calculate commission based on assigned rate and service total
5. WHEN commission is calculated THEN the system SHALL exclude add-ons or include them based on admin preference
6. WHEN an admin views commission report THEN the system SHALL display earnings by groomer for selected date range
7. IF no commission structure is set for a groomer THEN the system SHALL use default rate (configurable, default 0%)
8. WHEN commission settings are saved THEN the system SHALL store them in a staff-specific settings structure

### Requirement 19: Staff Management - Earnings Reports

**User Story:** As an admin, I want to view earnings reports per groomer, so that I can track performance and manage payroll calculations.

#### Acceptance Criteria

1. WHEN an admin accesses earnings reports THEN the system SHALL display a summary of all groomer earnings for the current period
2. WHEN an admin selects a groomer THEN the system SHALL display detailed breakdown of appointments and calculated commissions
3. WHEN an admin selects a date range THEN the system SHALL filter earnings data to that period with totals
4. WHEN earnings report is generated THEN the system SHALL include total services, total revenue, and total commission per groomer
5. WHEN an admin exports the report THEN the system SHALL provide PDF and CSV download options
6. IF tips are tracked separately THEN the system SHALL display tip amounts in a separate column
7. WHEN viewing earnings THEN the system SHALL allow grouping by day, week, or month with comparison to previous period
8. WHEN an admin views groomer performance THEN the system SHALL display average appointment value and customer return rate

### Requirement 20: Staff Management - Appointment Assignment

**User Story:** As an admin, I want to assign appointments to specific groomers, so that workload can be distributed and customers can request their preferred groomer.

#### Acceptance Criteria

1. WHEN an admin views an appointment THEN the system SHALL display groomer assignment dropdown with all active groomers
2. WHEN an admin assigns a groomer THEN the system SHALL update the `groomer_id` field on the appointment
3. IF a customer has a groomer preference THEN the booking system SHALL pre-select that groomer if available
4. WHEN an admin views the calendar by groomer THEN the system SHALL filter appointments to show only that groomer's schedule
5. WHEN multiple groomers are active THEN the booking widget SHALL allow customers to select their preferred groomer
6. IF no groomer is assigned THEN the appointment SHALL appear in "Unassigned" section of the calendar
7. WHEN groomer assignment changes THEN the system SHALL log the change and optionally notify the customer
8. WHEN calculating availability THEN the system SHALL consider individual groomer schedules if configured

### Requirement 21: Settings Dashboard Overview

**User Story:** As an admin, I want a centralized settings dashboard, so that I can quickly navigate to and manage all configuration options from one location.

#### Acceptance Criteria

1. WHEN an admin accesses the settings area THEN the system SHALL display a dashboard with categorized setting sections
2. WHEN the dashboard loads THEN the system SHALL display quick status indicators for each setting category (configured/needs attention)
3. WHEN an admin clicks a category THEN the system SHALL navigate to the detailed settings page for that section
4. WHEN viewing the dashboard THEN the system SHALL highlight any settings that have warnings or require attention
5. WHEN settings are modified in any section THEN the system SHALL display "Last updated" timestamp on the dashboard
6. WHEN an admin views the dashboard THEN the system SHALL display a summary of current configuration (e.g., "24-hour cancellation policy")
7. IF required settings are missing THEN the system SHALL display setup wizard prompt for new installations
8. WHEN the dashboard loads THEN the system SHALL verify admin role before displaying any settings options

## Non-Functional Requirements

### NFR-1: Performance

1. WHEN site content is updated THEN the system SHALL reflect changes on the public site within 5 seconds
2. WHEN the admin accesses settings pages THEN the system SHALL load all data within 2 seconds
3. WHEN banner images are uploaded THEN the system SHALL process and optimize images for web delivery
4. WHEN banner analytics are queried THEN the system SHALL return results within 3 seconds for up to 1 year of data

### NFR-2: Security

1. WHEN any settings endpoint is accessed THEN the system SHALL verify admin role authorization
2. WHEN file uploads occur THEN the system SHALL scan for malicious content and validate file types
3. WHEN sensitive settings are modified THEN the system SHALL log the change with admin user ID and timestamp
4. WHEN API routes are called THEN the system SHALL implement rate limiting to prevent abuse

### NFR-3: Usability

1. WHEN form fields are changed THEN the system SHALL display unsaved changes indicator
2. WHEN leaving a page with unsaved changes THEN the system SHALL display confirmation dialog
3. WHEN validation errors occur THEN the system SHALL display inline error messages next to affected fields
4. WHEN settings are saved successfully THEN the system SHALL display clear success feedback

### NFR-4: Reliability

1. WHEN settings fail to save THEN the system SHALL preserve entered data and allow retry
2. WHEN external dependencies fail (image upload, etc.) THEN the system SHALL provide graceful fallback
3. WHEN multiple admins edit simultaneously THEN the system SHALL use optimistic locking or last-write-wins with warning

### NFR-5: Accessibility

1. WHEN banner alt text is empty THEN the system SHALL require alt text for accessibility compliance
2. WHEN form fields are displayed THEN the system SHALL include proper labels and ARIA attributes
3. WHEN color is used to convey meaning THEN the system SHALL also use text or icons for colorblind users

## Data Requirements

### DR-1: Site Content Storage

1. Site content SHALL be stored in the existing `site_content` table with key-value structure
2. Content keys SHALL follow naming convention: `{section}_{field}` (e.g., `hero_headline`, `seo_title`)
3. Complex content (arrays, objects) SHALL be stored as JSON in the `content` field

### DR-2: Promo Banner Storage

1. Banner data SHALL be stored in the existing `promo_banners` table
2. Banner images SHALL be stored in Supabase Storage with public access URLs
3. Click analytics SHALL be tracked in the `click_count` field with atomic increments

### DR-3: Settings Storage

1. Booking and loyalty settings SHALL be stored in the existing `settings` table
2. Settings keys SHALL use snake_case naming convention
3. Complex settings (business hours, blocked dates) SHALL be stored as JSON values

### DR-4: Staff Data

1. Staff members SHALL be stored in the existing `users` table with role field
2. Commission structures SHALL be stored in a new `staff_settings` key in the `settings` table
3. Earnings calculations SHALL be derived from `appointments` and `payments` tables

## Integration Requirements

### IR-1: Marketing Site Integration

1. Site content changes SHALL immediately reflect on the Next.js marketing pages via ISR or dynamic rendering
2. Promo banners SHALL be fetched and cached on the marketing homepage
3. Business info SHALL be consistent across all page footers and contact sections

### IR-2: Booking System Integration

1. Booking settings SHALL be loaded by the booking widget on initialization
2. Blocked dates SHALL be enforced in the availability calculation
3. Buffer time SHALL be factored into appointment conflict checking

### IR-3: Loyalty System Integration

1. Loyalty settings SHALL integrate with the existing punch card system (Phase 7)
2. Earning rules SHALL be checked when appointments are marked complete
3. Redemption rules SHALL be validated during the booking checkout process

### IR-4: Notification System Integration

1. Business info changes SHALL be reflected in notification templates
2. Loyalty reward notifications SHALL respect configured expiration settings
3. Staff assignment changes MAY trigger customer notifications if enabled

## Constraints

1. The system MUST use the existing database tables (`settings`, `site_content`, `promo_banners`, `users`)
2. The admin interface MUST follow the established DaisyUI design system
3. All settings changes MUST be auditable through database timestamps
4. Staff management features MUST gracefully handle single-groomer mode
5. File uploads MUST use Supabase Storage for consistency with existing implementation

## Assumptions

1. The business operates in Pacific Time (America/Los_Angeles) for all scheduling purposes
2. A single admin can manage all settings (no granular permission system required)
3. Commission tracking is for reporting only; actual payroll is handled externally
4. The loyalty program type remains "punch card" (points system is legacy)
5. Multi-groomer features may not be used initially but should be available
