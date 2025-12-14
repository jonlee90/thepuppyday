# Task 0020: Create duplicate review prevention

**Group**: Review System Integration (Week 2)

## Objective
Prevent multiple reviews per report card

## Files to create/modify
- `src/app/api/reviews/route.ts`

## Requirements covered
- REQ-6.3.4

## Acceptance criteria
- One review per report card enforced (database unique constraint)
- "Thank you" message shown if already reviewed
- API returns 400 for duplicate attempts
