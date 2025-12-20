# Task 0233: Create RLS policies for customer tables

**Phase**: 10.2 Security
**Prerequisites**: 0231
**Estimated effort**: 3-4 hours

## Objective

Create Row Level Security policies ensuring customers can only access their own data.

## Requirements

- Create SELECT/UPDATE policies for users (own profile only)
- Create CRUD policies for pets (owner only)
- Create SELECT/INSERT/UPDATE policies for appointments (own appointments)
- Prevent role escalation in user updates

## Acceptance Criteria

- [ ] Users can SELECT/UPDATE only their own profile
- [ ] Users cannot change their own role field
- [ ] Users can full CRUD on their own pets
- [ ] Users can view and cancel their own appointments
- [ ] Users cannot see other customers' data
- [ ] Policies tested with multiple user accounts

## Implementation Details

### Migration to Create

- Add RLS policies for customer-owned tables

### Example Policies

```sql
-- Users can view and update own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.user_id());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.user_id())
  WITH CHECK (
    id = auth.user_id() AND
    role = (SELECT role FROM users WHERE id = auth.user_id())
  );

-- Pets owned by user
CREATE POLICY "pets_crud_own"
  ON pets FOR ALL
  TO authenticated
  USING (owner_id = auth.user_id());
```

## References

- **Requirements**: Req 6.2-6.5, 6.10
- **Design**: Section 10.2.1
