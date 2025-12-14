/**
 * Seed test users into Supabase
 * Run with: node scripts/seed-test-users.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jajbtwgbhrkvgxvvruaa.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphamJ0d2diaHJrdmd4dnZydWFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NDM5OSwiZXhwIjoyMDgwNjMwMzk5fQ.PYD3RQt-Ze3wos8UPmQbkgo8JLGl_9AsX5VA-9WXov4';

// Use service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_USERS = [
  {
    email: 'admin@thepuppyday.com',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    phone: '+15551234567',
    role: 'admin',
  },
  {
    email: 'demo@example.com',
    password: 'password123',
    first_name: 'Demo',
    last_name: 'Customer',
    phone: '+15559876543',
    role: 'customer',
  },
  {
    email: 'sarah@example.com',
    password: 'password123',
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone: '+15551112233',
    role: 'customer',
  },
];

async function seedUsers() {
  console.log('=== Seeding Test Users ===\n');

  for (const user of TEST_USERS) {
    console.log(`Creating user: ${user.email}...`);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
        }
      });

      if (authError) {
        console.error(`   ❌ Auth creation failed: ${authError.message}`);
        continue;
      }

      console.log(`   ✅ Auth user created (ID: ${authData.user.id})`);

      // Create user in public.users table
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: user.role,
          avatar_url: null,
          preferences: {},
        });

      if (dbError) {
        console.error(`   ❌ Database insert failed: ${dbError.message}`);
      } else {
        console.log(`   ✅ User record created in database`);
      }

      console.log(`   📧 Login credentials: ${user.email} / ${user.password}\n`);

    } catch (err) {
      console.error(`   ❌ Unexpected error: ${err.message}\n`);
    }
  }

  console.log('=== Seeding Complete ===\n');
  console.log('Test Login Credentials:');
  console.log('------------------------');
  TEST_USERS.forEach(u => {
    console.log(`${u.role.toUpperCase().padEnd(10)} - ${u.email.padEnd(30)} / ${u.password}`);
  });
}

seedUsers();
