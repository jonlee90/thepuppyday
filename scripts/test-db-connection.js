/**
 * Test script to verify Supabase database connection and check services tables
 * Run with: node scripts/test-db-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  console.log('URL:', supabaseUrl);
  console.log('Service Key:', supabaseKey.substring(0, 20) + '...\n');

  try {
    // Test 1: Check services table exists and has correct structure
    console.log('1. Checking services table...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(5);

    if (servicesError) {
      console.error('   ERROR:', servicesError.message);
      console.error('   Details:', servicesError);
    } else {
      console.log('   SUCCESS: Found', services?.length || 0, 'services');
      if (services && services.length > 0) {
        console.log('   Sample:', JSON.stringify(services[0], null, 2));
      }
    }

    // Test 2: Check service_prices table
    console.log('\n2. Checking service_prices table...');
    const { data: prices, error: pricesError } = await supabase
      .from('service_prices')
      .select('*')
      .limit(5);

    if (pricesError) {
      console.error('   ERROR:', pricesError.message);
      console.error('   Details:', pricesError);
    } else {
      console.log('   SUCCESS: Found', prices?.length || 0, 'price records');
      if (prices && prices.length > 0) {
        console.log('   Sample:', JSON.stringify(prices[0], null, 2));
      }
    }

    // Test 3: Try to create a test service
    console.log('\n3. Testing CREATE operation...');
    const testService = {
      name: 'Test Service ' + Date.now(),
      description: 'Test service for verification',
      duration_minutes: 60,
      image_url: null,
      is_active: true,
      display_order: 999,
    };

    const { data: newService, error: createError } = await supabase
      .from('services')
      .insert(testService)
      .select()
      .single();

    if (createError) {
      console.error('   ERROR:', createError.message);
      console.error('   Details:', createError);
    } else {
      console.log('   SUCCESS: Created service with ID:', newService.id);

      // Test 4: Create service prices
      console.log('\n4. Testing service_prices CREATE...');
      const testPrices = [
        { service_id: newService.id, size: 'small', price: 40.00 },
        { service_id: newService.id, size: 'medium', price: 55.00 },
        { service_id: newService.id, size: 'large', price: 70.00 },
        { service_id: newService.id, size: 'xlarge', price: 85.00 },
      ];

      const { data: newPrices, error: pricesCreateError } = await supabase
        .from('service_prices')
        .insert(testPrices)
        .select();

      if (pricesCreateError) {
        console.error('   ERROR:', pricesCreateError.message);
      } else {
        console.log('   SUCCESS: Created', newPrices?.length || 0, 'price records');
      }

      // Test 5: Update service
      console.log('\n5. Testing UPDATE operation...');
      const { data: updatedService, error: updateError } = await supabase
        .from('services')
        .update({
          name: 'Updated Test Service',
          image_url: 'https://example.com/image.jpg'
        })
        .eq('id', newService.id)
        .select()
        .single();

      if (updateError) {
        console.error('   ERROR:', updateError.message);
        console.error('   Details:', updateError);
      } else {
        console.log('   SUCCESS: Updated service:', updatedService.name);
        console.log('   Image URL:', updatedService.image_url);
      }

      // Test 6: Read with join
      console.log('\n6. Testing READ with prices JOIN...');
      const { data: serviceWithPrices, error: joinError } = await supabase
        .from('services')
        .select(`
          *,
          prices:service_prices(*)
        `)
        .eq('id', newService.id)
        .single();

      if (joinError) {
        console.error('   ERROR:', joinError.message);
      } else {
        console.log('   SUCCESS: Service with prices');
        console.log('   Prices count:', serviceWithPrices.prices?.length || 0);
      }

      // Test 7: Delete (cleanup)
      console.log('\n7. Testing DELETE operation...');

      // Delete prices first
      const { error: deletePricesError } = await supabase
        .from('service_prices')
        .delete()
        .eq('service_id', newService.id);

      if (deletePricesError) {
        console.error('   ERROR deleting prices:', deletePricesError.message);
      }

      // Delete service
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', newService.id);

      if (deleteError) {
        console.error('   ERROR deleting service:', deleteError.message);
      } else {
        console.log('   SUCCESS: Deleted test service and prices');
      }
    }

    console.log('\n=== ALL TESTS COMPLETED ===\n');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
