# Review System Components Implementation Plan
## Phase 6 Tasks 0018-0020

**Created:** 2025-12-13
**Status:** Ready for Implementation
**Tasks:** 0018 (StarRatingSelector & ReviewPrompt), 0019 (GoogleReviewRedirect & PrivateFeedbackForm), 0020 (API Integration)

---

## Overview

This document outlines the implementation plan for the review system components that enable customers to rate their grooming experience directly from the public report card page. The system implements intelligent review routing:

- **4-5 stars** → Redirect to Google Business Reviews (public promotion)
- **1-3 stars** → Private feedback form (internal improvement)

This approach maximizes positive public reviews while capturing constructive feedback privately for service improvement.

---

## Design System Reference

### Color Palette (Clean & Elegant Professional)
- **Background**: `#F8EEE5` (warm cream)
- **Primary/Buttons**: `#434E54` (charcoal)
- **Primary Hover**: `#363F44`
- **Secondary**: `#EAE0D5` (lighter cream)
- **Text Primary**: `#434E54`
- **Text Secondary**: `#6B7280`
- **Cards**: `#FFFFFF` or `#FFFBF7`
- **Success**: `#6BCB77`
- **Warning**: `#FFB347`
- **Error**: `#FF6B6B`

### Design Principles
- Soft shadows (`shadow-sm`, `shadow-md`, `shadow-lg`)
- Subtle borders (1px or none, `border-gray-200`)
- Gentle corners (`rounded-lg`, `rounded-xl`)
- Professional typography (regular to semibold weights)
- Touch-friendly sizing (minimum 44x44px tap targets)
- Smooth animations with Framer Motion

---

## Task 0018: StarRatingSelector and ReviewPrompt Components

### Files to Create

#### 1. `src/components/public/report-cards/StarRatingSelector.tsx`

**Purpose:** Interactive 5-star rating selector with hover and selection states.

**Component Structure:**
```typescript
interface StarRatingSelectorProps {
  value: number; // Current rating (0-5)
  onChange: (rating: number) => void; // Callback when rating changes
  disabled?: boolean; // Disabled state
}
```

**Implementation Details:**

1. **Star Rendering:**
   - Use Lucide React `Star` icon
   - Render 5 stars in a horizontal row
   - Each star is 44x44px minimum (touch-friendly)
   - Stars wrapped in a flex container with gap spacing

2. **Star States:**
   - **Unselected:** Outlined star (stroke only), `stroke="#D1D5DB"` (gray-300)
   - **Hovered:** Filled star, `fill="#FFB347"` (warning/gold), `stroke="#FFB347"`
   - **Selected:** Filled star, `fill="#FFB347"`, `stroke="#FFB347"`

3. **Interaction Logic:**
   - Track hover state (which star is being hovered)
   - On hover, fill all stars up to and including hovered star
   - On click, set rating to clicked star number (1-5)
   - Stars are clickable buttons with `aria-label="Rate {n} stars"`
   - Keyboard accessible (arrow keys to navigate, enter/space to select)

4. **Styling:**
   - DaisyUI: Use `btn btn-ghost` for each star button (removes default button styling)
   - Container: `flex items-center justify-center gap-2`
   - Stars: `w-11 h-11` (44px) for touch targets
   - Smooth transition on fill state: `transition-all duration-200`
   - Disabled state: `opacity-50 cursor-not-allowed`

5. **Accessibility:**
   - Each star button has `role="button"` and `aria-label`
   - Container has `role="radiogroup"` and `aria-label="Rate your experience"`
   - Selected rating announced via `aria-live="polite"`

**DaisyUI Components Used:**
- `btn btn-ghost` for star buttons

**Example Code Snippet:**
```tsx
'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function StarRatingSelector({ value, onChange, disabled = false }: StarRatingSelectorProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div
      role="radiogroup"
      aria-label="Rate your experience"
      className="flex items-center justify-center gap-2"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = (hoverValue || value) >= star;
        return (
          <motion.button
            key={star}
            type="button"
            disabled={disabled}
            className="btn btn-ghost w-11 h-11 p-0"
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => !disabled && onChange(star)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={`w-8 h-8 transition-all duration-200`}
              fill={isActive ? '#FFB347' : 'none'}
              stroke={isActive ? '#FFB347' : '#D1D5DB'}
              strokeWidth={2}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
```

---

#### 2. `src/components/public/report-cards/ReviewPrompt.tsx`

**Purpose:** Main review prompt component that orchestrates the review flow based on rating.

**Component Structure:**
```typescript
interface ReviewPromptProps {
  reportCardId: string;
  hasExistingReview: boolean; // If review already submitted
  onSubmitSuccess?: () => void; // Callback after successful submission
}
```

**Implementation Details:**

1. **State Management:**
   - `rating: number` (0-5, 0 = no rating selected)
   - `isSubmitting: boolean` (loading state during API call)
   - `error: string | null` (error message if submission fails)

2. **Conditional Rendering Logic:**
   - **If `hasExistingReview === true`:** Show "Thank you" message, hide rating selector
   - **If `rating === 0`:** Show title + StarRatingSelector only
   - **If `rating >= 4`:** Show StarRatingSelector + GoogleReviewRedirect
   - **If `rating <= 3`:** Show StarRatingSelector + PrivateFeedbackForm

3. **Layout:**
   - Container: `bg-white rounded-xl shadow-md p-6 lg:p-8 max-w-2xl mx-auto`
   - Positioned after GroomerNotesSection, before ShareButtons
   - Margin: `my-12` (spacing from other sections)

4. **Title:**
   - Text: "How was your grooming experience?"
   - Style: `text-2xl lg:text-3xl font-bold text-[#434E54] text-center mb-6`

5. **Thank You Message (if already reviewed):**
   - Text: "Thank you for your feedback! We appreciate you taking the time to share your experience."
   - Style: `text-lg text-[#6B7280] text-center`
   - Icon: Checkmark circle (Lucide `CheckCircle2`) in success color

6. **Animation:**
   - Fade in on mount: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
   - Smooth transition when rating changes (use AnimatePresence for child components)

**DaisyUI Components Used:**
- `card` (via Tailwind classes: `bg-white rounded-xl shadow-md`)
- No specific DaisyUI component, pure styling

**Example Code Snippet:**
```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { StarRatingSelector } from './StarRatingSelector';
import { GoogleReviewRedirect } from './GoogleReviewRedirect';
import { PrivateFeedbackForm } from './PrivateFeedbackForm';

export function ReviewPrompt({ reportCardId, hasExistingReview, onSubmitSuccess }: ReviewPromptProps) {
  const [rating, setRating] = useState(0);

  if (hasExistingReview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-6 lg:p-8 max-w-2xl mx-auto my-12"
      >
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="w-16 h-16 text-[#6BCB77]" strokeWidth={1.5} />
          <p className="text-lg text-[#6B7280] text-center">
            Thank you for your feedback! We appreciate you taking the time to share your experience.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 lg:p-8 max-w-2xl mx-auto my-12"
    >
      <h3 className="text-2xl lg:text-3xl font-bold text-[#434E54] text-center mb-6">
        How was your grooming experience?
      </h3>

      <StarRatingSelector value={rating} onChange={setRating} />

      <AnimatePresence mode="wait">
        {rating >= 4 && (
          <motion.div
            key="google"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <GoogleReviewRedirect
              reportCardId={reportCardId}
              rating={rating}
              onComplete={onSubmitSuccess}
            />
          </motion.div>
        )}

        {rating > 0 && rating <= 3 && (
          <motion.div
            key="private"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <PrivateFeedbackForm
              reportCardId={reportCardId}
              rating={rating}
              onSubmitSuccess={onSubmitSuccess}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

## Task 0019: GoogleReviewRedirect and PrivateFeedbackForm Components

### Files to Create

#### 3. `src/components/public/report-cards/GoogleReviewRedirect.tsx`

**Purpose:** Thank you message and redirect button for positive reviews (4-5 stars).

**Component Structure:**
```typescript
interface GoogleReviewRedirectProps {
  reportCardId: string;
  rating: number; // 4 or 5
  onComplete?: () => void; // Callback after redirect
}
```

**Implementation Details:**

1. **API Call Before Redirect:**
   - Call `POST /api/reviews` to save rating BEFORE redirecting
   - Include: `{ reportCardId, rating, destination: 'google' }`
   - Only redirect after successful API response
   - Show loading state during API call

2. **Thank You Message:**
   - Text: "We're so glad you had a great experience!"
   - Subtext: "Would you mind sharing your experience on Google? It helps other pet parents find us!"
   - Style: `text-center text-[#434E54]`
   - Use friendly, grateful tone

3. **Google Review Button:**
   - Text: "Leave a Google Review"
   - Icon: External link icon (Lucide `ExternalLink`)
   - Style: DaisyUI `btn btn-primary btn-lg`
   - Opens in new tab: `target="_blank" rel="noopener noreferrer"`
   - Google Business URL from settings (hardcoded for now, will be configurable)
   - URL: `https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`

4. **Skip Option:**
   - Small text link: "Maybe later"
   - Style: `link link-primary text-sm`
   - Calls `onComplete()` to mark as done

5. **Animation:**
   - Fade in from bottom: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`

**DaisyUI Components Used:**
- `btn btn-primary btn-lg`
- `link link-primary`

**Example Code Snippet:**
```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export function GoogleReviewRedirect({ reportCardId, rating, onComplete }: GoogleReviewRedirectProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRedirect = async () => {
    try {
      setIsSubmitting(true);

      // Save review rating to database
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportCardId,
          rating,
          destination: 'google'
        }),
      });

      if (!response.ok) throw new Error('Failed to save review');

      // Open Google Review page in new tab
      const googleUrl = 'https://search.google.com/local/writereview?placeid=PLACE_ID_HERE';
      window.open(googleUrl, '_blank', 'noopener,noreferrer');

      onComplete?.();
    } catch (error) {
      console.error('Error saving review:', error);
      // Still allow redirect even if API fails
      const googleUrl = 'https://search.google.com/local/writereview?placeid=PLACE_ID_HERE';
      window.open(googleUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 text-center"
    >
      <p className="text-lg font-semibold text-[#434E54]">
        We're so glad you had a great experience! 🎉
      </p>
      <p className="text-[#6B7280]">
        Would you mind sharing your experience on Google? It helps other pet parents find us!
      </p>

      <button
        onClick={handleRedirect}
        disabled={isSubmitting}
        className="btn btn-primary btn-lg gap-2"
      >
        {isSubmitting ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <>
            <span>Leave a Google Review</span>
            <ExternalLink className="w-5 h-5" />
          </>
        )}
      </button>

      <div>
        <button
          onClick={onComplete}
          className="link link-primary text-sm"
        >
          Maybe later
        </button>
      </div>
    </motion.div>
  );
}
```

---

#### 4. `src/components/public/report-cards/PrivateFeedbackForm.tsx`

**Purpose:** Private feedback form for lower ratings (1-3 stars).

**Component Structure:**
```typescript
interface PrivateFeedbackFormProps {
  reportCardId: string;
  rating: number; // 1, 2, or 3
  onSubmitSuccess?: () => void; // Callback after successful submission
}
```

**Implementation Details:**

1. **State Management:**
   - `feedback: string` (textarea value)
   - `isSubmitting: boolean` (loading state)
   - `submitted: boolean` (success state)
   - `error: string | null` (error message)

2. **Thank You Message:**
   - Text: "Thank you for your honest feedback."
   - Subtext: "We'd love to hear more about your experience so we can improve."
   - Style: `text-center text-[#434E54]`
   - Empathetic, non-defensive tone

3. **Feedback Textarea:**
   - Label: "Tell us what we could do better (optional)"
   - Placeholder: "Share any details that would help us improve your next visit..."
   - Max length: 500 characters
   - Character counter: "X / 500 characters"
   - DaisyUI: `textarea textarea-bordered w-full`
   - Rows: 4 (resizable)
   - Style: `rounded-lg border-gray-200 focus:border-[#434E54]`

4. **Submit Button:**
   - Text: "Submit Feedback"
   - DaisyUI: `btn btn-primary btn-block`
   - Loading state: shows spinner, text changes to "Submitting..."
   - Disabled when submitting

5. **Success State:**
   - After successful submission, show:
   - Icon: Checkmark circle (Lucide `CheckCircle2`)
   - Message: "Thank you! Your feedback helps us serve you better."
   - Replace form with success message (use AnimatePresence)

6. **Error Handling:**
   - Show error alert if API fails
   - DaisyUI: `alert alert-error`
   - Allow retry

7. **API Call:**
   - `POST /api/reviews`
   - Body: `{ reportCardId, rating, feedback, destination: 'private' }`

**DaisyUI Components Used:**
- `textarea textarea-bordered`
- `btn btn-primary btn-block`
- `alert alert-error`
- `alert alert-success`

**Example Code Snippet:**
```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export function PrivateFeedbackForm({ reportCardId, rating, onSubmitSuccess }: PrivateFeedbackFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportCardId,
          rating,
          feedback: feedback.trim() || null,
          destination: 'private',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit feedback');
      }

      setSubmitted(true);
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 py-6"
        >
          <CheckCircle2 className="w-16 h-16 text-[#6BCB77]" strokeWidth={1.5} />
          <p className="text-lg font-semibold text-[#434E54] text-center">
            Thank you! Your feedback helps us serve you better.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-[#434E54]">
              Thank you for your honest feedback.
            </p>
            <p className="text-[#6B7280]">
              We'd love to hear more about your experience so we can improve.
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-[#434E54]">
                Tell us what we could do better (optional)
              </span>
              <span className="label-text-alt text-[#6B7280]">
                {feedback.length} / 500
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full h-24 rounded-lg"
              placeholder="Share any details that would help us improve your next visit..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
              maxLength={500}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-block"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                <span>Submitting...</span>
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
```

---

## Task 0020: Integration with PublicReportCard (NOT in this implementation)

**IMPORTANT:** The user explicitly requested that we do NOT modify the API routes or PublicReportCard.tsx in this implementation. These will be done separately.

However, for reference, here's what will be needed later:

### Future Integration Steps (DO NOT IMPLEMENT NOW)

1. **Update `src/app/(public)/report-cards/[id]/page.tsx`:**
   - Fetch review status from API
   - Pass `hasExistingReview` prop to PublicReportCard

2. **Update `src/components/public/report-cards/PublicReportCard.tsx`:**
   - Import ReviewPrompt
   - Add ReviewPrompt between GroomerNotesSection and ShareButtons
   - Pass reportCardId and hasExistingReview props

3. **Create `src/app/api/reviews/route.ts`:**
   - Handle POST requests to create reviews
   - Validate reportCardId, rating
   - Save to database
   - Return success response

---

## Dependencies

### Required Packages (Already Installed)
- `lucide-react` (icons) ✅
- `framer-motion` (animations) ✅
- `clsx` / `tailwind-merge` (className utility) ✅
- `daisyui` (component library) ✅

### No New Dependencies Needed

---

## DaisyUI Configuration

The project already has DaisyUI properly configured in `src/app/globals.css`:

```css
@plugin "daisyui" {
  themes: light --default;
}
```

**Theme Colors in Use:**
- Primary: `#434E54` (charcoal) - DaisyUI `btn-primary`
- Success: `#6BCB77` - DaisyUI `alert-success`
- Error: `#FF6B6B` - DaisyUI `alert-error`
- Warning: `#FFB347` (gold) - Used for star rating

**Relevant DaisyUI Components:**
- `btn` (button base class)
- `btn-primary`, `btn-ghost`, `btn-lg`, `btn-block` (button variants)
- `textarea textarea-bordered` (form textarea)
- `alert alert-error`, `alert alert-success` (alerts)
- `link link-primary` (link styling)
- `loading loading-spinner` (loading state)
- `form-control`, `label`, `label-text` (form structure)

---

## Accessibility Checklist

- [ ] StarRatingSelector has `role="radiogroup"` and `aria-label`
- [ ] Each star button has `aria-label` describing rating
- [ ] Selected rating is announced via `aria-live="polite"`
- [ ] All buttons have minimum 44x44px tap targets
- [ ] Forms have proper labels for screen readers
- [ ] Textarea has `maxLength` attribute and visible character counter
- [ ] Loading states are announced (`aria-busy="true"`)
- [ ] Error messages are associated with form controls (`aria-describedby`)
- [ ] Success states have appropriate ARIA announcements
- [ ] External links have `rel="noopener noreferrer"`
- [ ] Keyboard navigation works (tab, enter, space, arrow keys)

---

## Responsive Design Notes

### Mobile (< 768px)
- Star size: 44x44px (touch-friendly)
- Padding: `p-6` (24px)
- Text: `text-2xl` for headings
- Button: `btn-block` for full-width CTAs

### Tablet/Desktop (≥ 768px)
- Star size: Same 44x44px (consistent)
- Padding: `lg:p-8` (32px)
- Text: `lg:text-3xl` for headings
- Button: Centered, auto-width

### Container
- Max width: `max-w-2xl mx-auto` (constrain width on large screens)
- Responsive padding: `px-4` on mobile, automatic on larger screens

---

## Animation Guidelines

### Framer Motion Patterns

1. **Fade In on Mount:**
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}
```

2. **Hover Effects:**
```tsx
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

3. **Smooth Height Transitions (for conditional content):**
```tsx
<AnimatePresence mode="wait">
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
  />
</AnimatePresence>
```

4. **Stagger Animations (if needed for multiple elements):**
```tsx
transition={{ duration: 0.3, delay: index * 0.1 }}
```

---

## Testing Plan (Future)

### Unit Tests (Vitest + React Testing Library)
1. StarRatingSelector:
   - Renders 5 stars
   - Clicking star calls onChange with correct value
   - Hover state works correctly
   - Disabled state prevents interaction

2. ReviewPrompt:
   - Shows "Thank you" if hasExistingReview is true
   - Shows rating selector if no rating selected
   - Shows GoogleReviewRedirect if rating >= 4
   - Shows PrivateFeedbackForm if rating <= 3

3. GoogleReviewRedirect:
   - Calls API before redirecting
   - Opens Google URL in new tab
   - Handles API errors gracefully

4. PrivateFeedbackForm:
   - Submits rating and feedback to API
   - Shows success message after submission
   - Character counter updates correctly
   - Validates max length

### E2E Tests (Playwright)
1. Public report card flow:
   - Navigate to report card
   - Rate 5 stars
   - Click "Leave a Google Review"
   - Verify redirect

2. Private feedback flow:
   - Navigate to report card
   - Rate 2 stars
   - Enter feedback
   - Submit form
   - Verify success message

---

## File Structure Summary

```
src/components/public/report-cards/
├── StarRatingSelector.tsx       (NEW - Task 0018)
├── ReviewPrompt.tsx              (NEW - Task 0018)
├── GoogleReviewRedirect.tsx      (NEW - Task 0019)
├── PrivateFeedbackForm.tsx       (NEW - Task 0019)
├── PublicReportCard.tsx          (EXISTING - NO CHANGES)
├── HeroSection.tsx               (EXISTING)
├── AssessmentGrid.tsx            (EXISTING)
├── BeforeAfterComparison.tsx     (EXISTING)
├── HealthObservationsSection.tsx (EXISTING)
├── GroomerNotesSection.tsx       (EXISTING)
└── ShareButtons.tsx              (EXISTING)
```

**API Routes (NOT created in this implementation):**
```
src/app/api/reviews/
└── route.ts                      (FUTURE - Task 0020)
```

---

## Important Implementation Notes

### 1. Google Place ID Configuration
- The Google Business review URL requires a Place ID
- **Temporary:** Use placeholder `PLACE_ID_HERE` in code
- **Future:** This will be configurable via admin settings (Phase 6 Task 14)
- **Find Place ID:** https://developers.google.com/maps/documentation/places/web-service/place-id

### 2. Review Database Schema
The `reviews` table was created in Phase 6 Group 1 migrations. Schema reference:
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_card_id UUID NOT NULL REFERENCES report_cards(id),
  user_id UUID NOT NULL REFERENCES users(id),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  is_public BOOLEAN DEFAULT false,
  destination VARCHAR(20) NOT NULL, -- 'google' | 'private'
  google_review_url TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_card_id) -- One review per report card
);
```

### 3. TypeScript Types
All types are already defined in `src/types/review.ts`:
- `ReviewRating` (1-5)
- `ReviewDestination` ('google' | 'private')
- `CreateReviewInput`
- `ReviewSubmissionResponse`

### 4. Error Handling Strategy
- API errors: Show error alert, allow retry
- Network errors: Graceful degradation, still allow Google redirect
- Validation errors: Prevent submission, show inline errors

### 5. Analytics Tracking (Future)
These components will support analytics tracking via:
- Report card view count
- Rating submission count
- Google redirect click count
- Private feedback submission count
- Time to review (calculated from report card sent time)

---

## Design QA Checklist

Before marking implementation complete, verify:

- [ ] Soft shadows match design system (`shadow-md`, `shadow-lg`)
- [ ] Colors use exact hex codes from palette
- [ ] Rounded corners use `rounded-lg` or `rounded-xl`
- [ ] Typography weights are semibold or regular (not bold)
- [ ] Button hover states have smooth transitions
- [ ] Card backgrounds are `#FFFFFF`
- [ ] Text colors use `#434E54` (primary) or `#6B7280` (secondary)
- [ ] Icons are from Lucide React
- [ ] Spacing is consistent with existing components
- [ ] Mobile responsiveness tested at 375px, 768px, 1024px
- [ ] Touch targets are minimum 44x44px
- [ ] Animations are smooth and not jarring

---

## Next Steps After This Implementation

1. **Update PublicReportCard.tsx** to include ReviewPrompt component
2. **Create API route** `/api/reviews` for handling review submissions
3. **Add review status query** to report card page data fetching
4. **Configure Google Place ID** in admin settings
5. **Add analytics tracking** for review funnel metrics
6. **Test E2E flow** with real data
7. **Deploy to staging** for QA testing

---

## Questions for Stakeholders (Before Implementation)

1. **Google Business URL:** What is the Google Place ID for The Puppy Day La Mirada?
2. **Review Threshold:** Is 4-5 stars to Google correct, or should it be 5 stars only?
3. **Feedback Handling:** Who receives private feedback notifications? Admin email?
4. **Retry Logic:** If Google redirect fails, should we still save the rating?
5. **Multi-Language:** Do we need Spanish translations for review prompts?

---

## Summary

This implementation creates four new client components that enable the review system:

1. **StarRatingSelector**: Interactive 5-star rating input (DaisyUI styled, touch-friendly)
2. **ReviewPrompt**: Orchestrates review flow based on rating (conditional rendering)
3. **GoogleReviewRedirect**: Positive review redirect to Google Business (4-5 stars)
4. **PrivateFeedbackForm**: Private feedback collection for improvement (1-3 stars)

**Key Features:**
- Clean & Elegant Professional design system compliance
- DaisyUI component architecture (btn, textarea, alert, loading)
- Framer Motion animations (smooth, professional)
- Accessibility-first approach (ARIA, keyboard nav, touch targets)
- Mobile-responsive design (tested breakpoints)
- Error handling and loading states
- TypeScript strict typing

**NOT included in this implementation:**
- API route creation (`/api/reviews`)
- PublicReportCard.tsx modification
- Database queries
- Analytics tracking
- Admin settings integration

These components are fully self-contained and can be integrated into the PublicReportCard component in a future step.
