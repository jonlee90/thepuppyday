# Task 0232: Create RLS policies for public tables

**Phase**: 10.2 Security
**Prerequisites**: 0231
**Estimated effort**: 2-3 hours

## Objective

Create Row Level Security policies for public-facing tables that anyone can read.

## Requirements

- Create SELECT policies for services, addons, breeds (public access to active items)
- Create SELECT policy for gallery_images (published only)
- Create SELECT policy for service_prices (public)
- Ensure only active/published items are visible

## Acceptance Criteria

- [ ] Public can SELECT from services where is_active = true
- [ ] Public can SELECT from addons where is_active = true
- [ ] Public can SELECT from breeds table
- [ ] Public can SELECT from gallery_images where is_published = true
- [ ] Public can SELECT from service_prices
- [ ] Policies tested with unauthenticated requests

## Implementation Details

### Migration to Create

- Add RLS policies for public tables

### Example Policy

```sql
CREATE POLICY "services_select_public"
  ON services FOR SELECT
  TO public
  USING (is_active = true);
```

### Tables to Secure

- services
- addons
- breeds
- service_prices
- gallery_images
- promo_banners (active only)

## References

- **Requirements**: Req 6.8
- **Design**: Section 10.2.1
