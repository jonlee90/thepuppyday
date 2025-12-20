# Task 0234: Create RLS policies for waitlist and loyalty tables

**Phase**: 10.2 Security
**Prerequisites**: 0231
**Estimated effort**: 2-3 hours

## Objective

Create Row Level Security policies for waitlist and loyalty program tables.

## Requirements

- Create CRUD policies for waitlist entries (own entries)
- Create SELECT policies for customer_loyalty, loyalty_punches, loyalty_redemptions
- Ensure customers can only see their own loyalty data

## Acceptance Criteria

- [ ] Users can create/update/delete own waitlist entries
- [ ] Users can view own loyalty points and history
- [ ] Users can view own loyalty redemptions
- [ ] Users cannot see other customers' loyalty data
- [ ] Policies tested with multiple customer accounts

## Implementation Details

### Migration to Create

- Add RLS policies for waitlist and loyalty tables

### Tables to Secure

- waitlist
- customer_loyalty
- loyalty_punches
- loyalty_redemptions
- referral_codes
- referrals

### Example Policy

```sql
CREATE POLICY "waitlist_crud_own"
  ON waitlist FOR ALL
  TO authenticated
  USING (customer_id = auth.user_id());

CREATE POLICY "customer_loyalty_select_own"
  ON customer_loyalty FOR SELECT
  TO authenticated
  USING (customer_id = auth.user_id());
```

## References

- **Requirements**: Req 6.3
- **Design**: Section 10.2.1
