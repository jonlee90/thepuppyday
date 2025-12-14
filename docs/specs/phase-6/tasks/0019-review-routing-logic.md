# Task 0019: Implement review routing logic (4-5 stars to Google, 1-3 to feedback)

**Group**: Review System Integration (Week 2)

## Objective
Build review submission with routing based on rating

## Files to create/modify
- `src/app/api/reviews/route.ts`
- `src/components/public/report-cards/GoogleReviewRedirect.tsx`
- `src/components/public/report-cards/PrivateFeedbackForm.tsx`

## Requirements covered
- REQ-6.3.2
- REQ-6.3.3

## Acceptance criteria
- 4-5 stars: Thank you message + redirect to Google Business review page
- 1-3 stars: Private feedback form displayed
- Rating, feedback, and timestamp saved to reviews table
- Low ratings flagged for admin follow-up
