/**
 * Apply Storage RLS Policies
 * Creates or updates RLS policies for the service-images storage bucket
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  if (error) {
    // Try alternative: execute via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      throw new Error(`SQL execution failed: ${error?.message || response.statusText}`)
    }

    return await response.json()
  }
  return data
}

async function applyStoragePolicies() {
  console.log('Applying storage RLS policies for service-images bucket...\n')

  try {
    // Step 1: Ensure bucket exists
    console.log('Step 1: Checking/creating service-images bucket...')

    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.id === 'service-images')

    if (!bucketExists) {
      console.log('  Creating service-images bucket...')
      const { data: newBucket, error: createError } = await supabase
        .storage
        .createBucket('service-images', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        })

      if (createError) {
        console.error('  ❌ Failed to create bucket:', createError)
      } else {
        console.log('  ✅ Bucket created successfully')
      }
    } else {
      console.log('  ✅ Bucket already exists')
    }

    // Step 2: Enable RLS on storage.objects
    console.log('\nStep 2: Enabling RLS on storage.objects...')

    // We'll execute the SQL statements directly using a simpler approach
    // Since we can't easily execute raw SQL, we'll use the migration file

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20241212_service_images_storage_bucket.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('  Migration SQL loaded from:', migrationPath)
    console.log('\n  ⚠️  Please apply this migration manually in Supabase Dashboard:')
    console.log('  1. Go to https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa/sql/new')
    console.log('  2. Copy and paste the following SQL:')
    console.log('\n' + '='.repeat(80))
    console.log(migrationSQL)
    console.log('='.repeat(80) + '\n')
    console.log('  3. Click "Run" to execute')
    console.log('\n  OR use Supabase CLI:')
    console.log('  $ npx supabase db push')

    console.log('\n✅ Migration SQL ready to apply')
    console.log('\nAfter applying the migration, the following policies will be active:')
    console.log('  1. Public can view service images (SELECT)')
    console.log('  2. Admins can upload service images (INSERT)')
    console.log('  3. Admins can update service images (UPDATE)')
    console.log('  4. Admins can delete service images (DELETE)')

  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

applyStoragePolicies().catch(console.error)
