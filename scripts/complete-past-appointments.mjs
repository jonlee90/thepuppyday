/**
 * Script to mark all past appointments as completed
 * Usage: node scripts/complete-past-appointments.mjs
 *
 * This script uses the Supabase service role key to bypass RLS
 * and update all appointments scheduled today or earlier to "completed" status.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
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

    // Ask for confirmation (in production, you might want to remove this)
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
