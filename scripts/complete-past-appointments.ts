/**
 * Script to mark all past appointments as completed
 * Usage: npx tsx scripts/complete-past-appointments.ts
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

async function completePastAppointments() {
  console.log('Starting to update past appointments...');

  const supabase = createServiceRoleClient();

  try {
    // Get current date/time
    const now = new Date().toISOString();
    console.log(`Current date/time: ${now}`);

    // First, let's check how many appointments will be affected
    const { data: appointmentsToUpdate, error: checkError } = await supabase
      .from('appointments')
      .select('id, scheduled_at, status')
      .lte('scheduled_at', now)
      .not('status', 'in', '(completed,cancelled,no_show)');

    if (checkError) {
      console.error('Error checking appointments:', checkError);
      process.exit(1);
    }

    console.log(`\nFound ${appointmentsToUpdate?.length || 0} appointments to update:`);

    if (appointmentsToUpdate && appointmentsToUpdate.length > 0) {
      console.log('\nAppointments that will be marked as completed:');
      appointmentsToUpdate.forEach(apt => {
        console.log(`  - ID: ${apt.id}, Scheduled: ${apt.scheduled_at}, Status: ${apt.status}`);
      });

      // Now update them
      const { data: updatedAppointments, error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .lte('scheduled_at', now)
        .not('status', 'in', '(completed,cancelled,no_show)')
        .select('id, scheduled_at, status');

      if (updateError) {
        console.error('Error updating appointments:', updateError);
        process.exit(1);
      }

      console.log(`\n✅ Successfully updated ${updatedAppointments?.length || 0} appointment(s) to "completed" status`);
    } else {
      console.log('\n✅ No appointments need to be updated.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

completePastAppointments();
