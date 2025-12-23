/**
 * Script to mark all past appointments as completed
 * Usage: node scripts/complete-past-appointments-simple.mjs
 *
 * This script uses the Supabase service role key to bypass RLS
 * and update all appointments scheduled today or earlier to "completed" status.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

// Simple env file parser
function loadEnv(filePath) {
  const env = {};
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;

      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      env[key] = value;
    }
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
  }
  return env;
}

const env = loadEnv(envPath);

// Get environment variables
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  console.error(`\nFound in .env.local:`);
  console.error(`  SUPABASE_URL: ${SUPABASE_URL ? 'Set' : 'Missing'}`);
  console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'}`);
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function completePastAppointments() {
  console.log('🚀 Starting to update past appointments...\n');

  try {
    // Get current date/time
    const now = new Date().toISOString();
    console.log(`📅 Current date/time: ${now}\n`);

    // First, let's check how many appointments will be affected
    const { data: appointmentsToUpdate, error: checkError } = await supabase
      .from('appointments')
      .select('id, scheduled_at, status')
      .lte('scheduled_at', now)
      .not('status', 'in', '(completed,cancelled,no_show)')
      .order('scheduled_at', { ascending: false });

    if (checkError) {
      console.error('❌ Error checking appointments:', checkError);
      process.exit(1);
    }

    const count = appointmentsToUpdate?.length || 0;
    console.log(`📊 Found ${count} appointment(s) to update\n`);

    if (count === 0) {
      console.log('✅ No appointments need to be updated. All past appointments are already in a final state.');
      process.exit(0);
    }

    // Display appointments that will be updated
    console.log('📋 Appointments that will be marked as completed:');
    console.log('─'.repeat(80));
    appointmentsToUpdate.forEach((apt, index) => {
      const scheduledDate = new Date(apt.scheduled_at).toLocaleString();
      console.log(`${index + 1}. ID: ${apt.id}`);
      console.log(`   Scheduled: ${scheduledDate}`);
      console.log(`   Current Status: ${apt.status}`);
      console.log('');
    });

    console.log('⚠️  About to update these appointments to "completed" status...\n');

    // Perform the update
    const { data: updatedAppointments, error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'completed', updated_at: now })
      .lte('scheduled_at', now)
      .not('status', 'in', '(completed,cancelled,no_show)')
      .select('id, scheduled_at, status');

    if (updateError) {
      console.error('❌ Error updating appointments:', updateError);
      process.exit(1);
    }

    const updatedCount = updatedAppointments?.length || 0;
    console.log(`\n✅ Successfully updated ${updatedCount} appointment(s) to "completed" status`);

    if (updatedCount > 0) {
      console.log('\n📝 Summary:');
      console.log(`   Total appointments updated: ${updatedCount}`);
      console.log(`   Status changed: → completed`);
      console.log(`   Updated at: ${new Date().toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
completePastAppointments();
