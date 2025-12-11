# Task 11: Create /book Page Route

## Description
Create the booking page that wraps the BookingWizard component and handles query parameters for service pre-selection.

## Files to create
- `src/app/(marketing)/book/page.tsx`

## Requirements References
- Req 13.1: Navigate to booking page with widget when user clicks "Book Appointment"
- Req 13.2: Display booking widget as primary content
- Req 13.4: Start with pre-selected service if provided via URL parameter

## Implementation Details

### Page: /book

**URL Parameters:**
- `service` (optional): Service ID to pre-select

**Example URLs:**
- `/book` - Start from service selection
- `/book?service=uuid` - Start with service pre-selected

**Implementation:**
```typescript
// src/app/(marketing)/book/page.tsx
import { Suspense } from 'react';
import { BookingWizard } from '@/components/booking';

interface BookPageProps {
  searchParams: Promise<{ service?: string }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const preSelectedServiceId = params.service;

  return (
    <Suspense fallback={<BookingPageSkeleton />}>
      <BookingWizard preSelectedServiceId={preSelectedServiceId} />
    </Suspense>
  );
}

function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-base-200 animate-pulse">
      <div className="bg-base-100 border-b border-base-300 h-16" />
      <div className="bg-base-100 border-b border-base-300 h-20" />
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 bg-base-300 rounded-xl" />
      </div>
    </div>
  );
}

// Metadata
export const metadata = {
  title: 'Book Appointment | Puppy Day',
  description: 'Book your dog grooming appointment at Puppy Day in La Mirada, CA',
};
```

**Layout Considerations:**
- The BookingWizard component already includes its own header with "Back to Home" link
- The page uses the marketing layout (no additional navigation needed)
- Full viewport height for proper wizard display

## Acceptance Criteria
- [ ] Page accessible at /book route
- [ ] Accepts optional `service` query parameter
- [ ] Passes pre-selected service ID to BookingWizard
- [ ] Shows loading skeleton during suspense
- [ ] Has appropriate page metadata (title, description)
- [ ] Uses marketing layout (within (marketing) route group)
- [ ] Full viewport height display

## Estimated Complexity
Low

## Phase
Phase 3: Booking Page & Integration

## Dependencies
- Existing BookingWizard component
