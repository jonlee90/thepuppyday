# Reset Customer Data

Wipe all customer, pet, and appointment data from the database while preserving admin and groomer users.

**IMPORTANT: Ask the user for confirmation before executing any SQL. This is a destructive operation.**

## Steps

1. First, use `mcp__supabase__execute_sql` to count current records:

```sql
SELECT
  (SELECT count(*) FROM public.users WHERE role = 'customer' OR role IS NULL) AS customer_count,
  (SELECT count(*) FROM public.users WHERE role IN ('admin', 'groomer')) AS preserved_count,
  (SELECT count(*) FROM pets) AS pet_count,
  (SELECT count(*) FROM appointments) AS appointment_count;
```

2. Show the counts to the user and ask: **"This will delete X customers, Y pets, Z appointments and all dependent records. Admin/groomer users (N) will be preserved. Proceed? (yes/no)"**

3. If confirmed, get customer IDs first:

```sql
SELECT id FROM public.users WHERE role = 'customer' OR role IS NULL;
```

4. Then execute deletions in FK-safe order using `mcp__supabase__execute_sql`. Run each phase as a separate SQL call:

**Phase 2 — Appointment dependents (delete ALL):**
```sql
DELETE FROM calendar_sync_log;
DELETE FROM calendar_event_mapping;
DELETE FROM appointment_addons;
DELETE FROM report_cards;
DELETE FROM reviews;
DELETE FROM payments;
```

**Phase 3 — Customer dependents (filter by customer IDs):**
```sql
DELETE FROM waitlist_slot_offers;
DELETE FROM waitlist;
DELETE FROM notifications_log;
DELETE FROM loyalty_redemptions;
DELETE FROM loyalty_punches;
DELETE FROM loyalty_transactions;
DELETE FROM loyalty_points;
DELETE FROM customer_loyalty;
DELETE FROM customer_memberships;
DELETE FROM customer_flags;
DELETE FROM staff_commissions;
DELETE FROM referral_codes;
DELETE FROM referrals;
DELETE FROM campaign_sends;
DELETE FROM marketing_campaigns;
DELETE FROM marketing_unsubscribes;
DELETE FROM settings_audit_log WHERE user_id IN (SELECT id FROM public.users WHERE role = 'customer' OR role IS NULL);
DELETE FROM calendar_connections WHERE admin_id IN (SELECT id FROM public.users WHERE role = 'customer' OR role IS NULL);
```

**Phase 4 — Core entities:**
```sql
DELETE FROM appointments;
DELETE FROM pets;
```

**Phase 5 — Customer users:**
```sql
DELETE FROM auth.users WHERE id IN (SELECT id FROM public.users WHERE role = 'customer' OR role IS NULL);
DELETE FROM public.users WHERE role = 'customer' OR role IS NULL;
```

5. After deletion, run a verification query:

```sql
SELECT
  (SELECT count(*) FROM public.users) AS remaining_users,
  (SELECT count(*) FROM public.users WHERE role IN ('admin', 'groomer')) AS admin_groomer_count,
  (SELECT count(*) FROM pets) AS pet_count,
  (SELECT count(*) FROM appointments) AS appointment_count,
  (SELECT count(*) FROM appointment_addons) AS addon_count,
  (SELECT count(*) FROM notifications_log) AS notification_count;
```

6. Report results in a summary table showing what was deleted and what remains.

## Important Notes

- If any DELETE fails due to a missing table, skip it and continue with the next statement.
- The `auth.users` delete must happen BEFORE `public.users` delete (or use subquery as shown) to avoid FK issues if there's a trigger cascade.
- Always preserve users with `role = 'admin'` or `role = 'groomer'`.
