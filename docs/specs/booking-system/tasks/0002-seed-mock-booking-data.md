# Task 2: Seed Mock Data for Booking System

## Description
Create seed data for services, service prices, add-ons, and business hours settings to support the booking system during development.

## Files to create/modify
- `src/mocks/supabase/seed-booking.ts` (new)
- `src/mocks/supabase/seed.ts` (modify to include booking seed)

## Requirements References
- Req 2.1: Display all active services with name, description, image, and price range
- Req 5.1: Display all active add-ons with name, description, and price

## Implementation Details

### Services to seed
1. **Basic Grooming**
   - Description: "Shampoo, conditioner, nail trimming, filing, ear plucking, anal gland sanitizing, sanitary cut"
   - Duration: 60 minutes
   - Prices: Small $40, Medium $55, Large $70, X-Large $85

2. **Premium Grooming**
   - Description: "Everything in Basic plus full styling, breed-specific cuts, paw pad trimming, and finishing cologne"
   - Duration: 90 minutes
   - Prices: Small $70, Medium $95, Large $125, X-Large $150

3. **Day Care** (optional service)
   - Description: "Supervised playtime in a safe, social environment"
   - Duration: 480 minutes (full day)
   - Prices: All sizes $35

### Add-ons to seed
- Long Hair/Sporting: $10
- Teeth Brushing: $10
- Pawdicure: $15
- Flea & Tick Treatment: $25
- Tangle Removal: $15 (variable $5-$30 noted in description)
- De-shedding Treatment: $20

### Business Hours (settings table)
```json
{
  "monday": { "open": "09:00", "close": "17:00", "is_open": true },
  "tuesday": { "open": "09:00", "close": "17:00", "is_open": true },
  "wednesday": { "open": "09:00", "close": "17:00", "is_open": true },
  "thursday": { "open": "09:00", "close": "17:00", "is_open": true },
  "friday": { "open": "09:00", "close": "17:00", "is_open": true },
  "saturday": { "open": "09:00", "close": "17:00", "is_open": true },
  "sunday": { "open": "00:00", "close": "00:00", "is_open": false }
}
```

### Sample Appointments (for testing availability)
- 2-3 appointments on upcoming dates to test slot blocking

### Sample User with Pets (for authenticated flow testing)
- Test customer with 2 pets of different sizes

## Acceptance Criteria
- [ ] Services seeded with all size-based prices
- [ ] Add-ons seeded with upsell prompts where applicable
- [ ] Business hours setting created
- [ ] Sample appointments created for availability testing
- [ ] Test user with pets created for authenticated flow
- [ ] Seed function exported and callable
- [ ] Mock store initialization calls seed function

## Estimated Complexity
Low

## Phase
Phase 1: Foundation & Data Layer

## Dependencies
- Task 1 (for size constants)
