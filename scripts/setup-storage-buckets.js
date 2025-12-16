/**
 * Setup Script - Create Required Supabase Storage Buckets
 * Run this script to ensure all required storage buckets exist
 *
 * Usage: node scripts/setup-storage-buckets.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jajbtwgbhrkvgxvvruaa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphamJ0d2diaHJrdmd4dnZydWFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NDM5OSwiZXhwIjoyMDgwNjMwMzk5fQ.PYD3RQt-Ze3wos8UPmQbkgo8JLGl_9AsX5VA-9WXov4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Required storage buckets for The Puppy Day application
 */
const REQUIRED_BUCKETS = [
  {
    name: 'gallery-images',
    config: {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },
    description: 'Public gallery images for marketing'
  },
  {
    name: 'report-card-photos',
    config: {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },
    description: 'Before/after photos for grooming report cards'
  },
  {
    name: 'service-images',
    config: {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },
    description: 'Service icons and promotional images'
  }
];

async function setupStorageBuckets() {
  console.log('========================================');
  console.log('The Puppy Day - Storage Bucket Setup');
  console.log('========================================\n');

  try {
    // List existing buckets
    console.log('1. Checking existing buckets...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('✗ Error listing buckets:', listError.message);
      process.exit(1);
    }

    const existingBucketNames = existingBuckets.map(b => b.name);
    console.log(`   Found ${existingBuckets.length} existing bucket(s):`, existingBucketNames);
    console.log('');

    // Create missing buckets
    console.log('2. Creating missing buckets...\n');
    let createdCount = 0;
    let skippedCount = 0;

    for (const bucket of REQUIRED_BUCKETS) {
      const exists = existingBucketNames.includes(bucket.name);

      if (exists) {
        console.log(`   ⊘ ${bucket.name} - Already exists`);
        console.log(`     ${bucket.description}`);
        skippedCount++;
      } else {
        console.log(`   → Creating ${bucket.name}...`);

        const { data, error } = await supabase.storage.createBucket(
          bucket.name,
          bucket.config
        );

        if (error) {
          console.error(`   ✗ Failed to create ${bucket.name}:`, error.message);
        } else {
          console.log(`   ✓ ${bucket.name} - Created successfully`);
          console.log(`     ${bucket.description}`);
          createdCount++;
        }
      }
      console.log('');
    }

    // Summary
    console.log('========================================');
    console.log('Summary:');
    console.log(`  - Created: ${createdCount} bucket(s)`);
    console.log(`  - Skipped: ${skippedCount} bucket(s) (already exist)`);
    console.log(`  - Total required: ${REQUIRED_BUCKETS.length}`);
    console.log('========================================\n');

    if (createdCount > 0) {
      console.log('✓ Storage setup complete! All required buckets are now available.');
    } else {
      console.log('✓ All required buckets already exist. No changes needed.');
    }

  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupStorageBuckets().catch(console.error);
