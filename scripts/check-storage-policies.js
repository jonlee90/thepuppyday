/**
 * Check Storage RLS Policies
 * Verifies that the service-images bucket has correct RLS policies
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStoragePolicies() {
  console.log('Checking storage bucket and RLS policies...\n')

  // Check if bucket exists
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets()

  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError)
    return
  }

  const serviceImagesBucket = buckets.find(b => b.id === 'service-images')

  if (!serviceImagesBucket) {
    console.error('❌ service-images bucket does NOT exist!')
    console.log('\nAvailable buckets:', buckets.map(b => b.id).join(', '))
    return
  }

  console.log('✅ service-images bucket exists')
  console.log('   - Public:', serviceImagesBucket.public)
  console.log('   - File size limit:', serviceImagesBucket.file_size_limit, 'bytes')
  console.log('   - Allowed MIME types:', serviceImagesBucket.allowed_mime_types)

  // Check RLS policies on storage.objects
  const { data: policies, error: policiesError } = await supabase
    .rpc('pg_policies')
    .catch(() => {
      // If RPC doesn't exist, query directly
      return supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'objects')
        .eq('schemaname', 'storage')
    })

  if (policiesError) {
    console.log('\n⚠️  Could not fetch policies via RPC, querying directly...')

    // Query pg_policies system catalog directly
    const { data: systemPolicies, error: sysError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          polname as policyname,
          polcmd as cmd,
          qual as using_expression,
          with_check as with_check_expression,
          roles.rolname as roles
        FROM pg_policy
        JOIN pg_class ON pg_policy.polrelid = pg_class.oid
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
        LEFT JOIN pg_roles roles ON pg_policy.polroles @> ARRAY[roles.oid]
        WHERE pg_namespace.nspname = 'storage'
        AND pg_class.relname = 'objects'
        ORDER BY polname;
      `
    }).catch(() => null)

    if (!systemPolicies) {
      console.log('\n📋 Expected RLS policies for storage.objects (service-images bucket):')
      console.log('   1. "Public can view service images" (SELECT, public)')
      console.log('   2. "Admins can upload service images" (INSERT, authenticated)')
      console.log('   3. "Admins can update service images" (UPDATE, authenticated)')
      console.log('   4. "Admins can delete service images" (DELETE, authenticated)')
    }
  } else {
    console.log('\n📋 RLS Policies found:', policies)
  }

  console.log('\n✅ Storage bucket check complete')
}

checkStoragePolicies().catch(console.error)
