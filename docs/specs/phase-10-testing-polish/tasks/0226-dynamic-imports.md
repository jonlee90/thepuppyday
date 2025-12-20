# Task 0226: Implement dynamic imports for heavy components

**Phase**: 10.1 Performance
**Prerequisites**: 0225
**Estimated effort**: 3-4 hours

## Objective

Lazy-load heavy components using dynamic imports to reduce initial bundle size.

## Requirements

- Create `src/components/admin/LazyCharts.tsx` with dynamic imports for chart components
- Lazy-load rich text editor, modals, date pickers
- Defer Stripe.js loading until checkout step
- Ensure route groups have separate bundles, initial JS under 500KB

## Acceptance Criteria

- [ ] Chart components dynamically imported in admin
- [ ] Rich text editor loaded only when needed
- [ ] Date picker loaded only in booking flow
- [ ] Stripe.js loaded only on payment step
- [ ] Loading indicators shown during component loading
- [ ] Initial JavaScript bundle under 500KB
- [ ] Each route group has isolated bundle

## Implementation Details

### Files to Create

- `src/components/admin/LazyCharts.tsx`

### Files to Modify

- Admin components using charts
- Booking wizard components
- Any components using heavy dependencies

### Dynamic Import Pattern

```typescript
const ChartComponent = dynamic(() => import('./ChartComponent'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

## References

- **Requirements**: Req 3.4-3.7
- **Design**: Section 10.1.3
