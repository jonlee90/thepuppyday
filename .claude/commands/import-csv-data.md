CSV Data Import - Import customers, pets, and appointments from CSV files

## Steps

1. Verify the CSV source files exist:
   - `docs/import-files/puppyday-customer-pet-import.csv` (331 data rows)
   - `docs/import-files/puppyday-appointments-import.csv` (526 data rows)

2. Run the import script in **dry-run mode** first:
   ```bash
   npx tsx scripts/import-csv-data.ts
   ```

3. Review the summary report output. Check for:
   - Error count should be 0 (or very low)
   - Expected counts: ~267 customers, ~330 pets, ~525 appointments, 4 FLEA add-ons
   - Any unmatched breeds or unmapped owner names

4. If the dry-run looks correct, ask the user for confirmation before proceeding.

5. Run with `--execute` to perform the actual import:
   ```bash
   npx tsx scripts/import-csv-data.ts --execute
   ```

6. Run post-import verification SQL queries via Supabase MCP:
   ```sql
   SELECT 'imported_users' AS label, COUNT(*) AS count
     FROM users WHERE email LIKE '%@puppyday.local'
   UNION ALL
   SELECT 'imported_pets', COUNT(*)
     FROM pets WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@puppyday.local')
   UNION ALL
   SELECT 'imported_appointments', COUNT(*)
     FROM appointments WHERE creation_method = 'csv_import'
   UNION ALL
   SELECT 'imported_addons', COUNT(*)
     FROM appointment_addons WHERE appointment_id IN (
       SELECT id FROM appointments WHERE creation_method = 'csv_import'
     );
   ```

7. Report results to the user.
