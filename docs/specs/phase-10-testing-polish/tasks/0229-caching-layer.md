# Task 0229: Implement caching layer for static and semi-static data

**Phase**: 10.1 Performance
**Prerequisites**: None
**Estimated effort**: 3-4 hours

## Objective

Implement multi-layer caching for static and semi-static data to reduce database load.

## Requirements

- Create `src/lib/cache/index.ts` with InMemoryCache class
- Define CACHE_TTL constants: breeds (24h), services (1h), banners (15min)
- Add ISR revalidate exports to services page (3600s) and gallery page (3600s)
- Implement cache hit/miss logging

## Acceptance Criteria

- [ ] InMemoryCache class created with get/set/delete methods
- [ ] CACHE_TTL constants defined for all cacheable data types
- [ ] ISR revalidation configured on static pages
- [ ] Cache hit rates measurable and logged
- [ ] Cache automatically expires based on TTL
- [ ] Cache cleared on relevant data updates

## Implementation Details

### Files to Create

- `src/lib/cache/index.ts`

### Files to Modify

- `src/app/(marketing)/services/page.tsx` - Add `export const revalidate = 3600`
- `src/app/(marketing)/gallery/page.tsx` - Add `export const revalidate = 3600`

### Cache TTL Configuration

```typescript
export const CACHE_TTL = {
  BREEDS: 24 * 60 * 60, // 24 hours
  SERVICES: 60 * 60, // 1 hour
  BANNERS: 15 * 60, // 15 minutes
  SETTINGS: 5 * 60, // 5 minutes
};
```

## References

- **Requirements**: Req 5.1-5.6
- **Design**: Section 10.1.5
