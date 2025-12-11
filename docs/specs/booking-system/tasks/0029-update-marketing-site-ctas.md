# Task 29: Update Marketing Site CTAs to Link to Booking Page

## Description
Update all "Book Appointment" CTAs throughout the marketing site to link to the new /book page, with appropriate service pre-selection where applicable.

## Files to modify
- `src/components/marketing/hero-section.tsx`
- `src/components/marketing/header.tsx`
- `src/components/marketing/service-card.tsx`
- `src/components/marketing/contact-section.tsx`

## Requirements References
- Req 13.1: Navigate to booking page when user clicks "Book Appointment"
- Req 13.4: Start with pre-selected service if provided via URL parameter

## Implementation Details

### Hero Section Updates
```tsx
// hero-section.tsx
import Link from 'next/link';

// Replace existing button with Link
<Link
  href="/book"
  className="btn btn-primary btn-lg"
>
  Book Appointment
</Link>
```

### Header Updates
```tsx
// header.tsx
import Link from 'next/link';

// Update the Book Now button in header
<Link
  href="/book"
  className="btn btn-primary btn-sm"
>
  Book Now
</Link>
```

### Service Card Updates
```tsx
// service-card.tsx
import Link from 'next/link';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string;
    // ...
  };
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      {/* ... existing content ... */}
      <div className="card-actions justify-end">
        <Link
          href={`/book?service=${service.id}`}
          className="btn btn-primary btn-sm"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
```

### Contact Section Updates
```tsx
// contact-section.tsx
import Link from 'next/link';

// Add booking CTA alongside contact info
<div className="flex gap-4">
  <Link
    href="/book"
    className="btn btn-primary"
  >
    Book Online
  </Link>
  <a
    href="tel:+16572522903"
    className="btn btn-outline"
  >
    Call Us
  </a>
</div>
```

### Mobile Navigation Updates
```tsx
// If mobile menu exists, update booking link
<Link
  href="/book"
  className="btn btn-primary btn-block"
  onClick={() => setMobileMenuOpen(false)}
>
  Book Appointment
</Link>
```

### Tracking (Optional)
```tsx
// Add analytics tracking if needed
const handleBookingClick = (source: string, serviceId?: string) => {
  // analytics.track('Booking CTA Clicked', { source, serviceId });
};

<Link
  href="/book"
  onClick={() => handleBookingClick('hero')}
  className="btn btn-primary"
>
  Book Appointment
</Link>
```

## Files to Verify
After implementation, verify these pages link correctly:
1. Homepage hero section
2. Homepage header (desktop & mobile)
3. Service cards (if displayed on homepage)
4. Contact section
5. Footer (if booking CTA exists)

## Acceptance Criteria
- [ ] Hero section "Book Appointment" links to /book
- [ ] Header "Book Now" button links to /book
- [ ] Service cards include "Book Now" linking to /book?service={id}
- [ ] Contact section has "Book Online" option
- [ ] All buttons use Next.js Link for client-side navigation
- [ ] Service pre-selection tested with query parameter
- [ ] Mobile navigation updated (if applicable)
- [ ] No broken links or 404s

## Estimated Complexity
Low

## Phase
Phase 9: Polish & Integration

## Dependencies
- Task 11 (booking page exists and accepts service parameter)
