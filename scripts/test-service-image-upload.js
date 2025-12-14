/**
 * Test script for service image upload
 * This script simulates an image upload to verify the storage bucket is working
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jajbtwgbhrkvgxvvruaa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphamJ0d2diaHJrdmd4dnZydWFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NDM5OSwiZXhwIjoyMDgwNjMwMzk5fQ.PYD3RQt-Ze3wos8UPmQbkgo8JLGl_9AsX5VA-9WXov4';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpload() {
  console.log('Testing service image upload...\n');

  // Create a simple test image buffer (1x1 pixel PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const fileName = `test-${Date.now()}.png`;
  const filePath = `services/${fileName}`;

  console.log('1. Uploading test image to storage...');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('service-images')
    .upload(filePath, testImageBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    console.error('❌ Upload failed:', uploadError);
    return;
  }

  console.log('✅ Upload successful:', uploadData);

  console.log('\n2. Getting public URL...');
  const { data: urlData } = supabase.storage
    .from('service-images')
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    console.error('❌ Failed to get public URL');
    return;
  }

  console.log('✅ Public URL:', urlData.publicUrl);

  console.log('\n3. Listing files in bucket...');
  const { data: files, error: listError } = await supabase.storage
    .from('service-images')
    .list('services', {
      limit: 10,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (listError) {
    console.error('❌ List failed:', listError);
    return;
  }

  console.log('✅ Files in services folder:', files?.length || 0);
  if (files && files.length > 0) {
    console.log('Recent files:');
    files.slice(0, 5).forEach((file) => {
      console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
    });
  }

  console.log('\n4. Cleaning up test file...');
  const { error: deleteError } = await supabase.storage
    .from('service-images')
    .remove([filePath]);

  if (deleteError) {
    console.error('❌ Delete failed:', deleteError);
    console.log('Note: Test file was uploaded but not deleted. You may want to remove it manually.');
    return;
  }

  console.log('✅ Test file cleaned up');

  console.log('\n✅ All tests passed! Service image upload is working correctly.');
  console.log('\nYou can now upload service images via the admin panel at /admin/services');
}

testUpload().catch(console.error);
