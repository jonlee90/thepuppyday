# Price Adjustments for Appointments - Requirements

## EARS Format Requirements

### Ubiquitous Requirements

REQ-1: The system shall store appointment price adjustments in a separate `appointment_price_adjustments` table with full audit trail (who created, when, label, amount, note).

REQ-2: The system shall support both positive adjustments (surcharges) and negative adjustments (discounts) as line items.

REQ-3: The system shall automatically recalculate `appointments.total_price` whenever adjustments are added or removed.

### Event-Driven Requirements

REQ-4: When an admin adds a price adjustment, the system shall immediately persist it and show a success toast notification.

REQ-5: When an admin removes a price adjustment, the system shall immediately delete it, recalculate the total, and show a success toast notification.

REQ-6: When an appointment's detail modal is opened, the system shall fetch and display all associated price adjustments in the pricing section.

### State-Driven Requirements

REQ-7: While viewing an appointment in the detail modal, the pricing section shall display all adjustments as line items between add-ons and the total.

REQ-8: While editing an appointment in the detail modal, the pricing section shall allow adding and removing adjustments with label, amount, and optional note fields.

### Unwanted Behavior Requirements

REQ-9: The system shall not allow a price adjustment without a label.

REQ-10: The system shall not allow a price adjustment with a zero amount.

REQ-11: The system shall not allow non-admin users to create, modify, or delete price adjustments.

## User Stories

US-1: As an admin, I want to add a surcharge (e.g., +$10 de-matting fee) to an appointment so the total reflects extra work performed.

US-2: As an admin, I want to add a discount (e.g., -$5 loyalty discount) to an appointment so the total reflects promotional pricing.

US-3: As an admin, I want to see all adjustments as line items in the appointment detail so I have a clear pricing breakdown.

US-4: As an admin, I want to remove an adjustment I added in error so the pricing is accurate.
