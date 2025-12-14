/**
 * Test script to verify Supabase authentication
 * Run with: node test-supabase-auth.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jajbtwgbhrkvgxvvruaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphamJ0d2diaHJrdmd4dnZydWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTQzOTksImV4cCI6MjA4MDYzMDM5OX0.8W5S-125MCxqrWvE32FgeuERumlJTUZUMDA5p_rZGtI';

async function testAuth() {
  console.log('Creating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  console.log('Testing signInWithPassword...');
  console.log('This will attempt to sign in with test credentials');

  // Test with a dummy email - this should fail but we should get a response
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });

    if (error) {
      console.log('Got error response (expected):', error.message);
      console.log('Error code:', error.status);
    } else {
      console.log('Sign in successful:', data);
    }
  } catch (err) {
    console.error('Unexpected error during sign in:', err);
  }

  console.log('\nTesting connection to users table...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);

    if (error) {
      console.error('Error querying users table:', error);
    } else {
      console.log('Successfully queried users table');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Unexpected error querying users:', err);
  }
}

testAuth().catch(console.error);
