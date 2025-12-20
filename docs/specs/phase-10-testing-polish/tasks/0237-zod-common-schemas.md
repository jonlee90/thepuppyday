# Task 0237: Create centralized Zod validation schemas

**Phase**: 10.2 Security
**Prerequisites**: None
**Estimated effort**: 2-3 hours

## Objective

Create centralized common Zod validation schemas that can be reused across the application.

## Requirements

- Create `src/lib/validations/index.ts` exporting all schemas
- Create common schemas: email, phone, uuid, date, futureDate, pagination, search
- Ensure schemas have descriptive error messages

## Acceptance Criteria

- [ ] Common validation schemas centralized in one location
- [ ] Email schema validates proper format
- [ ] Phone schema validates (XXX) XXX-XXXX format
- [ ] UUID schema validates UUID v4 format
- [ ] Date schemas validate ISO 8601 format
- [ ] Pagination schema validates limit/offset
- [ ] All schemas have user-friendly error messages

## Implementation Details

### Files to Create

- `src/lib/validations/index.ts`
- `src/lib/validations/common.ts`

### Common Schemas

```typescript
export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string().regex(
  /^\(\d{3}\) \d{3}-\d{4}$/,
  'Phone must be in format (XXX) XXX-XXXX'
);

export const uuidSchema = z.string().uuid('Invalid ID format');

export const futureDateSchema = z.string().refine(
  (date) => new Date(date) > new Date(),
  'Date must be in the future'
);

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const searchSchema = z.string().max(100).optional();
```

## References

- **Requirements**: Req 7.1
- **Design**: Section 10.2.2
