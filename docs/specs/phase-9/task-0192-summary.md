# Task 0192: Loyalty Settings API Routes - Implementation Summary

## Overview
Implemented loyalty program configuration API endpoints for The Puppy Day admin panel.

## Files Created

### API Route
**`src/app/api/admin/settings/loyalty/route.ts`**
- GET endpoint: Fetch loyalty program settings with statistics
- PUT endpoint: Update base loyalty settings (is_enabled, punch_threshold)
- Merges with existing earning_rules, redemption_rules, and referral_program
- Validates punch_threshold range (5-20)
- Calculates real-time statistics from database
- Logs changes to audit log
- Preserves existing punch data when disabling program

### Tests
**`__tests__/api/admin/settings/loyalty.test.ts`**
- 13 comprehensive tests covering all functionality
- GET endpoint tests (4)
  - Default settings when none exist
  - Existing settings with statistics
  - Authentication validation
  - Database error handling
- PUT endpoint tests (9)
  - Successful settings update
  - Create new settings
  - Disable program (preserves data)
  - Validation (punch_threshold range, is_enabled type)
  - Authentication validation
  - Database error handling (update and insert)
  - Preservation of complex earning/redemption/referral rules

## API Endpoints

### GET /api/admin/settings/loyalty

**Response:**
```typescript
{
  data: {
    is_enabled: boolean;
    punch_threshold: number; // 5-20, default 9
    earning_rules: {
      qualifying_services: string[];
      minimum_spend: number;
      first_visit_bonus: number;
    };
    redemption_rules: {
      eligible_services: string[];
      expiration_days: number;
      max_value: number | null;
    };
    referral_program: {
      is_enabled: boolean;
      referrer_bonus_punches: number;
      referee_bonus_punches: number;
    };
    stats: {
      active_customers: number;
      total_rewards_redeemed: number;
      pending_rewards: number;
    };
  };
  last_updated: string | null;
}
```

**Statistics Calculated:**
- `active_customers`: Count from `customer_loyalty` table
- `total_rewards_redeemed`: Count from `loyalty_redemptions` where status='redeemed'
- `pending_rewards`: Count from `customer_loyalty` where current_punches >= punch_threshold

### PUT /api/admin/settings/loyalty

**Request Body:**
```typescript
{
  is_enabled: boolean;
  punch_threshold: number; // Must be 5-20
}
```

**Validation:**
- `is_enabled`: Must be boolean
- `punch_threshold`: Must be integer between 5 and 20 (inclusive)

**Behavior:**
- Merges with existing settings (preserves earning_rules, redemption_rules, referral_program)
- Logs change to audit log via `logSettingsChange()`
- Returns updated settings with fresh statistics
- When disabling: Preserves existing punch data (no deletion)

**Response:**
```typescript
{
  data: {
    // Full loyalty settings object with stats
  };
  message: string; // Success message or preservation notice
}
```

## Database Integration

**Settings Storage:**
- Stored in `settings` table with key='loyalty_program'
- Value is JSONB containing full loyalty settings

**Statistics Queries:**
- `customer_loyalty` table: Active customers and pending rewards
- `loyalty_redemptions` table: Total redeemed rewards
- Queries are run fresh on each GET request (no caching currently)

## Default Settings

When no settings exist in database:
```typescript
{
  is_enabled: true,
  punch_threshold: 9, // Buy 9, get 10th free
  earning_rules: {
    qualifying_services: [], // Empty = all services qualify
    minimum_spend: 0,
    first_visit_bonus: 1,
  },
  redemption_rules: {
    eligible_services: [], // Must be populated with actual service IDs
    expiration_days: 365,
    max_value: null,
  },
  referral_program: {
    is_enabled: false,
    referrer_bonus_punches: 1,
    referee_bonus_punches: 0,
  },
}
```

## Security & Authentication

- Uses `requireAdmin()` for authentication
- Admin-only access (role: 'admin' or 'groomer')
- Audit logging tracks all changes with admin ID
- Returns 401 for unauthorized access

## Error Handling

- 400: Validation errors (with detailed error messages)
- 401: Unauthorized (not authenticated as admin)
- 500: Database errors
  - Failed to fetch settings
  - Failed to update settings
  - Failed to create settings

## Type Safety

Uses existing types from `@/types/settings`:
- `LoyaltyEarningRules` & `LoyaltyEarningRulesSchema`
- `LoyaltyRedemptionRules` & `LoyaltyRedemptionRulesSchema`
- `ReferralProgram` & `ReferralProgramSchema`

Custom types defined in route:
- `LoyaltySettings`: Full settings interface
- `LoyaltyStats`: Statistics interface
- `LoyaltySettingsResponse`: Combined response type
- `UpdateLoyaltySettingsSchema`: Zod schema for PUT validation

## Test Results

All 13 tests passing:
- ✅ GET: Default settings when none exist
- ✅ GET: Existing settings with statistics
- ✅ GET: 401 if not authenticated
- ✅ GET: Handle database errors
- ✅ PUT: Update settings successfully
- ✅ PUT: Create new settings if none exist
- ✅ PUT: Preserve data when disabling
- ✅ PUT: Validate punch_threshold range
- ✅ PUT: Validate is_enabled type
- ✅ PUT: 401 if not authenticated
- ✅ PUT: Handle database update errors
- ✅ PUT: Handle database insert errors
- ✅ PUT: Preserve earning/redemption/referral rules

## Next Steps

This API endpoint is ready for:
1. Task 0193: Loyalty dashboard component
2. Task 0195: Earning rules API
3. Task 0197: Redemption rules API
4. Task 0199: Referral codes API

## Dependencies

- ✅ 0155: Database migrations (customer_loyalty, loyalty_redemptions tables exist)
- ✅ 0156: TypeScript types (loyalty types defined in @/types/settings)
- ✅ 0167: Audit logging (logSettingsChange function)

## Implementation Notes

1. **Settings Merging**: PUT endpoint only updates `is_enabled` and `punch_threshold`, preserving other settings (earning_rules, redemption_rules, referral_program). This allows those to be managed by separate API endpoints.

2. **Data Preservation**: When loyalty program is disabled (`is_enabled: false`), all existing customer punch data remains intact in the database. This is important for business continuity if the program is re-enabled.

3. **Statistics Performance**: Statistics are calculated on-demand with simple COUNT queries. For future optimization, these could be cached with TTL or calculated asynchronously.

4. **Default Service IDs**: `redemption_rules.eligible_services` defaults to empty array, which should be populated with actual service IDs during setup.

## Completion Status

✅ Task 0192 Complete
- API routes implemented
- Comprehensive tests passing
- Documentation complete
- Ready for UI integration
