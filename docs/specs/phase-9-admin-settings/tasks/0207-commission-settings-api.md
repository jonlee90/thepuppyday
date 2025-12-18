# Task 0207: Commission settings API routes

## Description
Create API routes for managing groomer commission settings.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/staff/[id]/commission` to fetch commission settings
- [ ] Return: rate_type, rate, include_addons, service_overrides, or null if not configured
- [ ] Create PUT `/api/admin/settings/staff/[id]/commission` to update commission
- [ ] Accept: rate_type ('percentage' | 'flat'), rate (number), include_addons (boolean), service_overrides (array)
- [ ] Validate rate: 0-100 for percentage, >= 0 for flat
- [ ] Validate service_overrides: each must have valid service_id and rate
- [ ] Upsert into staff_commissions table
- [ ] If no settings exist, use default rate (0%)
- [ ] Implement `requireAdmin()` authentication check
- [ ] Create audit log entry for changes
- [ ] Return updated commission settings

## Implementation Notes
- File: `src/app/api/admin/settings/staff/[id]/commission/route.ts`
- Use Zod for validation
- Service overrides allow different rates for different service types

## References
- Req 18.1, Req 18.2, Req 18.3, Req 18.5, Req 18.7, Req 18.8
- Design: Staff Management API section

## Complexity
Medium

## Category
API

## Dependencies
- 0202 (Staff commissions migration)
- 0203 (Staff management API)
