import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

async function executeMigration(name: string, statements: string[]) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Executing Migration: ${name}`)
  console.log('='.repeat(80))

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim()
    if (!stmt) continue

    const stmtPreview = stmt.length > 80 ? stmt.substring(0, 77) + '...' : stmt
    process.stdout.write(`  [${i + 1}/${statements.length}] ${stmtPreview}`)

    const { success, error } = await executeSQL(stmt)

    if (success) {
      console.log(' ✅')
      successCount++
    } else {
      console.log(` ❌\n      Error: ${error}`)
      failCount++
    }
  }

  console.log(`\nResult: ${successCount} succeeded, ${failCount} failed`)
  return failCount === 0
}

async function main() {
  console.log('Schema Cleanup Migration Execution')
  console.log('===================================\n')
  console.log(`Target: ${supabaseUrl}\n`)

  const results: { name: string; success: boolean }[] = []

  // Migration 1: Performance Indexes
  const migration1Success = await executeMigration(
    'add_performance_indexes',
    [
      'CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);',
      'CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled_at ON appointments(status, scheduled_at);',
      'CREATE INDEX IF NOT EXISTS idx_appointments_customer_scheduled ON appointments(customer_id, scheduled_at);',
      'CREATE INDEX IF NOT EXISTS idx_appointments_groomer_scheduled ON appointments(groomer_id, scheduled_at);',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
      'CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));',
      'CREATE INDEX IF NOT EXISTS idx_users_created_by_admin ON users(created_by_admin);',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key_unique ON settings(key);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_log_customer_created ON notifications_log(customer_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_log_status ON notifications_log(status);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_log_tracking_id ON notifications_log(tracking_id);',
      'CREATE INDEX IF NOT EXISTS idx_calendar_connections_admin_id ON calendar_connections(admin_id);',
      'CREATE INDEX IF NOT EXISTS idx_calendar_connections_last_sync ON calendar_connections(last_sync_at);',
      'CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_connection_created ON calendar_sync_log(connection_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_status ON calendar_sync_log(status);',
      'CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_appointment_id ON calendar_sync_log(appointment_id);',
      'CREATE INDEX IF NOT EXISTS idx_waitlist_customer_created ON waitlist(customer_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_waitlist_status_requested_date ON waitlist(status, requested_date);',
      'CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);',
      'CREATE INDEX IF NOT EXISTS idx_pets_breed_id ON pets(breed_id);',
      'CREATE INDEX IF NOT EXISTS idx_report_cards_appointment_id ON report_cards(appointment_id);',
      'CREATE INDEX IF NOT EXISTS idx_report_cards_groomer_id ON report_cards(groomer_id);',
      'CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_customer ON campaign_sends(campaign_id, customer_id);',
      'CREATE INDEX IF NOT EXISTS idx_campaign_sends_notification_log_id ON campaign_sends(notification_log_id);',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);',
      'CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);',
      'CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);'
    ]
  )
  results.push({ name: 'add_performance_indexes', success: migration1Success })

  // Migration 2: Drop Unused Structures
  const migration2Success = await executeMigration(
    'drop_unused_structures',
    [
      'DROP VIEW IF EXISTS groomer_commission_earnings;',
      'DROP VIEW IF EXISTS inactive_customer_profiles;',
      'DROP VIEW IF EXISTS notification_template_stats;',
      'ALTER TABLE customer_memberships DROP COLUMN IF EXISTS grooms_remaining;',
      'ALTER TABLE customer_memberships DROP COLUMN IF EXISTS grooms_used;'
    ]
  )
  results.push({ name: 'drop_unused_structures', success: migration2Success })

  // Migration 3: Add Enum Constraints
  const migration3Success = await executeMigration(
    'add_enum_constraints',
    [
      'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointments_status;',
      "ALTER TABLE appointments ADD CONSTRAINT chk_appointments_status CHECK (status IN ('pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'));",
      'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointments_payment_status;',
      "ALTER TABLE appointments ADD CONSTRAINT chk_appointments_payment_status CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));",
      'ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;',
      "ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('customer', 'admin', 'groomer'));",
      'ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS chk_waitlist_status;',
      "ALTER TABLE waitlist ADD CONSTRAINT chk_waitlist_status CHECK (status IN ('active', 'notified', 'booked', 'expired', 'cancelled'));",
      'ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS chk_notifications_log_status;',
      "ALTER TABLE notifications_log ADD CONSTRAINT chk_notifications_log_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'));",
      'ALTER TABLE reviews DROP CONSTRAINT IF EXISTS chk_reviews_destination;',
      "ALTER TABLE reviews ADD CONSTRAINT chk_reviews_destination CHECK (destination IN ('google', 'yelp', 'facebook', 'internal'));",
      'ALTER TABLE pets DROP CONSTRAINT IF EXISTS chk_pets_size;',
      "ALTER TABLE pets ADD CONSTRAINT chk_pets_size CHECK (size IN ('small', 'medium', 'large', 'xlarge'));",
      'ALTER TABLE calendar_sync_log DROP CONSTRAINT IF EXISTS chk_calendar_sync_log_status;',
      "ALTER TABLE calendar_sync_log ADD CONSTRAINT chk_calendar_sync_log_status CHECK (status IN ('success', 'failed', 'skipped'));"
    ]
  )
  results.push({ name: 'add_enum_constraints', success: migration3Success })

  // Migration 4: Optimize Tables
  const migration4Success = await executeMigration(
    'optimize_tables',
    [
      'ANALYZE appointments;',
      'ANALYZE users;',
      'ANALYZE pets;',
      'ANALYZE notifications_log;',
      'ANALYZE calendar_sync_log;',
      'ANALYZE waitlist;',
      'ANALYZE report_cards;'
    ]
  )
  results.push({ name: 'optimize_tables', success: migration4Success })

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('MIGRATION SUMMARY')
  console.log('='.repeat(80))

  results.forEach(({ name, success }) => {
    const status = success ? '✅ SUCCESS' : '❌ FAILED'
    console.log(`${status}: ${name}`)
  })

  const successCount = results.filter(r => r.success).length
  const totalCount = results.length

  console.log('\n' + '='.repeat(80))
  console.log(`Total: ${successCount}/${totalCount} migrations successful`)
  console.log('='.repeat(80))

  if (successCount === totalCount) {
    console.log('\n🎉 All migrations completed successfully!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some migrations failed. Please review the errors above.')
    process.exit(1)
  }
}

main()
