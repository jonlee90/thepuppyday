# Implementation Tasks - Phase 6: Admin Panel Advanced Features

This document contains the implementation tasks for Admin Panel Advanced Features. Each task is designed to be executed incrementally in a test-driven manner, building upon previous tasks.

**References:**
- Requirements: `docs/specs/phase-6/requirements.md`
- Design: `docs/specs/phase-6/design.md`

---

## Group 1: Database Schema & Foundation (Week 1)

### 1. [ ] Create database migrations for Phase 6 tables
- **Objective**: Add new tables required for Phase 6 features
- **Files to create/modify**:
  - `supabase/migrations/[timestamp]_phase6_reviews_table.sql`
  - `supabase/migrations/[timestamp]_phase6_marketing_campaigns_table.sql`
  - `supabase/migrations/[timestamp]_phase6_campaign_sends_table.sql`
  - `supabase/migrations/[timestamp]_phase6_analytics_cache_table.sql`
  - `supabase/migrations/[timestamp]_phase6_waitlist_slot_offers_table.sql`
  - `supabase/migrations/[timestamp]_phase6_marketing_unsubscribes_table.sql`
- **Requirements covered**: REQ-6.3.3, REQ-6.9.1, REQ-6.13.1, REQ-6.14.1
- **Acceptance criteria**:
  - `reviews` table created with foreign keys to report_cards, users, appointments
  - `marketing_campaigns` table created with JSONB fields for segment_criteria, message, ab_test_config
  - `campaign_sends` table created for tracking individual notification sends
  - `analytics_cache` table created with unique constraint on metric_key + date range
  - `waitlist_slot_offers` table created for tracking waitlist slot notifications
  - `marketing_unsubscribes` table created for opt-out tracking
  - All tables have appropriate indexes
  - RLS policies applied for each table

### 1.1. [ ] Modify existing tables for Phase 6 enhancements
- **Objective**: Add new columns to existing report_cards, waitlist, and notifications_log tables
- **Files to create/modify**:
  - `supabase/migrations/[timestamp]_phase6_report_cards_enhancements.sql`
  - `supabase/migrations/[timestamp]_phase6_waitlist_enhancements.sql`
  - `supabase/migrations/[timestamp]_phase6_notifications_log_enhancements.sql`
- **Requirements covered**: REQ-6.1.3, REQ-6.4.2, REQ-6.5.2, REQ-6.17.2
- **Acceptance criteria**:
  - `report_cards` table has new columns: groomer_id, view_count, last_viewed_at, sent_at, expires_at, dont_send, is_draft, updated_at
  - `waitlist` table has new columns: priority, notes, offer_expires_at, updated_at
  - `notifications_log` table has new columns: campaign_id, campaign_send_id, tracking_id, clicked_at, delivered_at, cost_cents
  - Triggers created for updated_at timestamps

### 1.2. [ ] Create TypeScript types for Phase 6 entities
- **Objective**: Define TypeScript interfaces for all Phase 6 data models
- **Files to create/modify**:
  - `src/types/report-card.ts`
  - `src/types/review.ts`
  - `src/types/marketing.ts`
  - `src/types/analytics.ts`
  - `src/types/waitlist.ts`
- **Requirements covered**: REQ-6.1.1, REQ-6.2.2, REQ-6.3.1, REQ-6.9.1, REQ-6.10.1
- **Acceptance criteria**:
  - ReportCardFormState interface with all assessment fields
  - PublicReportCard interface for public page display
  - Review interface with rating and feedback
  - Campaign interface with segment criteria and message
  - CampaignSend interface for send tracking
  - AnalyticsKPI interface for dashboard metrics
  - WaitlistSlotOffer interface for waitlist automation

---

## Group 2: Report Card System - Admin Form (Week 1)

### 2. [ ] Create ReportCardForm page and layout
- **Objective**: Build tablet-optimized report card form page at `/admin/appointments/[id]/report-card`
- **Files to create/modify**:
  - `src/app/(admin)/appointments/[id]/report-card/page.tsx`
  - `src/components/admin/report-cards/ReportCardForm.tsx`
- **Requirements covered**: REQ-6.1.1
- **Acceptance criteria**:
  - Page accessible at `/admin/appointments/[id]/report-card`
  - Form loads appointment details (pet name, service, customer)
  - Touch-optimized layout with large tap targets (min 44x44px)
  - Responsive grid layout for tablet and desktop

### 2.1. [ ] Create PhotoUploadSection component with before/after uploads
- **Objective**: Build photo upload components with image compression
- **Files to create/modify**:
  - `src/components/admin/report-cards/PhotoUploadSection.tsx`
  - `src/components/admin/report-cards/PhotoUpload.tsx`
  - `src/lib/utils/image-compression.ts`
- **Requirements covered**: REQ-6.1.1, REQ-6.1.2
- **Acceptance criteria**:
  - Drag-drop or click to upload photo
  - Before photo optional, after photo required
  - Image compression to max 1200px width before upload
  - Upload to Supabase Storage `report-card-photos` bucket
  - Preview thumbnail shown after upload
  - Loading state during upload
  - Error handling for failed uploads

### 2.2. [ ] Create AssessmentSection with quick-tap selectors
- **Objective**: Build mood, coat condition, and behavior assessment selectors
- **Files to create/modify**:
  - `src/components/admin/report-cards/AssessmentSection.tsx`
  - `src/components/admin/report-cards/MoodSelector.tsx`
  - `src/components/admin/report-cards/CoatConditionSelector.tsx`
  - `src/components/admin/report-cards/BehaviorSelector.tsx`
- **Requirements covered**: REQ-6.1.1
- **Acceptance criteria**:
  - MoodSelector with 4 options: Happy, Nervous, Calm, Energetic
  - CoatConditionSelector with 4 options: Excellent, Good, Matted, Needs Attention
  - BehaviorSelector with 3 options: Great, Some Difficulty, Required Extra Care
  - Large touch-friendly buttons with icons
  - Visual feedback for selected state
  - Single selection per category

### 2.3. [ ] Create HealthObservationsSection with checkboxes
- **Objective**: Build health observation checkboxes with auto-flag logic
- **Files to create/modify**:
  - `src/components/admin/report-cards/HealthObservationsSection.tsx`
- **Requirements covered**: REQ-6.1.1, REQ-6.1.2
- **Acceptance criteria**:
  - 6 checkbox options: Skin irritation, Ear infection signs, Fleas/ticks, Lumps, Overgrown nails, Dental issues
  - Touch-friendly checkbox sizing
  - Critical issues (Lumps, Ear infection) visually highlighted
  - Auto-flag appointment for follow-up when critical issues selected

### 2.4. [ ] Create GroomerNotesSection and DontSend toggle
- **Objective**: Build groomer notes textarea and don't send toggle
- **Files to create/modify**:
  - `src/components/admin/report-cards/GroomerNotesSection.tsx`
  - `src/components/admin/report-cards/DontSendToggle.tsx`
- **Requirements covered**: REQ-6.1.1, REQ-6.4.3
- **Acceptance criteria**:
  - Textarea for groomer notes (optional)
  - Character counter
  - DontSend toggle with explanation text
  - Toggle prevents auto-send of report card

### 2.5. [ ] Implement auto-save draft functionality
- **Objective**: Add debounced auto-save with offline support
- **Files to create/modify**:
  - `src/hooks/admin/use-report-card-form.ts`
  - `src/app/api/admin/report-cards/route.ts`
- **Requirements covered**: REQ-6.1.1, REQ-6.1.3
- **Acceptance criteria**:
  - Form state auto-saves every 5 seconds (debounced)
  - Draft indicator shows "Saving..." and "Saved at [time]"
  - LocalStorage fallback for offline mode
  - Draft syncs when back online
  - One report card per appointment enforced

### 2.6. [ ] Create report card submission with validation
- **Objective**: Build submit action with validation and API integration
- **Files to create/modify**:
  - `src/components/admin/report-cards/SubmitActions.tsx`
  - `src/app/api/admin/report-cards/route.ts`
  - `src/lib/admin/report-card-validation.ts`
- **Requirements covered**: REQ-6.1.2, REQ-6.1.3
- **Acceptance criteria**:
  - After photo required validation
  - At least one assessment field required validation
  - Save Draft button preserves is_draft=true
  - Submit button sets is_draft=false
  - Success redirects to appointment detail
  - Report card editable within 24 hours of creation

---

## Group 3: Report Card System - Public Page (Week 1-2)

### 3. [ ] Create public report card page at `/report-cards/[uuid]`
- **Objective**: Build shareable public report card page
- **Files to create/modify**:
  - `src/app/(public)/report-cards/[uuid]/page.tsx`
  - `src/components/public/report-cards/PublicReportCard.tsx`
  - `src/app/api/report-cards/[uuid]/route.ts`
- **Requirements covered**: REQ-6.2.1, REQ-6.2.2, REQ-6.2.3
- **Acceptance criteria**:
  - Page accessible without authentication
  - UUID-based URL prevents enumeration
  - Mobile-responsive design
  - SEO meta tags with pet name and service

### 3.1. [ ] Create HeroSection with after photo display
- **Objective**: Build hero section with prominent after photo
- **Files to create/modify**:
  - `src/components/public/report-cards/HeroSection.tsx`
  - `src/components/public/report-cards/PetNameBadge.tsx`
- **Requirements covered**: REQ-6.2.2
- **Acceptance criteria**:
  - Full-width after photo hero image
  - Pet name badge overlay
  - Service date displayed
  - Business branding included

### 3.2. [ ] Create AssessmentGrid with icon cards
- **Objective**: Build grid display of mood, coat, behavior assessments
- **Files to create/modify**:
  - `src/components/public/report-cards/AssessmentGrid.tsx`
  - `src/components/public/report-cards/AssessmentCard.tsx`
- **Requirements covered**: REQ-6.2.2
- **Acceptance criteria**:
  - 3-column grid on desktop, stacked on mobile
  - Each card shows icon, label, and value
  - Color-coded based on assessment (green/yellow/red)
  - Smooth hover animations

### 3.3. [ ] Create HealthObservations and GroomerNotes sections
- **Objective**: Build conditional health observations and groomer notes display
- **Files to create/modify**:
  - `src/components/public/report-cards/HealthObservationsSection.tsx`
  - `src/components/public/report-cards/GroomerNotesSection.tsx`
  - `src/components/public/report-cards/GroomerSignature.tsx`
- **Requirements covered**: REQ-6.2.2
- **Acceptance criteria**:
  - Health observations shown only if present
  - Recommendations displayed for health issues
  - Groomer notes shown conditionally
  - Groomer name and signature displayed

### 3.4. [ ] Create BeforeAfterComparison slider
- **Objective**: Build interactive before/after photo comparison
- **Files to create/modify**:
  - `src/components/public/report-cards/BeforeAfterComparison.tsx`
- **Requirements covered**: REQ-6.2.2
- **Acceptance criteria**:
  - Only shown if before photo exists
  - Swipeable slider on mobile
  - Drag handle on desktop
  - Smooth transition animation

### 3.5. [ ] Create ShareButtons and PDF download
- **Objective**: Build social sharing and PDF generation
- **Files to create/modify**:
  - `src/components/public/report-cards/ShareButtons.tsx`
  - `src/lib/utils/pdf-generator.ts`
- **Requirements covered**: REQ-6.2.3
- **Acceptance criteria**:
  - Facebook, Instagram share buttons
  - Copy link button
  - PDF download using jsPDF
  - PDF includes all report card content

### 3.6. [ ] Implement view tracking and expiration
- **Objective**: Track report card views and handle expiration
- **Files to create/modify**:
  - `src/app/api/report-cards/[uuid]/route.ts`
- **Requirements covered**: REQ-6.2.1
- **Acceptance criteria**:
  - view_count incremented on each view
  - last_viewed_at timestamp updated
  - 410 Gone returned for expired report cards
  - Expiration configurable (default 90 days)

---

## Group 4: Review System Integration (Week 2)

### 4. [ ] Create ReviewPrompt component with star rating
- **Objective**: Build review prompt displayed on report card page
- **Files to create/modify**:
  - `src/components/public/report-cards/ReviewPrompt.tsx`
  - `src/components/public/report-cards/StarRatingSelector.tsx`
- **Requirements covered**: REQ-6.3.1, REQ-6.3.4
- **Acceptance criteria**:
  - 5-star rating selector with hover effects
  - Only shown if review not already submitted
  - Positioned after report card content
  - Touch-friendly star size

### 4.1. [ ] Implement review routing logic (4-5 stars to Google, 1-3 to feedback)
- **Objective**: Build review submission with routing based on rating
- **Files to create/modify**:
  - `src/app/api/reviews/route.ts`
  - `src/components/public/report-cards/GoogleReviewRedirect.tsx`
  - `src/components/public/report-cards/PrivateFeedbackForm.tsx`
- **Requirements covered**: REQ-6.3.2, REQ-6.3.3
- **Acceptance criteria**:
  - 4-5 stars: Thank you message + redirect to Google Business review page
  - 1-3 stars: Private feedback form displayed
  - Rating, feedback, and timestamp saved to reviews table
  - Low ratings flagged for admin follow-up

### 4.2. [ ] Create duplicate review prevention
- **Objective**: Prevent multiple reviews per report card
- **Files to create/modify**:
  - `src/app/api/reviews/route.ts`
- **Requirements covered**: REQ-6.3.4
- **Acceptance criteria**:
  - One review per report card enforced (database unique constraint)
  - "Thank you" message shown if already reviewed
  - API returns 400 for duplicate attempts

---

## Group 5: Report Card Automation (Week 2)

### 5. [ ] Create report card notification scheduler
- **Objective**: Schedule auto-send of report cards after appointment completion
- **Files to create/modify**:
  - `src/lib/admin/report-card-scheduler.ts`
  - `src/app/api/webhooks/appointment-completed/route.ts`
- **Requirements covered**: REQ-6.4.1
- **Acceptance criteria**:
  - Trigger when appointment status changes to "completed"
  - Configurable delay (default 15 minutes)
  - Send SMS + Email with report card link
  - Skip if dont_send is true
  - Skip if report card is still draft

### 5.1. [ ] Create SMS template for report card notification
- **Objective**: Build SMS notification using Twilio
- **Files to create/modify**:
  - `src/lib/twilio/report-card-sms.ts`
  - `src/mocks/twilio/report-card-sms.ts`
- **Requirements covered**: REQ-6.4.1, REQ-6.17.2
- **Acceptance criteria**:
  - SMS template: "Hi [name]! [pet_name]'s grooming report is ready! See how they did: [link]"
  - Mock implementation for development
  - Twilio integration for production
  - Delivery status tracked in notifications_log

### 5.2. [ ] Create email template for report card notification
- **Objective**: Build email notification using Resend
- **Files to create/modify**:
  - `src/lib/resend/report-card-email.tsx`
  - `src/mocks/resend/report-card-email.ts`
- **Requirements covered**: REQ-6.4.1, REQ-6.17.2
- **Acceptance criteria**:
  - Email includes pet photo, summary, CTA button
  - Responsive HTML email template
  - Mock implementation for development
  - Resend integration for production
  - Open/click tracking enabled

### 5.3. [ ] Create report card engagement tracking
- **Objective**: Track report card opens, ratings, and review generation
- **Files to create/modify**:
  - `src/lib/admin/report-card-analytics.ts`
  - `src/app/api/admin/report-cards/analytics/route.ts`
- **Requirements covered**: REQ-6.4.2, REQ-6.13.1
- **Acceptance criteria**:
  - Track: link clicks (open rate)
  - Track: rating submitted
  - Track: public review generated
  - Time to open, time to review calculated
  - Analytics available in admin dashboard

### 5.4. [ ] Create admin manual send/resend controls
- **Objective**: Allow admins to manually send or resend report cards
- **Files to create/modify**:
  - `src/components/admin/report-cards/ReportCardActions.tsx`
  - `src/app/api/admin/report-cards/[id]/send/route.ts`
- **Requirements covered**: REQ-6.4.3
- **Acceptance criteria**:
  - "Send Now" button on report card detail
  - "Resend" button for already-sent report cards
  - Confirmation dialog before send
  - Success toast notification

---

## Group 6: Waitlist Management Dashboard (Week 2)

### 6. [ ] Create WaitlistDashboard page at `/admin/waitlist`
- **Objective**: Build waitlist management page with filters and table
- **Files to create/modify**:
  - `src/app/(admin)/waitlist/page.tsx`
  - `src/components/admin/waitlist/WaitlistDashboard.tsx`
  - `src/app/api/admin/waitlist/route.ts`
- **Requirements covered**: REQ-6.5.1, REQ-6.5.2
- **Acceptance criteria**:
  - Page at `/admin/waitlist`
  - Lists all waitlist entries
  - Shows customer, pet, service, date, status
  - Status badges: active (blue), notified (yellow), booked (green), expired (gray), cancelled (red)

### 6.1. [ ] Create WaitlistFilters component
- **Objective**: Build filter controls for waitlist table
- **Files to create/modify**:
  - `src/components/admin/waitlist/WaitlistFilters.tsx`
- **Requirements covered**: REQ-6.5.1
- **Acceptance criteria**:
  - Date range filter
  - Service filter dropdown
  - Status multi-select filter
  - Search by customer name, pet name, phone
  - Sort by: date, created time, priority
  - Clear filters button

### 6.2. [ ] Create WaitlistStats component
- **Objective**: Build summary stats for waitlist dashboard
- **Files to create/modify**:
  - `src/components/admin/waitlist/WaitlistStats.tsx`
- **Requirements covered**: REQ-6.14.1
- **Acceptance criteria**:
  - Active count
  - Filled today count
  - Response rate percentage
  - Average wait time

### 6.3. [ ] Create WaitlistTable with action menu
- **Objective**: Build sortable, paginated waitlist table
- **Files to create/modify**:
  - `src/components/admin/waitlist/WaitlistTable.tsx`
  - `src/components/admin/waitlist/WaitlistRow.tsx`
  - `src/components/admin/waitlist/WaitlistActionMenu.tsx`
- **Requirements covered**: REQ-6.5.1, REQ-6.5.2, REQ-6.7.2
- **Acceptance criteria**:
  - Columns: Customer, Pet, Service, Requested Date, Time Preference, Status, Actions
  - Row click expands details (notes, added date)
  - Action menu: Book Now, Edit, Contact, Cancel
  - Pagination: 25 per page
  - Empty state with message

---

## Group 7: Waitlist Slot-Filling Automation (Week 2-3)

### 7. [ ] Create FillSlotModal component
- **Objective**: Build modal for filling open calendar slots from waitlist
- **Files to create/modify**:
  - `src/components/admin/waitlist/FillSlotModal.tsx`
  - `src/components/admin/waitlist/SlotSummary.tsx`
  - `src/components/admin/waitlist/MatchingWaitlistList.tsx`
- **Requirements covered**: REQ-6.6.1
- **Acceptance criteria**:
  - Modal triggered from appointment calendar empty slot click
  - Shows slot date/time and service
  - Queries matching waitlist entries (same service, date ±3 days)
  - Sorted by priority, then created date
  - Empty state if no matches

### 7.1. [ ] Create waitlist matching algorithm
- **Objective**: Build API to find matching waitlist entries for open slot
- **Files to create/modify**:
  - `src/app/api/admin/waitlist/match/route.ts`
  - `src/lib/admin/waitlist-matcher.ts`
- **Requirements covered**: REQ-6.6.1
- **Acceptance criteria**:
  - Match by service_id
  - Match by requested_date within ±3 days
  - Filter status = 'active' only
  - Return sorted by priority DESC, created_at ASC
  - Limit to top 10 matches

### 7.2. [ ] Create NotificationPreview and discount input
- **Objective**: Build SMS preview with customizable discount
- **Files to create/modify**:
  - `src/components/admin/waitlist/NotificationPreview.tsx`
  - `src/components/admin/waitlist/DiscountInput.tsx`
- **Requirements covered**: REQ-6.6.2
- **Acceptance criteria**:
  - SMS template preview with variable substitution
  - Discount percentage input (default 10%)
  - Response window input (default 2 hours)
  - Character count display

### 7.3. [ ] Implement slot offer creation and SMS sending
- **Objective**: Create slot offer and send SMS notifications
- **Files to create/modify**:
  - `src/app/api/admin/waitlist/fill-slot/route.ts`
  - `src/lib/twilio/waitlist-sms.ts`
  - `src/mocks/twilio/waitlist-sms.ts`
- **Requirements covered**: REQ-6.6.2
- **Acceptance criteria**:
  - Create waitlist_slot_offers record
  - Send SMS to selected waitlist customers
  - Update waitlist status to 'notified'
  - Set offer_expires_at on waitlist entries
  - Log notifications to notifications_log

### 7.4. [ ] Create Twilio incoming SMS webhook handler
- **Objective**: Handle "YES" replies for waitlist slot offers
- **Files to create/modify**:
  - `src/app/api/webhooks/twilio/incoming/route.ts`
  - `src/lib/admin/waitlist-response-handler.ts`
- **Requirements covered**: REQ-6.6.3
- **Acceptance criteria**:
  - Webhook validates Twilio signature
  - Finds active slot offer for phone number
  - "YES" reply triggers auto-booking
  - First responder wins (race condition handled)
  - Confirmation SMS sent to winner
  - "Slot filled" SMS sent to others

### 7.5. [ ] Implement slot offer expiration handling
- **Objective**: Handle expired slot offers
- **Files to create/modify**:
  - `src/lib/admin/waitlist-expiration.ts`
  - `src/app/api/cron/waitlist-expiration/route.ts`
- **Requirements covered**: REQ-6.6.4
- **Acceptance criteria**:
  - Cron job checks for expired offers
  - Expired offers marked status='expired'
  - Waitlist entries updated to status='expired_offer'
  - Slot returned to available inventory
  - Cleanup runs every 15 minutes

### 7.6. [ ] Create manual waitlist booking flow
- **Objective**: Allow admins to manually book from waitlist entry
- **Files to create/modify**:
  - `src/components/admin/waitlist/BookFromWaitlistModal.tsx`
  - `src/app/api/admin/waitlist/[id]/book/route.ts`
- **Requirements covered**: REQ-6.7.1
- **Acceptance criteria**:
  - "Book Now" button on waitlist entry
  - Opens booking flow with pre-filled customer, pet, service
  - Date/time picker for available slots
  - Optional discount application
  - Marks waitlist entry as 'booked' on success

---

## Group 8: Retention Marketing - Breed Reminders (Week 3)

### 8. [ ] Create breed-based reminder scheduler
- **Objective**: Build daily job to schedule grooming reminders based on breed frequency
- **Files to create/modify**:
  - `src/lib/admin/breed-reminder-scheduler.ts`
  - `src/app/api/cron/breed-reminders/route.ts`
- **Requirements covered**: REQ-6.8.1, REQ-6.8.4
- **Acceptance criteria**:
  - Cron job runs daily at 9 AM
  - Query pets where last_appointment + breed.frequency = today + 7 days
  - Skip if upcoming appointment exists
  - Skip if appointment within next 14 days
  - Create campaign_sends records
  - Mark as sent to prevent duplicates
  - Stop after 2 attempts if no response

### 8.1. [ ] Create reminder notification templates
- **Objective**: Build SMS and email templates for breed reminders
- **Files to create/modify**:
  - `src/lib/twilio/breed-reminder-sms.ts`
  - `src/lib/resend/breed-reminder-email.tsx`
  - `src/mocks/twilio/breed-reminder-sms.ts`
  - `src/mocks/resend/breed-reminder-email.ts`
- **Requirements covered**: REQ-6.8.2
- **Acceptance criteria**:
  - SMS: "Hi [name], [pet_name] is due for a groom [breed_message]! Book now: [link]"
  - Email with pet photo, breed-specific message, CTA
  - Customizable per breed (e.g., Poodle matting warning)
  - Booking link with tracking_id

### 8.2. [ ] Create reminder conversion tracking
- **Objective**: Track reminder engagement and conversion to bookings
- **Files to create/modify**:
  - `src/lib/admin/reminder-analytics.ts`
  - `src/app/api/track/[trackingId]/route.ts`
- **Requirements covered**: REQ-6.8.3
- **Acceptance criteria**:
  - Track: send date/time
  - Track: link clicked (via tracking redirect)
  - Track: booking created (match by customer + time window)
  - Calculate days to conversion
  - Calculate conversion rate by breed

---

## Group 9: Retention Marketing - Campaign Builder (Week 3)

### 9. [ ] Create CampaignBuilder page at `/admin/marketing/campaigns`
- **Objective**: Build campaign management page with list and create modal
- **Files to create/modify**:
  - `src/app/(admin)/marketing/campaigns/page.tsx`
  - `src/components/admin/marketing/CampaignList.tsx`
  - `src/app/api/admin/campaigns/route.ts`
- **Requirements covered**: REQ-6.9.1
- **Acceptance criteria**:
  - Page at `/admin/marketing/campaigns`
  - Lists campaigns by status: Active, Scheduled, Draft
  - Campaign cards show name, type, status, scheduled date, audience size
  - Create Campaign button opens modal
  - Edit/Delete actions on each campaign

### 9.1. [ ] Create CreateCampaignModal with type selection
- **Objective**: Build campaign creation modal with step flow
- **Files to create/modify**:
  - `src/components/admin/marketing/CreateCampaignModal.tsx`
  - `src/components/admin/marketing/CampaignTypeSelector.tsx`
- **Requirements covered**: REQ-6.9.1
- **Acceptance criteria**:
  - Step 1: Select campaign type (one-time or recurring)
  - Campaign name input
  - Multi-step wizard flow
  - Progress indicator

### 9.2. [ ] Create SegmentBuilder for audience targeting
- **Objective**: Build customer segmentation filters
- **Files to create/modify**:
  - `src/components/admin/marketing/SegmentBuilder.tsx`
  - `src/components/admin/marketing/SegmentFilters.tsx`
  - `src/app/api/admin/campaigns/segment-preview/route.ts`
- **Requirements covered**: REQ-6.9.1
- **Acceptance criteria**:
  - Filter by: Last visit date (days ago)
  - Filter by: Service type (multi-select)
  - Filter by: Pet breed (multi-select)
  - Filter by: Membership status
  - Audience size preview updates in real-time
  - AND logic between filters

### 9.3. [ ] Create MessageComposer for SMS/Email
- **Objective**: Build message editor with variable insertion
- **Files to create/modify**:
  - `src/components/admin/marketing/MessageComposer.tsx`
  - `src/components/admin/marketing/SMSEditor.tsx`
  - `src/components/admin/marketing/EmailEditor.tsx`
  - `src/components/admin/marketing/VariableInserter.tsx`
- **Requirements covered**: REQ-6.9.1
- **Acceptance criteria**:
  - SMS editor with 160 character limit indicator
  - Email editor with subject and rich text body
  - Variable insertion: {customer_name}, {pet_name}, {booking_link}
  - Preview with sample data

### 9.4. [ ] Create campaign scheduling and A/B test options
- **Objective**: Build schedule picker and A/B test configuration
- **Files to create/modify**:
  - `src/components/admin/marketing/ScheduleSection.tsx`
  - `src/components/admin/marketing/ABTestToggle.tsx`
- **Requirements covered**: REQ-6.9.1
- **Acceptance criteria**:
  - Date picker for scheduled send
  - Time picker with timezone display
  - Recurring config: daily, weekly, monthly
  - A/B test toggle with variant A/B editors
  - Split percentage selector (50/50 default)

### 9.5. [ ] Create campaign template presets
- **Objective**: Build pre-made campaign templates
- **Files to create/modify**:
  - `src/components/admin/marketing/TemplateSelector.tsx`
  - `src/lib/admin/campaign-templates.ts`
- **Requirements covered**: REQ-6.9.2
- **Acceptance criteria**:
  - Welcome new customers template
  - Win-back inactive (60+ days) template
  - Birthday/anniversary template
  - Seasonal promotions template
  - Membership renewal reminder template
  - Templates pre-fill segment and message

### 9.6. [ ] Implement campaign send functionality
- **Objective**: Build campaign execution with queue processing
- **Files to create/modify**:
  - `src/app/api/admin/campaigns/[id]/send/route.ts`
  - `src/lib/admin/campaign-sender.ts`
- **Requirements covered**: REQ-6.9.1, REQ-6.9.3
- **Acceptance criteria**:
  - Get audience based on segment criteria
  - Create campaign_sends records for each customer
  - Check unsubscribe status before sending
  - Queue notifications for background processing
  - Update campaign status: draft → scheduled → sending → sent
  - Track: sent count, delivered count

### 9.7. [ ] Create campaign performance tracking
- **Objective**: Build analytics for campaign performance
- **Files to create/modify**:
  - `src/components/admin/marketing/CampaignPerformance.tsx`
  - `src/app/api/admin/campaigns/[id]/analytics/route.ts`
- **Requirements covered**: REQ-6.9.3
- **Acceptance criteria**:
  - Show: sent count, delivered count
  - Show: click-through rate
  - Show: conversion rate (bookings)
  - Show: revenue generated
  - Show: unsubscribe rate
  - A/B test comparison if enabled

---

## Group 10: Analytics Dashboard (Week 3-4)

### 10. [ ] Create AnalyticsDashboard page at `/admin/analytics`
- **Objective**: Build analytics page with date range selector
- **Files to create/modify**:
  - `src/app/(admin)/analytics/page.tsx`
  - `src/components/admin/analytics/AnalyticsDashboard.tsx`
  - `src/components/admin/analytics/DateRangeSelector.tsx`
- **Requirements covered**: REQ-6.10.1
- **Acceptance criteria**:
  - Page at `/admin/analytics`
  - Date range presets: Today, Week, Month, Quarter, Year, Custom
  - Custom date picker for custom range
  - Export button for CSV/PDF
  - Loading skeletons for all sections

### 10.1. [ ] Install and configure Recharts library
- **Objective**: Set up charting library for analytics visualizations
- **Files to create/modify**:
  - `package.json` - Add recharts dependency
  - `src/components/admin/analytics/charts/index.ts`
- **Requirements covered**: REQ-6.11.1, REQ-6.11.2, REQ-6.11.3, REQ-6.11.4
- **Acceptance criteria**:
  - Recharts installed
  - Base chart wrapper component with responsive container
  - Design system colors applied to charts
  - Tooltip styling consistent with design

### 10.2. [ ] Create KPIGrid component with metrics
- **Objective**: Build KPI cards with current value and change percentage
- **Files to create/modify**:
  - `src/components/admin/analytics/KPIGrid.tsx`
  - `src/components/admin/analytics/KPICard.tsx`
  - `src/app/api/admin/analytics/kpis/route.ts`
- **Requirements covered**: REQ-6.12.1, REQ-6.12.2
- **Acceptance criteria**:
  - Total Revenue: current + change %
  - Total Appointments: current + change %
  - Avg Booking Value: current + change %
  - Retention Rate: current + change %
  - Review Generation Rate: current + change %
  - Waitlist Fill Rate: current + change %
  - Green arrow for positive change, red for negative
  - Click card for drill-down detail

### 10.3. [ ] Create AppointmentTrendChart line chart
- **Objective**: Build appointment trend visualization
- **Files to create/modify**:
  - `src/components/admin/analytics/charts/AppointmentTrendChart.tsx`
  - `src/app/api/admin/analytics/charts/appointments-trend/route.ts`
- **Requirements covered**: REQ-6.11.1
- **Acceptance criteria**:
  - Line chart showing appointments over time
  - Daily/weekly/monthly granularity based on date range
  - Previous period comparison line (dashed)
  - Trend indicator (up/down/flat)
  - Tooltip with exact values

### 10.4. [ ] Create RevenueChart bar chart
- **Objective**: Build revenue visualization with breakdown
- **Files to create/modify**:
  - `src/components/admin/analytics/charts/RevenueChart.tsx`
  - `src/app/api/admin/analytics/charts/revenue/route.ts`
- **Requirements covered**: REQ-6.11.2
- **Acceptance criteria**:
  - Bar chart showing revenue by month
  - Stacked bars: Services, Add-ons, Memberships
  - Average booking value trend line overlay
  - Legend with category labels

### 10.5. [ ] Create ServicePopularityChart pie chart
- **Objective**: Build service popularity visualization
- **Files to create/modify**:
  - `src/components/admin/analytics/charts/ServicePopularityChart.tsx`
  - `src/app/api/admin/analytics/charts/services/route.ts`
- **Requirements covered**: REQ-6.11.3
- **Acceptance criteria**:
  - Pie chart: services by count
  - Table: service name, count, revenue, avg price
  - Sortable table columns
  - Design system colors for pie segments

### 10.6. [ ] Create CustomerTypeChart and retention metrics
- **Objective**: Build customer analytics visualizations
- **Files to create/modify**:
  - `src/components/admin/analytics/charts/CustomerTypeChart.tsx`
  - `src/components/admin/analytics/charts/RetentionChart.tsx`
  - `src/app/api/admin/analytics/charts/customers/route.ts`
- **Requirements covered**: REQ-6.11.4
- **Acceptance criteria**:
  - Pie chart: New vs Returning customers
  - Line chart: Retention rate over time
  - Customer lifetime value metric
  - Churn rate metric

### 10.7. [ ] Create OperationalMetricsChart
- **Objective**: Build operational KPI visualizations
- **Files to create/modify**:
  - `src/components/admin/analytics/charts/OperationalMetricsChart.tsx`
  - `src/app/api/admin/analytics/charts/operations/route.ts`
- **Requirements covered**: REQ-6.11.5
- **Acceptance criteria**:
  - Add-on attachment rate
  - Cancellation rate
  - No-show rate
  - Average appointment duration
  - Groomer productivity (appointments per day)

### 10.8. [ ] Create analytics caching layer
- **Objective**: Implement 15-minute cache for analytics queries
- **Files to create/modify**:
  - `src/lib/admin/analytics-cache.ts`
  - `src/app/api/cron/analytics-refresh/route.ts`
- **Requirements covered**: REQ-6.10.1
- **Acceptance criteria**:
  - Check analytics_cache table before computing
  - Return cached data if not expired
  - Compute and cache new data if expired
  - 15-minute cache TTL
  - Cron job to pre-warm common date ranges

### 10.9. [ ] Create CSV/PDF export functionality
- **Objective**: Build data export for analytics
- **Files to create/modify**:
  - `src/components/admin/analytics/ExportMenu.tsx`
  - `src/lib/utils/csv-export.ts`
  - `src/lib/utils/analytics-pdf.ts`
- **Requirements covered**: REQ-6.10.1
- **Acceptance criteria**:
  - Export KPIs as CSV
  - Export chart data as CSV
  - Export full report as PDF
  - Date range included in export filename

---

## Group 11: Report Card & Waitlist Analytics (Week 4)

### 11. [ ] Create ReportCardAnalytics component
- **Objective**: Build report card metrics visualization
- **Files to create/modify**:
  - `src/components/admin/analytics/ReportCardAnalytics.tsx`
  - `src/app/api/admin/analytics/report-cards/route.ts`
- **Requirements covered**: REQ-6.13.1
- **Acceptance criteria**:
  - Report cards sent (count, %)
  - Report cards opened (count, %, avg time to open)
  - Reviews submitted (count, %, avg rating)
  - Public reviews generated (count, %)
  - Review funnel visualization (sent → opened → rated → reviewed)

### 11.1. [ ] Create WaitlistAnalytics component
- **Objective**: Build waitlist metrics visualization
- **Files to create/modify**:
  - `src/components/admin/analytics/WaitlistAnalytics.tsx`
  - `src/app/api/admin/analytics/waitlist/route.ts`
- **Requirements covered**: REQ-6.14.1
- **Acceptance criteria**:
  - Active waitlist count
  - Fill rate (filled / total)
  - Response rate to slot offers
  - Average wait time (days)
  - Conversion to booking rate

### 11.2. [ ] Create MarketingAnalytics component
- **Objective**: Build retention marketing metrics visualization
- **Files to create/modify**:
  - `src/components/admin/analytics/MarketingAnalytics.tsx`
  - `src/app/api/admin/analytics/marketing/route.ts`
- **Requirements covered**: REQ-6.15.1
- **Acceptance criteria**:
  - Reminders sent
  - Click-through rate
  - Booking conversion rate
  - Revenue from reminders
  - Cost per acquisition (SMS costs)

---

## Group 12: Groomer Performance Dashboard (Week 4)

### 12. [ ] Create GroomerPerformanceDashboard component
- **Objective**: Build per-groomer performance analytics
- **Files to create/modify**:
  - `src/components/admin/analytics/GroomerPerformanceDashboard.tsx`
  - `src/components/admin/analytics/GroomerSelector.tsx`
  - `src/app/api/admin/analytics/groomers/route.ts`
- **Requirements covered**: REQ-6.16.1
- **Acceptance criteria**:
  - Groomer dropdown/tabs selector
  - Appointments completed
  - Average rating (from report card reviews)
  - Revenue generated
  - Add-on attachment rate
  - Completion time vs scheduled time

### 12.1. [ ] Create groomer comparison view
- **Objective**: Build side-by-side groomer comparison
- **Files to create/modify**:
  - `src/components/admin/analytics/GroomerComparisonTable.tsx`
  - `src/components/admin/analytics/GroomerLeaderboard.tsx`
- **Requirements covered**: REQ-6.16.2
- **Acceptance criteria**:
  - Side-by-side metrics comparison
  - Leaderboard view sorted by metric
  - Identify training opportunities (below average metrics highlighted)
  - Export comparison as CSV

---

## Group 13: Notification Center (Week 4)

### 13. [ ] Create NotificationCenter page at `/admin/notifications`
- **Objective**: Build notification history page
- **Files to create/modify**:
  - `src/app/(admin)/notifications/page.tsx`
  - `src/components/admin/notifications/NotificationCenter.tsx`
  - `src/app/api/admin/notifications/route.ts`
- **Requirements covered**: REQ-6.17.1
- **Acceptance criteria**:
  - Page at `/admin/notifications`
  - Lists all sent notifications (SMS + Email)
  - Table: Type icon, Recipient, Subject/Preview, Status, Timestamp, Actions
  - Pagination: 50 per page

### 13.1. [ ] Create NotificationFilters component
- **Objective**: Build filter controls for notification history
- **Files to create/modify**:
  - `src/components/admin/notifications/NotificationFilters.tsx`
- **Requirements covered**: REQ-6.17.1
- **Acceptance criteria**:
  - Filter by: Type (SMS, Email, Both)
  - Filter by: Status (Sent, Failed, Pending)
  - Filter by: Date range
  - Search by: Customer name, email, phone
  - Clear filters button

### 13.2. [ ] Create NotificationStats component
- **Objective**: Build notification summary stats
- **Files to create/modify**:
  - `src/components/admin/notifications/NotificationStats.tsx`
- **Requirements covered**: REQ-6.17.1
- **Acceptance criteria**:
  - Total sent count
  - Delivery rate percentage
  - Click rate percentage
  - Cost to date (if tracking SMS costs)

### 13.3. [ ] Create NotificationDetailModal
- **Objective**: Build notification detail view with resend action
- **Files to create/modify**:
  - `src/components/admin/notifications/NotificationDetailModal.tsx`
  - `src/app/api/admin/notifications/[id]/resend/route.ts`
- **Requirements covered**: REQ-6.17.1
- **Acceptance criteria**:
  - Shows full message content
  - Shows delivery timeline (sent, delivered, clicked)
  - Error details for failed notifications
  - Resend button for failed notifications
  - Link to customer profile

### 13.4. [ ] Create bulk resend failed notifications
- **Objective**: Allow bulk resend of failed notifications
- **Files to create/modify**:
  - `src/components/admin/notifications/BulkActions.tsx`
  - `src/app/api/admin/notifications/bulk-resend/route.ts`
- **Requirements covered**: REQ-6.17.1
- **Acceptance criteria**:
  - "Resend Failed" button in bulk actions
  - Confirmation dialog with count
  - Progress indicator during resend
  - Success/failure summary

---

## Group 14: Settings & Configuration (Week 4)

### 14. [ ] Add Phase 6 settings to admin settings page
- **Objective**: Create configuration options for Phase 6 features
- **Files to create/modify**:
  - `src/app/(admin)/settings/page.tsx` - Add Phase 6 sections
  - `src/components/admin/settings/ReportCardSettings.tsx`
  - `src/components/admin/settings/WaitlistSettings.tsx`
  - `src/components/admin/settings/MarketingSettings.tsx`
- **Requirements covered**: REQ-6.18.1
- **Acceptance criteria**:
  - Report card auto-send delay (minutes)
  - Report card expiration days
  - Google Business review URL
  - Waitlist response window (hours)
  - Waitlist discount percentage
  - Retention reminder advance days
  - SMS/Email template customization

### 14.1. [ ] Create template editor for notifications
- **Objective**: Build admin UI for editing notification templates
- **Files to create/modify**:
  - `src/components/admin/settings/TemplateEditor.tsx`
  - `src/app/api/admin/settings/templates/route.ts`
- **Requirements covered**: REQ-6.18.1
- **Acceptance criteria**:
  - List of template types: Report card, Waitlist offer, Breed reminder, etc.
  - Edit SMS and Email content
  - Variable placeholder insertion
  - Preview with sample data
  - Reset to default option

---

## Group 15: Integration & Polish (Week 4)

### 15. [ ] Add "Fill from Waitlist" button to appointment calendar
- **Objective**: Integrate waitlist fill functionality into calendar
- **Files to create/modify**:
  - `src/components/admin/appointments/AppointmentCalendar.tsx`
- **Requirements covered**: REQ-6.6.1
- **Acceptance criteria**:
  - Click empty time slot shows "Fill from Waitlist" button
  - Button opens FillSlotModal
  - Badge shows matching waitlist count

### 15.1. [ ] Add report card link to appointment detail modal
- **Objective**: Integrate report card into appointment workflow
- **Files to create/modify**:
  - `src/components/admin/appointments/AppointmentDetailModal.tsx`
- **Requirements covered**: REQ-6.1.3
- **Acceptance criteria**:
  - "Create Report Card" button on completed appointments
  - "View Report Card" button if report card exists
  - Report card status indicator (draft/sent/viewed)

### 15.2. [ ] Add analytics navigation to admin sidebar
- **Objective**: Add navigation links for new Phase 6 pages
- **Files to create/modify**:
  - `src/components/admin/AdminSidebar.tsx`
- **Requirements covered**: REQ-6.10.1, REQ-6.5.1, REQ-6.9.1, REQ-6.17.1
- **Acceptance criteria**:
  - Analytics link with chart icon
  - Waitlist link with list icon
  - Marketing link with megaphone icon
  - Notifications link with bell icon
  - Owner-only restrictions where applicable

### 15.3. [ ] Create loading skeletons for Phase 6 pages
- **Objective**: Add loading states for all new pages
- **Files to create/modify**:
  - `src/components/admin/skeletons/AnalyticsSkeleton.tsx`
  - `src/components/admin/skeletons/WaitlistSkeleton.tsx`
  - `src/components/admin/skeletons/CampaignSkeleton.tsx`
  - `src/components/admin/skeletons/NotificationSkeleton.tsx`
- **Acceptance criteria**:
  - Skeleton matches content layout
  - Pulse animation
  - Smooth fade transition to content

### 15.4. [ ] Add empty states for Phase 6 lists
- **Objective**: Create helpful empty states with action buttons
- **Files to create/modify**:
  - Update all Phase 6 list components with EmptyState
- **Acceptance criteria**:
  - Waitlist: "No waitlist entries" with illustration
  - Campaigns: "No campaigns yet" with "Create Campaign" button
  - Notifications: "No notifications" message
  - Analytics: Meaningful zero-state messages

### 15.5. [ ] Implement error handling for Phase 6 features
- **Objective**: Add error states and retry logic
- **Files to create/modify**:
  - Update all Phase 6 components with error handling
- **Acceptance criteria**:
  - Data fetch failures show retry button
  - Mutation failures show toast with message
  - Network errors handled gracefully
  - SMS/Email failures don't block other operations

### 15.6. [ ] Write unit tests for Phase 6 critical logic
- **Objective**: Test waitlist matching, reminder scheduling, analytics calculations
- **Files to create/modify**:
  - `src/lib/admin/__tests__/waitlist-matcher.test.ts`
  - `src/lib/admin/__tests__/breed-reminder-scheduler.test.ts`
  - `src/lib/admin/__tests__/analytics-calculations.test.ts`
- **Acceptance criteria**:
  - Waitlist matching algorithm tests
  - Breed reminder eligibility tests
  - KPI calculation tests
  - Review routing logic tests

### 15.7. [ ] Write E2E tests for key Phase 6 flows
- **Objective**: Test critical Phase 6 workflows end-to-end
- **Files to create/modify**:
  - `e2e/admin/report-cards.spec.ts`
  - `e2e/admin/waitlist.spec.ts`
  - `e2e/admin/analytics.spec.ts`
- **Acceptance criteria**:
  - Create report card → view public page → submit review
  - Fill slot from waitlist → simulate SMS response
  - View analytics dashboard → change date range → export data

---

## Summary

| Group | Tasks | Description |
|-------|-------|-------------|
| 1 | 3 | Database Schema & Foundation |
| 2 | 7 | Report Card System - Admin Form |
| 3 | 7 | Report Card System - Public Page |
| 4 | 3 | Review System Integration |
| 5 | 5 | Report Card Automation |
| 6 | 4 | Waitlist Management Dashboard |
| 7 | 7 | Waitlist Slot-Filling Automation |
| 8 | 3 | Retention Marketing - Breed Reminders |
| 9 | 8 | Retention Marketing - Campaign Builder |
| 10 | 10 | Analytics Dashboard |
| 11 | 3 | Report Card & Waitlist Analytics |
| 12 | 2 | Groomer Performance Dashboard |
| 13 | 5 | Notification Center |
| 14 | 2 | Settings & Configuration |
| 15 | 8 | Integration & Polish |

**Total Tasks**: 77

**Estimated Duration**: 4 weeks

**Critical Path**: Group 1 → Group 2 → Group 3 → Group 4 → Groups 5-9 (parallel) → Group 10 → Groups 11-13 (parallel) → Group 14 → Group 15

**High Priority Features** (implement first):
1. Report Card System (Groups 2-5) - Highest business value
2. Waitlist Management (Groups 6-7) - Revenue recovery
3. Analytics Dashboard (Group 10) - Business insights
4. Breed Reminders (Group 8) - Customer retention
