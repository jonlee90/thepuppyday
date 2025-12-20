# Task 0239: Add Zod validation to admin API routes

**Phase**: 10.2 Security
**Prerequisites**: 0237
**Estimated effort**: 3-4 hours

## Objective

Add comprehensive Zod validation to all admin API routes with appropriate constraints.

## Requirements

- Validate service/addon creation: price ranges, duration, description length
- Validate notification template syntax and required variables
- Validate admin settings within acceptable ranges
- Sanitize and limit search query length

## Acceptance Criteria

- [ ] Service/addon routes validate prices (0.01-10000)
- [ ] Duration validated (15-480 minutes)
- [ ] Notification templates validate required variables
- [ ] Settings routes validate ranges (e.g., punch threshold 5-20)
- [ ] Search queries limited to 100 characters
- [ ] HTML/script tags stripped from user inputs
- [ ] All validation errors return descriptive messages

## Implementation Details

### Files to Create

- `src/lib/validations/admin.ts`
- `src/lib/validations/notifications.ts`

### Files to Modify

- `src/app/api/admin/services/route.ts`
- `src/app/api/admin/addons/route.ts`
- `src/app/api/admin/notifications/templates/route.ts`
- `src/app/api/admin/settings/**/*.ts`

### Example Schemas

```typescript
export const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  duration_minutes: z.number().int().min(15).max(480),
  is_active: z.boolean(),
});

export const servicePriceSchema = z.object({
  service_id: uuidSchema,
  size: z.enum(['small', 'medium', 'large', 'x-large']),
  price: z.number().min(0.01).max(10000),
});
```

## References

- **Requirements**: Req 7.4-7.5, 7.9-7.10
- **Design**: Section 10.2.2
