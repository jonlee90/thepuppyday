# Task 0238: Add Zod validation to booking and customer API routes

**Phase**: 10.2 Security
**Prerequisites**: 0237
**Estimated effort**: 3-4 hours

## Objective

Add comprehensive Zod validation to all booking and customer-facing API routes.

## Requirements

- Validate booking form data: pet info, service selection, contact details
- Validate customer profile updates: email format, phone format, name length
- Return 400 with descriptive field errors on validation failure
- Ensure all user inputs are validated before processing

## Acceptance Criteria

- [ ] All booking API routes validate input with Zod
- [ ] Customer profile routes validate with Zod
- [ ] Pet CRUD routes validate with Zod
- [ ] Validation errors return 400 with field-level details
- [ ] Invalid UUIDs rejected
- [ ] Invalid dates rejected
- [ ] Invalid contact info rejected

## Implementation Details

### Files to Create

- `src/lib/validations/booking.ts`
- `src/lib/validations/customer.ts`

### Files to Modify

- `src/app/api/book/route.ts`
- `src/app/api/availability/route.ts`
- `src/app/api/customer/profile/route.ts`
- `src/app/api/customer/pets/route.ts`

### Booking Schema Example

```typescript
export const bookingSchema = z.object({
  serviceId: uuidSchema,
  petId: uuidSchema.optional(),
  petInfo: z.object({
    name: z.string().min(1).max(50),
    breed: z.string().min(1).max(50),
    weight: z.number().positive().max(200),
  }).optional(),
  scheduledAt: futureDateSchema,
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
});
```

## References

- **Requirements**: Req 7.2-7.3, 7.6-7.7
- **Design**: Section 10.2.2
