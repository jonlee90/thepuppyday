# Task 0236: Test RLS policies for horizontal privilege escalation

**Phase**: 10.2 Security
**Prerequisites**: 0232-0235
**Estimated effort**: 3-4 hours

## Objective

Write comprehensive tests to verify RLS policies prevent unauthorized data access.

## Requirements

- Write tests to verify customers cannot access other customers' data
- Test that direct queries return empty results for unauthorized access
- Test admin access works correctly
- Test all CRUD operations respect RLS

## Acceptance Criteria

- [ ] Tests verify Customer A cannot see Customer B's data
- [ ] Tests verify unauthenticated users cannot access protected data
- [ ] Tests verify admins can access all data
- [ ] Tests verify role escalation prevented
- [ ] All RLS tests pass
- [ ] No privilege escalation possible

## Implementation Details

### Files to Create

- `__tests__/security/rls-policies.test.ts`

### Test Scenarios

1. Unauthenticated access to public data (should succeed)
2. Unauthenticated access to protected data (should fail)
3. Customer accessing own data (should succeed)
4. Customer accessing another customer's data (should fail)
5. Customer attempting role escalation (should fail)
6. Admin accessing all data (should succeed)
7. Groomer accessing appointment data (should succeed)

### Testing Pattern

```typescript
test('customer cannot access other customer pets', async () => {
  const customerA = await createTestCustomer();
  const customerB = await createTestCustomer();

  const { data, error } = await supabaseAs(customerA)
    .from('pets')
    .select('*')
    .eq('owner_id', customerB.id);

  expect(data).toEqual([]);
});
```

## References

- **Requirements**: Req 6.7, 6.9
- **Design**: Section 10.2.1
