#!/usr/bin/env tsx

import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs/promises'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

// Extract project reference from URL (e.g., https://jajbtwgbhrkvgxvvruaa.supabase.co)
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('❌ Could not extract project reference from URL:', supabaseUrl)
  process.exit(1)
}

// Construct Postgres connection string
// Format: postgresql://postgres.[PROJECT_REF]:[SERVICE_ROLE_KEY]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
const connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

interface MigrationResult {
  name: string
  success: boolean
  error?: string
  statements: number
  duration: number
}

async function executeMigration(client: Client, migrationFile: string): Promise<MigrationResult> {
  const startTime = Date.now()
  const migrationName = path.basename(migrationFile, '.sql')

  console.log(`\n${'='.repeat(80)}`)
  console.log(`Migration: ${migrationName}`)
  console.log('='.repeat(80))

  try {
    // Read migration file
    const filePath = path.resolve(process.cwd(), 'supabase', 'migrations', migrationFile)
    const content = await fs.readFile(filePath, 'utf-8')

    // Split into statements
    const statements = content
      .split('\n')
      .filter(line => {
        const trimmed = line.trim()
        return trimmed.length > 0 && !trimmed.startsWith('--')
      })
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    console.log(`Executing ${statements.length} statements...`)

    let successCount = 0
    let failCount = 0
    let lastError: string | undefined

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      const stmtPreview = stmt.length > 70 ? stmt.substring(0, 67) + '...' : stmt
      const stmtPreviewClean = stmtPreview.replace(/\n/g, ' ').replace(/\s+/g, ' ')

      process.stdout.write(`  [${i + 1}/${statements.length}] ${stmtPreviewClean}`)

      try {
        await client.query(stmt)
        console.log(' ✅')
        successCount++
      } catch (error: any) {
        console.log(` ❌`)

        // Check if error is expected (IF NOT EXISTS, IF EXISTS)
        const isExpectedError =
          error.message?.includes('already exists') ||
          error.message?.includes('does not exist') ||
          error.message?.includes('duplicate')

        if (isExpectedError) {
          console.log(`      (Skipped: ${error.message.split('\n')[0]})`)
          successCount++ // Count as success since it's expected
        } else {
          console.log(`      Error: ${error.message}`)
          lastError = error.message
          failCount++
        }
      }
    }

    const duration = Date.now() - startTime

    console.log(`\nResult: ${successCount} succeeded, ${failCount} failed (${(duration / 1000).toFixed(2)}s)`)

    return {
      name: migrationName,
      success: failCount === 0,
      error: lastError,
      statements: statements.length,
      duration
    }
  } catch (err: any) {
    const duration = Date.now() - startTime
    console.error(`\n❌ Failed to read or execute migration: ${err.message}`)

    return {
      name: migrationName,
      success: false,
      error: err.message,
      statements: 0,
      duration
    }
  }
}

async function main() {
  console.log('Schema Cleanup Migration Execution')
  console.log('===================================')
  console.log(`Project: ${projectRef}`)
  console.log('')

  // Create PostgreSQL client
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully')

    const migrations = [
      '20251227_schema_cleanup_01_indexes.sql',
      '20251227_schema_cleanup_02_drop_unused.sql',
      '20251227_schema_cleanup_03_enum_constraints.sql',
      '20251227_schema_cleanup_04_optimize.sql'
    ]

    const results: MigrationResult[] = []

    // Execute each migration
    for (const migration of migrations) {
      const result = await executeMigration(client, migration)
      results.push(result)

      // Continue even if migration fails
      if (!result.success) {
        console.log('\n⚠️  Migration had errors. Continuing to next migration...\n')
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(80))
    console.log('')

    results.forEach(result => {
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED'
      const duration = (result.duration / 1000).toFixed(2)
      console.log(`${status}: ${result.name} (${result.statements} statements, ${duration}s)`)
      if (result.error && result.success === false) {
        console.log(`           Last Error: ${result.error}`)
      }
    })

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    console.log('')
    console.log('='.repeat(80))
    console.log(`Total: ${successCount}/${totalCount} migrations successful`)
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`)
    console.log('='.repeat(80))

    if (successCount === totalCount) {
      console.log('\n🎉 All migrations completed successfully!')
      console.log('\nNext steps:')
      console.log('  1. Verify indexes: SELECT indexname FROM pg_indexes WHERE schemaname = \'public\' AND indexname LIKE \'idx_%\';')
      console.log('  2. Monitor performance: Check Supabase Dashboard → Database → Query Performance')
      console.log('  3. Check constraints: SELECT conname FROM pg_constraint WHERE conname LIKE \'chk_%\';')
    } else {
      console.log('\n⚠️  Some migrations had errors (see details above)')
      console.log('\nNote: Some errors may be expected (e.g., "already exists", "does not exist")')
      console.log('Review the summary to ensure critical operations succeeded.')
    }
  } catch (error: any) {
    console.error('\n❌ Connection error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Database connection closed')
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error: any) => {
  console.error('\n❌ Unhandled error:', error.message)
  process.exit(1)
})

main()
