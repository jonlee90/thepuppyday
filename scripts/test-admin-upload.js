/**
 * Test Admin Upload to service-images bucket
 * Verifies that an admin user can upload images after RLS policies are applied
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

// Create client with anon key (simulating client-side request)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAdminUpload() {
  console.log('Testing admin upload to service-images bucket...\n')

  // You'll need to provide admin credentials
  const adminEmail = process.argv[2] || 'admin@example.com'
  const adminPassword = process.argv[3] || 'admin123'

  console.log(`Attempting to sign in as: ${adminEmail}`)

  // Sign in as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  })

  if (authError) {
    console.error('❌ Auth error:', authError.message)
    console.log('\nUsage: node test-admin-upload.js <admin-email> <admin-password>')
    return
  }

  console.log('✅ Signed in successfully')
  console.log('   User ID:', authData.user.id)
  console.log('   Email:', authData.user.email)

  // Verify user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (userError) {
    console.error('❌ Error fetching user role:', userError.message)
    return
  }

  console.log('   Role:', userData.role)

  if (userData.role !== 'admin') {
    console.error('❌ User is not an admin! Current role:', userData.role)
    return
  }

  // Create a test image file (1x1 PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const testImageBuffer = Buffer.from(testImageBase64, 'base64')

  const fileName = `test-${Date.now()}.png`
  const filePath = `services/${fileName}`

  console.log('\nAttempting to upload test image...')
  console.log('   File path:', filePath)

  // Attempt upload
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('service-images')
    .upload(filePath, testImageBuffer, {
      contentType: 'image/png',
      upsert: false
    })

  if (uploadError) {
    console.error('❌ Upload failed:', uploadError.message)
    console.error('   Error details:', uploadError)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Ensure RLS policies are applied (run fix-storage-rls.sql)')
    console.log('   2. Verify bucket exists and is public')
    console.log('   3. Check user role is exactly "admin" in users table')
    return
  }

  console.log('✅ Upload successful!')
  console.log('   Path:', uploadData.path)

  // Get public URL
  const { data: urlData } = supabase
    .storage
    .from('service-images')
    .getPublicUrl(filePath)

  console.log('   Public URL:', urlData.publicUrl)

  // Clean up - delete test file
  console.log('\nCleaning up test file...')
  const { error: deleteError } = await supabase
    .storage
    .from('service-images')
    .remove([filePath])

  if (deleteError) {
    console.warn('⚠️  Could not delete test file:', deleteError.message)
  } else {
    console.log('✅ Test file deleted')
  }

  // Sign out
  await supabase.auth.signOut()
  console.log('\n✅ Test complete - admin upload works!')
}

testAdminUpload().catch(error => {
  console.error('❌ Test failed:', error.message)
  process.exit(1)
})
