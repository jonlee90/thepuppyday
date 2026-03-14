/**
 * Report Card Page
 * Create/edit report card for an appointment
 * Server Component that fetches appointment data
 */

import { notFound } from 'next/navigation';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { ReportCardForm } from '@/components/admin/report-cards/ReportCardForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportCardPage({ params }: PageProps) {
  const { id: appointmentId } = await params;

  // Auth check with session client (guaranteed by middleware + AdminLayout)
  const authSupabase = await createServerSupabaseClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) notFound();

  // Data query with service role client to bypass RLS
  const supabase = createServiceRoleClient();

  const { data: appointment, error: appointmentError } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      status,
      pet:pets (
        id,
        name,
        owner:users!pets_owner_id_fkey (
          id,
          first_name,
          last_name
        )
      ),
      service:services (
        id,
        name
      )
    `)
    .eq('id', appointmentId)
    .single();

  if (appointmentError || !appointment) {
    notFound();
  }

  // Extract data for form
  const petData = appointment.pet as unknown as {
    id: string;
    name: string;
    owner: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };

  const serviceData = appointment.service as unknown as {
    id: string;
    name: string;
  };

  const petName = petData?.name || 'Unknown Pet';
  const customerName = petData?.owner
    ? `${petData.owner.first_name} ${petData.owner.last_name}`
    : 'Unknown Customer';
  const serviceName = serviceData?.name || 'Unknown Service';

  return (
    <div className="min-h-screen bg-[#F8EEE5] py-8">
      <ReportCardForm
        appointmentId={appointmentId}
        petName={petName}
        serviceName={serviceName}
        customerName={customerName}
        appointmentDate={appointment.scheduled_at}
      />
    </div>
  );
}
