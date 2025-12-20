# Task 0230: Create cache invalidation API and verify dynamic data is not cached

**Phase**: 10.1 Performance
**Prerequisites**: 0229
**Estimated effort**: 2-3 hours

## Objective

Implement cache invalidation utilities and ensure dynamic data is never cached.

## Requirements

- Create cache invalidation utility function
- Ensure appointments and user data use dynamic rendering
- Add cache-control headers to API responses
- Verify no stale data served to users

## Acceptance Criteria

- [ ] Cache invalidation function created
- [ ] Appointments always show fresh data (no caching)
- [ ] User-specific data never cached
- [ ] Cache-Control headers set correctly on API routes
- [ ] Static data cached, dynamic data fresh
- [ ] Cache cleared when admin updates static data

## Implementation Details

### Files to Create

- `src/lib/cache/invalidation.ts`

### Files to Modify

- API routes returning static data - Add appropriate Cache-Control headers
- API routes returning dynamic data - Add `no-store` Cache-Control

### Cache Invalidation Pattern

```typescript
export async function invalidateCache(key: string) {
  cache.delete(key);
  // If using Next.js, also trigger ISR revalidation
  await revalidatePath(relatedPath);
}
```

## References

- **Requirements**: Req 5.7-5.9
- **Design**: Section 10.1.5
