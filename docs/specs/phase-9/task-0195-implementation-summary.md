# Task 0195: Earning Rules API Routes - Implementation Summary

## Overview
Implemented complete earning rules management API for the loyalty program, allowing admins to configure which services qualify for earning punches, minimum spend requirements, and first-visit bonuses.

## Files Created

### API Route
**C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\api\admin\settings\loyalty\earning-rules\route.ts**
- GET endpoint: Fetch loyalty earning rules
- PUT endpoint: Update earning rules with validation
- Full integration with Supabase settings table
- Validates service IDs exist in database
- Calculates affected customers
- Audit logging via `logSettingsChange()`

### Tests
**C:\Users\Jon\Documents\claude projects\thepuppyday\__tests__\api\admin\settings\loyalty\earning-rules.test.ts**
- 11 comprehensive tests
- All tests passing
- Covers all validation scenarios
- Tests error handling and edge cases

## Key Features

### GET /api/admin/settings/loyalty/earning-rules
- Returns earning rules from settings table (key='loyalty_earning_rules')
- Falls back to defaults if not configured:
  ```typescript
  {
    qualifying_services: [], // All services qualify
    minimum_spend: 0,
    first_visit_bonus: 1
  }
  ```
- Requires admin authentication

### PUT /api/admin/settings/loyalty/earning-rules
- Validates request body with Zod schema (`LoyaltyEarningRulesSchema`)
- Validates service IDs exist in database
- Calculates affected customers with upcoming appointments
- Updates or creates setting in database
- Logs changes to audit log
- Returns updated rules with:
  - `earning_rules`: Updated rules object
  - `affected_customers`: Count of customers with upcoming appointments
  - `message`: Descriptive message about the change

## Validation Rules

### qualifying_services
- Array of service UUIDs or empty array (all services)
- Each UUID validated against `services` table
- Returns 400 if invalid UUIDs provided
- Returns 400 if UUIDs don't exist in database

### minimum_spend
- Number >= 0
- Minimum amount customer must spend to earn a punch

### first_visit_bonus
- Integer >= 0 and <= 10
- Bonus punches awarded on first visit

## Error Handling
- **400**: Validation errors (invalid format or non-existent service IDs)
- **401**: Unauthorized (not admin)
- **500**: Database errors or service validation failures

## Database Integration
- Settings stored in `settings` table with key='loyalty_earning_rules'
- Service validation against `services` table
- Affected customers count from `appointments` table
- Audit logging to `settings_audit_log` table

## Test Coverage
1. ✅ Return default earning rules when none exist
2. ✅ Return stored earning rules
3. ✅ Return 401 if not authenticated
4. ✅ Return 500 on database error
5. ✅ Update earning rules successfully (all services)
6. ✅ Update earning rules with specific services
7. ✅ Create new setting if none exists
8. ✅ Return 400 for validation errors
9. ✅ Return 400 if service IDs do not exist
10. ✅ Return 500 if service validation fails
11. ✅ Return 401 if not authenticated (PUT)

## Integration Points

### Dependencies
- `@/lib/supabase/server` - Supabase client creation
- `@/lib/admin/auth` - `requireAdmin()` for authentication
- `@/lib/admin/audit-log` - `logSettingsChange()` for audit logging
- `@/types/settings` - `LoyaltyEarningRules` and `LoyaltyEarningRulesSchema`

### Database Tables Used
- `settings` - Storing earning rules configuration
- `services` - Validating qualifying service IDs
- `appointments` - Calculating affected customers
- `settings_audit_log` - Audit trail

## Example API Responses

### GET Success Response
```json
{
  "data": {
    "qualifying_services": ["service-1", "service-2"],
    "minimum_spend": 50,
    "first_visit_bonus": 2
  },
  "last_updated": "2024-01-01T00:00:00Z"
}
```

### PUT Success Response
```json
{
  "earning_rules": {
    "qualifying_services": [],
    "minimum_spend": 0,
    "first_visit_bonus": 1
  },
  "affected_customers": 5,
  "message": "Loyalty earning rules updated successfully. All services now qualify for earning punches. This may affect 5 customer(s) with upcoming appointments."
}
```

### PUT Error Response (Invalid Service IDs)
```json
{
  "error": "Invalid service IDs",
  "details": [
    {
      "field": "qualifying_services",
      "message": "Service IDs not found: service-xyz"
    }
  ]
}
```

## Status
✅ **Complete and tested** - All tests passing, ready for integration
