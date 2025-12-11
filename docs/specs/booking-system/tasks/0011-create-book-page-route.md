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
- [x] Page accessible at /book route
- [x] Accepts optional `service` query parameter
- [x] Passes pre-selected service ID to BookingWizard
- [x] Shows loading skeleton during suspense
- [x] Has appropriate page metadata (title, description)
- [x] Uses marketing layout (within (marketing) route group)
- [x] Full viewport height display

## Estimated Complexity
Low

## Phase
Phase 3: Booking Page & Integration

## Dependencies
- Existing BookingWizard component

## Implementation Notes
**Status:** ✅ Completed

**File Created:**
- `src/app/(marketing)/book/page.tsx` - Booking page with service pre-selection support

**Key Features Implemented:**
1. **Next.js 15 async searchParams:**
   - Proper async/await handling for searchParams
   - Type-safe query parameter extraction
   - Optional service ID passed to BookingWizard

2. **Suspense boundary with loading skeleton:**
   - Professional loading state matching design system
   - Animates with pulse effect
   - Shows header, progress bar, and content placeholders
   - Background colors match #F8EEE5 (warm cream) and #434E54 (charcoal)

3. **SEO optimization:**
   - Descriptive page title: "Book Appointment | Puppy Day"
   - Meta description for search engines
   - Proper semantic HTML structure

4. **Design system compliance:**
   - Uses DaisyUI base-200, base-100, base-300 colors
   - Consistent with Clean & Elegant Professional aesthetic
   - Full viewport height for immersive booking experience

**URL Examples:**
- `/book` - Start from service selection step
- `/book?service=uuid` - Pre-select service and skip to pet step

**Integration:**
- Works seamlessly with existing BookingWizard component
- Preserves all wizard functionality (step navigation, validation, etc.)
- Maintains session state across page refreshes
