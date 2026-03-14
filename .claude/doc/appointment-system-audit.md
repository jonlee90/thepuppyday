Booking & Appointment Lifecycle

  Type: booking_confirmation
  What It Does: Sent when a customer books an appointment
  Email: ON
  SMS: OFF
  Templates: email + sms
  Status: 2 sent, 4 failed — working but has failures
  ────────────────────────────────────────
  Type: appointment_reminder
  What It Does: Automated reminder before appointment (hourly cron check)
  Email: ON
  SMS: OFF
  Templates: sms only
  Status: Scheduled (0 * * * *) but no email template exists — email is enabled
    with no template
  ────────────────────────────────────────
  Type: appointment_cancelled
  What It Does: Sent when appointment is cancelled
  Email: ON
  SMS: OFF
  Templates: none
  Status: No templates — won't send anything
  ────────────────────────────────────────
  Type: appointment_rescheduled
  What It Does: Sent when appointment is rescheduled
  Email: ON
  SMS: OFF
  Templates: none
  Status: No templates — won't send anything

  Appointment Status Updates

  Type: status_checked_in
  What It Does: Customer notified their pet is checked in
  Email: OFF
  SMS: OFF
  Templates: sms only
  Status: Disabled — template exists but both channels off
  ────────────────────────────────────────
  Type: status_in_progress
  What It Does: Customer notified grooming has started
  Email: OFF
  SMS: OFF
  Templates: none
  Status: Disabled, no templates
  ────────────────────────────────────────
  Type: status_completed
  What It Does: Customer notified grooming is done
  Email: ON
  SMS: OFF
  Templates: none
  Status: Email enabled but no templates — won't send
  ────────────────────────────────────────
  Type: status_ready
  What It Does: "Ready for pickup" notification
  Email: OFF
  SMS: OFF
  Templates: sms only
  Status: Disabled — template exists but both channels off

  Report Cards & Reviews

  Type: report_card_ready
  What It Does: Sends grooming report card with before/after photos
  Email: ON
  SMS: OFF
  Templates: email + sms
  Status: Email enabled, templates ready
  ────────────────────────────────────────
  Type: review_request
  What It Does: Asks customer to leave a review after grooming
  Email: ON
  SMS: OFF
  Templates: none
  Status: No templates — won't send

  Waitlist

  Type: waitlist_added
  What It Does: Confirms customer was added to waitlist
  Email: ON
  SMS: OFF
  Templates: none
  Status: No templates — won't send
  ────────────────────────────────────────
  Type: waitlist_available
  What It Does: Notifies customer a slot opened up (2hr claim window)
  Email: ON
  SMS: OFF
  Templates: sms only
  Status: Email enabled but only SMS template exists

  Membership

  ┌─────────────────────┬─────────────┬──────┬─────┬──────────┬──────────┐
  │        Type         │  What It    │ Emai │ SMS │ Template │  Status  │
  │                     │    Does     │  l   │     │    s     │          │
  ├─────────────────────┼─────────────┼──────┼─────┼──────────┼──────────┤
  │                     │ Welcome     │      │     │          │          │
  │ membership_activate │ email when  │ ON   │ OFF │ none     │ No templ │
  │ d                   │ membership  │      │     │          │ ates     │
  │                     │ starts      │      │     │          │          │
  ├─────────────────────┼─────────────┼──────┼─────┼──────────┼──────────┤
  │                     │ Confirms    │      │     │          │ No templ │
  │ membership_renewed  │ membership  │ ON   │ OFF │ none     │ ates     │
  │                     │ renewal     │      │     │          │          │
  ├─────────────────────┼─────────────┼──────┼─────┼──────────┼──────────┤
  │                     │ Warns       │      │     │          │          │
  │ membership_expiring │ membership  │ ON   │ OFF │ none     │ No templ │
  │                     │ is about to │      │     │          │ ates     │
  │                     │  expire     │      │     │          │          │
  ├─────────────────────┼─────────────┼──────┼─────┼──────────┼──────────┤
  │                     │ Confirms    │      │     │          │          │
  │ membership_cancelle │ membership  │ ON   │ OFF │ none     │ No templ │
  │ d                   │ cancellatio │      │     │          │ ates     │
  │                     │ n           │      │     │          │          │
  └─────────────────────┴─────────────┴──────┴─────┴──────────┴──────────┘

  Payments (Phase 7 — Not Yet Built)

  Type: payment_success
  What It Does: Payment receipt
  Email: OFF
  SMS: OFF
  Templates: email
  Status: Disabled — template exists for future use
  ────────────────────────────────────────
  Type: payment_failed
  What It Does: Payment failure notice
  Email: OFF
  SMS: OFF
  Templates: 2 email templates
  Status: Disabled — templates ready for future use
  ────────────────────────────────────────
  Type: payment_reminder
  What It Does: Upcoming payment reminder
  Email: OFF
  SMS: OFF
  Templates: email
  Status: Disabled — template exists for future use
  ────────────────────────────────────────
  Type: refund_processed
  What It Does: Refund confirmation
  Email: OFF
  SMS: OFF
  Templates: none
  Status: Disabled, no templates

  Admin Notifications

  ┌────────────────────┬──────────────┬───────┬─────┬───────────┬───────────┐
  │        Type        │ What It Does │ Email │ SMS │ Templates │  Status   │
  ├────────────────────┼──────────────┼───────┼─────┼───────────┼───────────┤
  │                    │ Alerts admin │       │     │           │ Disabled, │
  │ admin_new_booking  │  of new      │ OFF   │ OFF │ none      │  no       │
  │                    │ booking      │       │     │           │ templates │
  ├────────────────────┼──────────────┼───────┼─────┼───────────┼───────────┤
  │                    │ Alerts admin │       │     │           │ Disabled, │
  │ admin_cancellation │  of          │ OFF   │ OFF │ none      │  no       │
  │                    │ cancellation │       │     │           │ templates │
  ├────────────────────┼──────────────┼───────┼─────┼───────────┼───────────┤
  │                    │ Alerts admin │       │     │           │ Disabled, │
  │ admin_no_show      │  of no-show  │ OFF   │ OFF │ none      │  no       │
  │                    │              │       │     │           │ templates │
  └────────────────────┴──────────────┴───────┴─────┴───────────┴───────────┘

  Retention & Marketing

  Type: retention_reminder
  What It Does: Re-engagement for customers inactive 30+ days
  Email: ON
  SMS: OFF
  Templates: email + sms
  Status: Scheduled (0 9 * * * — daily 9 AM), templates ready
  ────────────────────────────────────────
  Type: birthday_greeting
  What It Does: Birthday message for pets/customers
  Email: OFF
  SMS: OFF
  Templates: none
  Status: Scheduled (0 8 * * *) but disabled with no templates

  ---
  Key Issues Found

  1. booking_confirmation has a 67% failure rate (4 failed vs 2 sent) — the only
   notification that's actually been used. Worth investigating the failures.
  2. SMS is OFF on everything — no notification type has SMS enabled, even
  though SMS templates exist for booking confirmation, report card, appointment
  reminder, status updates, waitlist, and retention.
  3. 11 types have email enabled but no templates — these are effectively dead
  toggles (appointment_cancelled, appointment_rescheduled, status_completed,
  review_request, waitlist_added,
  membership_activated/renewed/expiring/cancelled, and partially
  waitlist_available and appointment_reminder).
  4. Payment notifications are properly disabled since Phase 7 (Payments/Stripe)
   isn't built yet. The templates are pre-loaded and ready.
  5. Status notifications (checked_in, ready) have SMS templates but are
  disabled — these are the "your pet is checked in" / "ready for pickup" texts
  that most grooming businesses use heavily. You'd likely want these on.