# Task 2: Extend Gallery Images with Categories

## Description
Add category field to gallery images to distinguish between regular and featured images.

## Files to modify
- `src/types/database.ts` - Update `GalleryImage` interface
- `src/mocks/supabase/seed.ts` - Add categorized gallery images

## Acceptance criteria
- [ ] `GalleryImage` has `category` field typed as `'before_after' | 'regular' | 'featured'`
- [ ] Seed data includes images with different categories
- [ ] At least 12 gallery images seeded for homepage display

## Estimated complexity
Low

## Phase
Phase 1: Database & Data Layer
