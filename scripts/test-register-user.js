/**
 * Test user registration programmatically
 * This creates a test user to verify the registration flow works
 *
 * Run with: node scripts/test-register-user.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jajbtwgbhrkvgxvvruaa.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphamJ0d2diaHJrdmd4dnZydWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTQzOTksImV4cCI6MjA4MDYzMDM5OX0.8W5S-125MCxqrWvE32FgeuERumlJTUZUMDA5p_rZGtI';

// Use anon key to simulate real user registration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRegistration() {
  console.log('=== Testing User Registration ===\n');

  // Generate unique email using timestamp (keep it short)
  const timestamp = Math.floor(Date.now() / 1000); // Use seconds instead of milliseconds
  const testUser = {
    email: `test${timestamp}@mail.com`,
    password: 'TestPass123',
    firstName: 'Test',
    lastName: 'User',
    phone: '+15551234567',
  };

  console.log('Attempting to register user:');
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Password: ${testUser.password}`);
  console.log(`  Name: ${testUser.firstName} ${testUser.lastName}`);
  console.log(`  Phone: ${testUser.phone}\n`);

  try {
    // Step 1: Sign up the user (same as form does)
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          phone: testUser.phone,
        },
      },
    });

    if (authError) {
      console.error('   ❌ Auth signup failed:', authError.message);
      return;
    }

    console.log('   ✅ Auth user created');
    console.log(`   User ID: ${authData.user?.id}\n`);

    // Step 2: Wait a moment for trigger to fire
    console.log('Step 2: Waiting for trigger to create public.users record...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Verify user exists in public.users
    console.log('Step 3: Verifying public.users record...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('   ❌ User not found in public.users:', userError.message);
      console.error('   The trigger may not be working correctly!');
      return;
    }

    console.log('   ✅ User record found in database');
    console.log('   Details:');
    console.log(`      - ID: ${userData.id}`);
    console.log(`      - Email: ${userData.email}`);
    console.log(`      - Name: ${userData.first_name} ${userData.last_name}`);
    console.log(`      - Phone: ${userData.phone || 'Not provided'}`);
    console.log(`      - Role: ${userData.role}`);
    console.log(`      - Created: ${userData.created_at}\n`);

    // Step 4: Test login
    console.log('Step 4: Testing login with new credentials...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (loginError) {
      console.error('   ❌ Login failed:', loginError.message);
      return;
    }

    console.log('   ✅ Login successful\n');

    // Success summary
    console.log('=== Test Passed! ===\n');
    console.log('✅ Registration flow is working correctly!');
    console.log('✅ Trigger creates public.users record automatically');
    console.log('✅ User can login immediately after registration');
    console.log('\nTest user credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log('\nYou can now login with these credentials at:');
    console.log('   http://localhost:3000/login');

    // Clean up - sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testRegistration();
