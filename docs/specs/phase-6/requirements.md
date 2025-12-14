# Phase 6: Admin Panel Advanced Features - Requirements

**Objective**: Build report cards, review system, retention marketing, waitlist management, and analytics dashboard.

**Status**: Planning
**Priority**: High
**Estimated Duration**: 3-4 weeks

---

## 1. Paw-gress Report Cards & Review System

### 1.1 Groomer Input Form (Tablet-Friendly)

**REQ-6.1.1**: The system SHALL provide a tablet-optimized form for groomers to create report cards
- **Input Fields**:
  - Mood: Happy / Nervous / Calm / Energetic (quick-tap buttons)
  - Coat Condition: Excellent / Good / Matted / Needs Attention (quick-tap)
  - Behavior: Great / Some Difficulty / Required Extra Care (quick-tap)
  - Health Observations: Checkboxes (Skin irritation, Ear infection signs, Fleas/ticks, Lumps, Overgrown nails, Dental issues)
  - Before photo upload (optional)
  - After photo upload (required)
  - Groomer notes (textarea, optional)
  - "Don't send report card" toggle
- **UX Requirements**:
  - Large touch targets (min 44x44px)
  - One-handed operation support
  - Auto-save draft functionality
  - Quick access from appointment detail page
  - Works offline, syncs when online

**REQ-6.1.2**: The system SHALL validate report card submissions
- After photo is required
- At least one assessment field must be filled
- Health observations automatically flag appointment for follow-up if critical issues detected

**REQ-6.1.3**: The system SHALL link report cards to appointments
- One report card per appointment
- Report card status shows on appointment detail
- Groomer can edit report card within 24 hours of creation

### 1.2 Customer Report Card Page

**REQ-6.2.1**: The system SHALL provide a public report card page at `/report-cards/[id]`
- Shareable URL (no login required)
- Expires after 90 days (configurable)
- Tracks view count and timestamp

**REQ-6.2.2**: The report card page SHALL display:
- Hero section with after photo
- Pet name and service date
- Assessment cards with icons (mood, coat, behavior)
- Health observations with recommendations (if any)
- Groomer notes
- Before/After photo comparison (if before photo exists)
- Groomer name and signature
- Business branding

**REQ-6.2.3**: The report card page SHALL be mobile-responsive
- Optimized for mobile viewing
- Downloadable as PDF
- Social media share buttons

### 1.3 Integrated Review System

**REQ-6.3.1**: The system SHALL display a review prompt on the report card page
- 5-star rating selector
- Positioned after report card content
- Only shown if review not already submitted

**REQ-6.3.2**: The system SHALL route reviews based on rating:
- **4-5 stars**: "Would you share this on Google?" → Link to Google Business review page
- **1-3 stars**: Private feedback form → Sent to admin dashboard, not public
- Track: Rating submitted, public review generated

**REQ-6.3.3**: The system SHALL store review data
- Customer ID, appointment ID, rating, feedback, timestamp
- Flag low ratings for admin follow-up
- Analytics: Review generation rate, average rating

**REQ-6.3.4**: The system SHALL prevent duplicate reviews
- One review per report card
- Show "Thank you" message if already reviewed

### 1.4 Report Card Automation

**REQ-6.4.1**: The system SHALL send report cards automatically
- Trigger: X minutes after appointment status changes to "completed" (configurable in settings)
- Default: 15 minutes after completion
- Delivery: SMS + Email with link to report card

**REQ-6.4.2**: The system SHALL track report card engagement
- Open rate (link clicks)
- Rating submitted (yes/no)
- Public review generated (yes/no)
- Time to open, time to review

**REQ-6.4.3**: The system SHALL provide admin override
- Admin can manually send/resend report card
- Admin can mark "Do not send" per appointment
- Admin can edit report card before sending

---

## 2. Waitlist Management

### 2.1 Waitlist Dashboard

**REQ-6.5.1**: The system SHALL provide a waitlist management page at `/admin/waitlist`
- View all waitlist entries
- Filter by: Date, Service, Status (active/notified/booked/expired/cancelled)
- Sort by: Date, Created time, Priority
- Search by: Customer name, Pet name, Phone

**REQ-6.5.2**: The system SHALL display waitlist entry details:
- Customer name, phone, email
- Pet name, size
- Requested service
- Requested date
- Time preference (morning/afternoon/any)
- Added date/time
- Status badge
- Notes

### 2.2 Slot Filling Automation

**REQ-6.6.1**: The system SHALL provide a "Fill Slot" action on the appointments calendar
- Click on open time slot → "Fill from Waitlist" button
- Shows matching waitlist customers (same service, same/nearby date)
- Sorted by: Priority, Request date

**REQ-6.6.2**: The system SHALL send SMS notifications to waitlist customers
- Template: "Hi [name]! A spot opened for [service] on [date] at [time]. Reply YES to book with 10% off (expires in 2 hours)."
- Configurable discount percentage
- Configurable response window (default: 2 hours)

**REQ-6.6.3**: The system SHALL process waitlist responses
- First customer to reply "YES" gets the slot
- Auto-book appointment with discount applied
- Send confirmation SMS/Email
- Update waitlist status to "booked"
- Notify other customers: "Slot was filled. You're still on the waitlist!"

**REQ-6.6.4**: The system SHALL handle expiration
- Mark slot offer as expired after response window
- Return slot to available inventory
- Update waitlist entry status to "expired_offer"

### 2.3 Manual Waitlist Operations

**REQ-6.7.1**: The system SHALL allow admins to manually book from waitlist
- "Book Now" action on waitlist entry
- Opens booking flow with pre-filled info
- Marks waitlist entry as "booked"

**REQ-6.7.2**: The system SHALL allow waitlist entry management
- Edit entry details
- Add notes
- Cancel/remove entry
- Contact customer (click-to-call, click-to-SMS)

---

## 3. Automated Retention Marketing

### 3.1 Breed-Based Reminder System

**REQ-6.8.1**: The system SHALL schedule grooming reminders based on breed frequency
- Use `breeds.grooming_frequency_weeks` to calculate next groom date
- Schedule reminder X days before due date (configurable per breed)
- Default: 7 days before due date

**REQ-6.8.2**: The system SHALL send reminder notifications
- Delivery: SMS + Email
- Template: "Hi [customer_name], [pet_name] is due for a groom [breed_message]! Book now: [booking_link]"
- Customizable per breed (e.g., "Poodles need grooming every 4-6 weeks to prevent matting")

**REQ-6.8.3**: The system SHALL track reminder effectiveness
- Send date/time
- Clicked link (yes/no)
- Booked appointment (yes/no)
- Days to conversion
- Conversion rate by breed

**REQ-6.8.4**: The system SHALL handle reminder logic
- Only send if no upcoming appointment scheduled
- Skip if appointment within next 14 days
- Mark as sent to prevent duplicates
- Stop after 2 attempts if no response

### 3.2 Custom Campaigns

**REQ-6.9.1**: The system SHALL provide a campaign builder at `/admin/marketing/campaigns`
- Create one-time or recurring campaigns
- Segment customers by: Last visit date, Service type, Pet breed, Membership status
- Schedule send date/time
- A/B test messages

**REQ-6.9.2**: The system SHALL support campaign templates
- Welcome new customers
- Win-back inactive customers (60+ days)
- Birthday/anniversary messages
- Seasonal promotions
- Membership renewal reminders

**REQ-6.9.3**: The system SHALL track campaign performance
- Sent count
- Delivered count
- Click-through rate
- Conversion rate (bookings)
- Revenue generated
- Unsubscribe rate

---

## 4. Analytics Dashboard

### 4.1 Dashboard Overview

**REQ-6.10.1**: The system SHALL provide an analytics page at `/admin/analytics`
- Date range selector (Today, Week, Month, Quarter, Year, Custom)
- Export data as CSV
- Print/PDF reports

### 4.2 Charts & Visualizations

**REQ-6.11.1**: The system SHALL display appointment trends
- Line chart: Appointments over time (daily/weekly/monthly)
- Comparison to previous period
- Trend indicator (up/down/flat)

**REQ-6.11.2**: The system SHALL display revenue analytics
- Bar chart: Revenue by month
- Line chart: Average booking value over time
- Revenue breakdown: Services vs Add-ons vs Memberships

**REQ-6.11.3**: The system SHALL display service popularity
- Pie chart: Popular services (by count)
- Bar chart: Revenue by service
- Table: Service performance (count, revenue, avg price)

**REQ-6.11.4**: The system SHALL display customer analytics
- Pie chart: New vs Returning customers
- Retention rate over time
- Customer lifetime value
- Churn rate

**REQ-6.11.5**: The system SHALL display operational metrics
- Add-on attachment rate (% appointments with add-ons)
- Cancellation rate
- No-show rate
- Average appointment duration
- Groomer productivity (appointments per day)

### 4.3 Key Performance Indicators (KPIs)

**REQ-6.12.1**: The system SHALL display top-level KPIs:
- Total Revenue (current period + change %)
- Total Appointments (current period + change %)
- Average Booking Value (current period + change %)
- Customer Acquisition Rate
- Customer Retention Rate
- Review Generation Rate (reviews / completed appointments)
- Retention Reminder Conversion Rate

**REQ-6.12.2**: The system SHALL provide drill-down capability
- Click KPI card to see detailed breakdown
- Filter by date range, service, groomer
- Export detailed data

### 4.4 Report Card Analytics

**REQ-6.13.1**: The system SHALL track report card metrics:
- Report cards sent (count, %)
- Report cards opened (count, %, avg time to open)
- Reviews submitted (count, %, avg rating)
- Public reviews generated (count, %)
- Review generation funnel visualization

### 4.5 Waitlist Analytics

**REQ-6.14.1**: The system SHALL track waitlist metrics:
- Active waitlist count
- Fill rate (filled / total waitlist entries)
- Response rate to slot offers
- Average wait time
- Conversion to booking

### 4.6 Marketing Analytics

**REQ-6.15.1**: The system SHALL track retention marketing metrics:
- Reminders sent
- Click-through rate
- Booking conversion rate
- Revenue from reminders
- Cost per acquisition (if SMS costs tracked)

---

## 5. Additional Features

### 5.1 Groomer Performance Dashboard

**REQ-6.16.1**: The system SHALL provide per-groomer analytics
- Appointments completed
- Average rating (from report cards)
- Revenue generated
- Add-on attachment rate
- Completion time vs scheduled time

**REQ-6.16.2**: The system SHALL allow groomer comparison
- Side-by-side metrics
- Leaderboard view
- Identify training opportunities

### 5.2 Notification Center

**REQ-6.17.1**: The system SHALL provide a notification history page at `/admin/notifications`
- View all sent notifications (SMS + Email)
- Filter by: Type, Status, Date, Customer
- Resend failed notifications
- Track delivery status

**REQ-6.17.2**: The system SHALL integrate with SMS/Email providers
- Twilio for SMS (production)
- Resend for Email (production)
- Mock providers for development
- Track costs and usage

### 5.3 Settings & Configuration

**REQ-6.18.1**: The system SHALL provide configuration options at `/admin/settings`
- Report card auto-send delay (minutes)
- Waitlist response window (hours)
- Waitlist discount percentage
- Retention reminder advance days
- Google Business review URL
- SMS/Email templates
- Analytics date ranges

---

## Acceptance Criteria

- [ ] Report card form works on tablet (touch-optimized)
- [ ] Report card form auto-saves drafts
- [ ] Report card page renders beautifully on mobile
- [ ] Report card page downloadable as PDF
- [ ] Review routing works (4-5 → Google, 1-3 → feedback)
- [ ] Reviews prevent duplicates
- [ ] Report cards sent automatically after appointment completion
- [ ] Report card engagement tracked (opens, ratings)
- [ ] Waitlist dashboard displays all entries with filters
- [ ] "Fill Slot" sends SMS to matching customers
- [ ] First "YES" response auto-books with discount
- [ ] Waitlist offers expire after response window
- [ ] Breed-based reminders scheduled automatically
- [ ] Reminders send X days before due date
- [ ] Reminder conversion tracked
- [ ] Analytics dashboard displays all charts
- [ ] KPIs show current period + change %
- [ ] Date range selector works
- [ ] Data exportable as CSV
- [ ] Groomer performance dashboard accessible
- [ ] Notification history viewable and filterable
- [ ] All settings configurable in admin panel
- [ ] SMS integration works with Twilio (production)
- [ ] Email integration works with Resend (production)
- [ ] Mock providers work in development mode

---

## Technical Considerations

### Data Models
- `report_cards` table (already exists)
- `reviews` table (new)
- `waitlist` table (already exists)
- `marketing_campaigns` table (new)
- `notification_history` table (new - or extend `notifications_log`)
- `analytics_cache` table (new - for performance)

### External Integrations
- **Twilio**: SMS for waitlist, reminders, campaigns
- **Resend**: Email for report cards, reminders, campaigns
- **Google Business API**: Review link generation
- **Recharts or Chart.js**: Analytics visualizations
- **jsPDF**: Report card PDF generation

### Performance
- Cache analytics data (refresh every 15 minutes)
- Background jobs for reminder scheduling
- Queue system for bulk notifications
- Index on frequently queried date ranges

### Security
- Report card URLs use UUID, not sequential IDs
- Rate limiting on SMS/Email sends
- Unsubscribe links in all marketing emails
- SMS opt-out handling ("STOP" keyword)

---

## Dependencies

- Phase 5 (Admin Panel Core) must be complete
- Twilio account and phone number
- Resend account and domain verification
- Google Business listing and review URL
- Breed grooming frequency data populated

---

## Notes

- Report cards are the #1 feature for customer delight and review generation
- Waitlist automation can recover 20-30% of lost bookings
- Breed-based reminders increase retention by 40%+
- Analytics help identify growth opportunities

**Next Steps**:
1. Create design document with wireframes
2. Create task breakdown
3. Set up external service accounts (Twilio, Resend)
4. Begin implementation with report cards (highest value)
