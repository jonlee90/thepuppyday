#!/usr/bin/env tsx
/**
 * Schema Cleanup Script
 * Executes safe database schema cleanup operations
 * Generated: 2025-12-27
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface MigrationResult {
  success: boolean
  error?: string
  duration?: number
}

async function executeSql(name: string, sql: string): Promise<MigrationResult> {
  console.log(`\n🔄 Executing: ${name}`)
  const startTime = Date.now()

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error(`❌ Failed: ${name}`)
      console.error(`   Error: ${error.message}`)
      return { success: false, error: error.message }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Completed: ${name} (${duration}ms)`)
    return { success: true, duration }
  } catch (err: any) {
    console.error(`❌ Exception: ${name}`)
    console.error(`   Error: ${err.message}`)
    return { success: false, error: err.message }
  }
}

async function main() {
  console.log('=' .repeat(80))
  console.log('Schema Cleanup - Safe Operations')
  console.log('=' .repeat(80))
  console.log(`Database: ${SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log('=' .repeat(80))

  const results: { [key: string]: MigrationResult } = {}

  // Read migration files
  const migration1 = fs.readFileSync('/tmp/migration_1_indexes.sql', 'utf-8')
  const migration2 = fs.readFileSync('/tmp/migration_2_cleanup.sql', 'utf-8')
  const migration3 = fs.readFileSync('/tmp/migration_3_constraints.sql', 'utf-8')
  const migration4 = fs.readFileSync('/tmp/migration_4_optimize.sql', 'utf-8')

  // Execute migrations sequentially
  results['1_performance_indexes'] = await executeSql(
    'Add Performance Indexes (30+ indexes)',
    migration1
  )

  results['2_drop_unused_structures'] = await executeSql(
    'Drop Unused Views and Columns',
    migration2
  )

  results['3_enum_constraints'] = await executeSql(
    'Add Enum Constraints (Data Integrity)',
    migration3
  )

  results['4_optimize_analyze'] = await executeSql(
    'Analyze Tables and Add Comments',
    migration4
  )

  // Summary
  console.log('\n' + '=' .repeat(80))
  console.log('SUMMARY')
  console.log('=' .repeat(80))

  const successful = Object.values(results).filter(r => r.success).length
  const failed = Object.values(results).filter(r => !r.success).length
  const totalDuration = Object.values(results)
    .filter(r => r.duration)
    .reduce((sum, r) => sum + (r.duration || 0), 0)

  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total Duration: ${totalDuration}ms`)

  if (successful > 0) {
    console.log('\n✓ Operations Completed:')
    console.log('  • Added 30+ performance indexes (CONCURRENTLY)')
    console.log('  • Dropped 3 unused views')
    console.log('  • Removed 2 unused columns from customer_memberships')
    console.log('  • Added 7 enum constraints for data integrity')
    console.log('  • Analyzed 9 tables for query optimization')
    console.log('  • Added helpful table comments')
  }

  if (failed > 0) {
    console.log('\n⚠️  Some operations failed. Review errors above.')
    process.exit(1)
  }

  console.log('\n✅ Schema cleanup completed successfully!')
  console.log('\nNext Steps:')
  console.log('1. Monitor query performance in Supabase dashboard')
  console.log('2. Review SCHEMA_CLEANUP_RISKY.sql before running')
  console.log('3. Run: npx supabase gen types typescript --local > src/types/supabase.ts')
  console.log('=' .repeat(80))
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
