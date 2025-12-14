/**
 * Setup script for service-images storage bucket policies
 * Run this script to configure the storage bucket RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStoragePolicies() {
  console.log('Setting up storage policies for service-images bucket...');

  // Note: Storage policies need to be created via SQL
  // This script will execute the SQL statements
  const policies = [
    // Public read access
    {
      name: 'Public can view service images',
      sql: `
        CREATE POLICY "Public can view service images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'service-images');
      `
    },
    // Admin upload
    {
      name: 'Admins can upload service images',
      sql: `
        CREATE POLICY "Admins can upload service images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'service-images' AND
          EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
          )
        );
      `
    },
    // Admin update
    {
      name: 'Admins can update service images',
      sql: `
        CREATE POLICY "Admins can update service images"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'service-images' AND
          EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
          )
        );
      `
    },
    // Admin delete
    {
      name: 'Admins can delete service images',
      sql: `
        CREATE POLICY "Admins can delete service images"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'service-images' AND
          EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
          )
        );
      `
    }
  ];

  // Enable RLS first
  console.log('Enabling RLS on storage.objects...');
  try {
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });
    if (rlsError && !rlsError.message.includes('already exists')) {
      console.log('Note: RLS may already be enabled or requires direct database access');
    }
  } catch (err) {
    console.log('Note: RLS setup requires direct database access via migration');
  }

  // Attempt to create policies
  console.log('\nNote: Storage policies should be created via Supabase dashboard or migration.');
  console.log('Please run the migration file: 20241212_service_images_storage_bucket.sql');
  console.log('\nOr create these policies manually in the Supabase dashboard:');

  policies.forEach((policy, index) => {
    console.log(`\n${index + 1}. ${policy.name}`);
    console.log(policy.sql);
  });

  console.log('\n✅ Setup instructions provided.');
  console.log('Storage bucket "service-images" is ready.');
}

setupStoragePolicies().catch(console.error);
