/**
 * Apply the user creation trigger migration
 * Run with: node scripts/apply-trigger-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jajbtwgbhrkvgxvvruaa.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphamJ0d2diaHJrdmd4dnZydWFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NDM5OSwiZXhwIjoyMDgwNjMwMzk5fQ.PYD3RQt-Ze3wos8UPmQbkgo8JLGl_9AsX5VA-9WXov4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyTriggerMigration() {
  console.log('=== Applying User Creation Trigger Migration ===\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20241211_create_user_on_signup.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file: 20241211_create_user_on_signup.sql');
  console.log('📏 File size:', (sql.length / 1024).toFixed(2), 'KB\n');

  console.log('⚠️  IMPORTANT: This script cannot execute SQL directly.');
  console.log('Supabase requires using the SQL Editor for complex DDL operations.\n');

  console.log('Please follow these steps:\n');
  console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa');
  console.log('2. Navigate to: SQL Editor (left sidebar)');
  console.log('3. Click: New query');
  console.log('4. Copy and paste the SQL below:');
  console.log('\n' + '='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80) + '\n');
  console.log('5. Click: Run (or press Ctrl+Enter)');
  console.log('6. Verify you see: "Success. No rows returned"');
  console.log('\nAfter applying the migration:');
  console.log('- New user registrations will automatically create public.users records');
  console.log('- Test registration at: http://localhost:3000/register');
  console.log('- Or run: node scripts/test-register-user.js\n');
}

applyTriggerMigration();
