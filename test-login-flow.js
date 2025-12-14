/**
 * Test script to diagnose login flow issues
 * Run with: node test-login-flow.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jajbtwgbhrkvgxvvruaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphamJ0d2diaHJrdmd4dnZydWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTQzOTksImV4cCI6MjA4MDYzMDM5OX0.8W5S-125MCxqrWvE32FgeuERumlJTUZUMDA5p_rZGtI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLoginFlow() {
  console.log('=== Testing Login Flow ===\n');

  // Test 1: Check if we can connect to Supabase
  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('   ❌ Connection error:', error.message);
    } else {
      console.log('   ✅ Connected to Supabase successfully');
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err.message);
  }

  // Test 2: List existing users
  console.log('\n2. Checking existing users in database...');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .limit(10);

    if (error) {
      console.error('   ❌ Error fetching users:', error.message);
    } else if (!users || users.length === 0) {
      console.log('   ⚠️  No users found in database!');
    } else {
      console.log(`   ✅ Found ${users.length} user(s):`);
      users.forEach(u => {
        console.log(`      - ${u.email} (${u.role}) - ${u.first_name} ${u.last_name}`);
      });
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err.message);
  }

  // Test 3: Try to sign in with demo credentials
  console.log('\n3. Testing sign in with demo@example.com...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'password123',
    });

    if (error) {
      console.error('   ❌ Sign in failed:', error.message);
      console.log('   💡 The user might not exist in Supabase Auth yet.');
    } else {
      console.log('   ✅ Sign in successful!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email:', data.user?.email);

      // Check if user exists in public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.log('   ⚠️  User exists in auth but NOT in public.users table!');
      } else {
        console.log('   ✅ User found in public.users table');
        console.log('   Role:', userData.role);
      }

      // Sign out
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err.message);
  }

  console.log('\n=== Test Complete ===\n');
}

testLoginFlow();
