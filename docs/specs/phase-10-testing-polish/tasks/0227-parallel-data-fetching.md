# Task 0227: Optimize database queries with parallel fetching

**Phase**: 10.1 Performance
**Prerequisites**: None
**Estimated effort**: 3-4 hours

## Objective

Optimize database queries by fetching data in parallel where possible and implementing cursor-based pagination.

## Requirements

- Create `src/lib/db/optimized-queries.ts`
- Implement getDashboardData with Promise.all for parallel queries
- Add query timing logs for queries over 500ms
- Implement cursor-based pagination for customer lists

## Acceptance Criteria

- [ ] optimized-queries.ts created with parallel fetching patterns
- [ ] getDashboardData fetches all data in parallel
- [ ] Dashboard queries complete in under 500ms combined
- [ ] Slow queries (> 500ms) logged to console
- [ ] Cursor-based pagination implemented for lists
- [ ] No N+1 query problems

## Implementation Details

### Files to Create

- `src/lib/db/optimized-queries.ts`

### Files to Modify

- Admin dashboard components
- Customer list components
- Any components with multiple sequential queries

### Parallel Fetching Pattern

```typescript
async function getDashboardData() {
  const [appointments, customers, revenue] = await Promise.all([
    getAppointments(),
    getCustomerCount(),
    getMonthlyRevenue()
  ]);

  return { appointments, customers, revenue };
}
```

## References

- **Requirements**: Req 4.1-4.5
- **Design**: Section 10.1.4
