# Task 0231: Enable RLS on all tables and create helper functions

**Phase**: 10.2 Security
**Prerequisites**: None
**Estimated effort**: 2-3 hours

## Objective

Enable Row Level Security on all Supabase tables and create helper functions for policy definitions.

## Requirements

- Create migration to enable RLS on all tables
- Create auth.user_id() helper function
- Create auth.is_admin_or_staff() helper function
- Document all tables with RLS enabled

## Acceptance Criteria

- [ ] RLS enabled on ALL tables in database
- [ ] auth.user_id() function created and works correctly
- [ ] auth.is_admin_or_staff() function created
- [ ] Helper functions tested and documented
- [ ] Migration successfully applied

## Implementation Details

### Migration to Create

- Create new Supabase migration file

### Helper Functions

```sql
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'sub')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.is_admin_or_staff()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role') IN ('admin', 'groomer'),
    FALSE
  );
$$ LANGUAGE SQL STABLE;
```

## References

- **Requirements**: Req 6.1, 6.6
- **Design**: Section 10.2.1
